import { Request, Response, NextFunction } from 'express';
import { v4 } from 'uuid';

// models
import { IUserDocument, User } from '../models/user';

// services
import QueryService from '../services/query_service';
import UserServices from '../services/user_services';
import OtpService from '../services/otp_services';
import MessagingService from '../services/messaging_service';
import WalletService from '../services/wallet_service';
import { getAllTransactions } from '../services/transaction_service';
import RedisService from '../services/redis_service';
import TokenService from '../services/token_service';

// utils
import CustomError from '../utils/error';
import ServerResponse from '../utils/response';

class UserController {
	async createUser(req: Request, res: Response, next: NextFunction) {
		try {
			const userDetails: User = req.body;
			QueryService.checkIfNull([userDetails]);
			const tempId = v4();
			const success = await RedisService.cacheUser(userDetails, tempId);
			if (!success)
				throw new CustomError('something went wrong while saving user', 400);
			new ServerResponse('User created successfully')
				.data({ tempId })
				.respond(res);
		} catch (err) {
			next(err);
		}
	}

	async loginUser(req: Request, res: Response, next: NextFunction) {
		try {
			const { username, email, password } = req.body;
			if (email) {
				QueryService.checkIfNull([email, password]);
			} else {
				QueryService.checkIfNull([username, password]);
			}
			let loggedIn: {
				loggedIn: boolean;
				accessToken: string | null;
				refreshToken: string | null;
				user: IUserDocument | null;
			};
			if (email) {
				loggedIn = await UserServices.loginUser(
					{ email: email as string },
					password,
					req.socket.remoteAddress!,
				);
			} else {
				loggedIn = await UserServices.loginUser(
					{ username },
					password,
					req.socket.remoteAddress!,
				);
			}
			if (!loggedIn.accessToken || !loggedIn.refreshToken)
				throw new CustomError('Failed to log in user', 400);

			res.cookie('ACCESS_TOKEN', loggedIn.accessToken, {
				httpOnly: true,
				maxAge: parseInt(process.env.ACCESS_TOKEN_LIFE as string, 10),
			});
			res.cookie('REFRESH_TOKEN', loggedIn.refreshToken, {
				httpOnly: true,
				maxAge: parseInt(process.env.REFRESH_TOKEN_LIFE as string, 10),
			});
			new ServerResponse('Login successful')
				.data({ user: loggedIn.user })
				.respond(res);
		} catch (err) {
			next(err);
		}
	}

	async requestPasswordResetOtp(
		req: Request,
		res: Response,
		next: NextFunction,
	) {
		try {
			const { email } = req.body;
			QueryService.checkIfNull([email]);
			const user = await UserServices.findByEmail(email);
			if (!user) throw new CustomError('account not found', 404);
			const otp = OtpService.generateOtp();
			const newOtp = await OtpService.saveOtp(otp, user._id);
			if (!newOtp) throw new CustomError('Failed to create new otp', 400);
			const isSaved = await RedisService.cacheOtp(newOtp);
			if (!isSaved) return;
			if (process.env.NODE_ENV === 'TEST' || process.env.NODE_ENV === 'DEV') {
				new ServerResponse('otp sent successfully')
					.data({ otp, user: user._id })
					.respond(res);
			} else if (process.env.NODE_ENV === 'PROD') {
				const { success } = await MessagingService.sendEmail(
					email as string,
					`DO NOT SHARE THIS MESSAGE WITH ANYONE\nYour OTP is ${otp}`,
					'Fresible Wallet Account Verification.',
				);
				if (!success) throw new CustomError('Failed to send otp', 400);
				new ServerResponse('otp sent successfully')
					.data({ user: user._id })
					.respond(res);
			} else {
				throw new CustomError('unknown environment running', 500);
			}
		} catch (err) {
			next(err);
		}
	}

	async resetPassword(req: Request, res: Response, next: NextFunction) {
		try {
			const { otpCode, user, password } = req.body;
			QueryService.checkIfNull([otpCode, user, password]);
			const { match } = await OtpService.verifyOtp(otpCode, user);
			if (!match) throw new CustomError('otp validation failed', 400);
			const account = await UserServices.updateUser(user, {
				password,
			});
			if (!account) throw new CustomError('error updating password', 400);
			const { newAccessToken, newRefreshToken } =
				await TokenService.generateToken(req.socket.remoteAddress!, user._id);
			if (!newAccessToken || !newRefreshToken)
				throw new Error('tokens could not be generated');
			res.cookie('ACCESS_TOKEN', newAccessToken, {
				httpOnly: true,
				maxAge: parseInt(process.env.ACCESS_TOKEN_LIFE as string, 10),
			});
			res.cookie('REFRESH_TOKEN', newRefreshToken, {
				httpOnly: true,
				maxAge: parseInt(process.env.REFRESH_TOKEN_LIFE as string, 10),
			});

			new ServerResponse('password reset successful')
				.data({ account })
				.respond(res);
		} catch (err) {
			next(err);
		}
	}

	async getAllUsers(req: Request, res: Response, next: NextFunction) {
		try {
			const { limit, page } = req.query;
			const users = await UserServices.getAllUsers(
				limit as string,
				page as string,
			);
			new ServerResponse('users retrieved and returned')
				.data(users)
				.respond(res);
		} catch (err) {
			next(err);
		}
	}

	async getUserDetails(req: Request, res: Response, next: NextFunction) {
		try {
			const { userId, limit, page } = req.query;
			QueryService.checkIfNull([userId]);
			const user = await UserServices.findById(userId as string);
			if (!user) throw new CustomError('User profile not found', 404);
			const wallet = await WalletService.findWalletByOwner(userId as string);
			const transactions = await getAllTransactions(
				wallet?._id,
				limit as string,
				page as string,
			);
			new ServerResponse('users retrieved and returned')
				.data({ user, wallet, transactions })
				.respond(res);
		} catch (err) {
			next(err);
		}
	}

	async retrievePlatformData(req: Request, res: Response, next: NextFunction) {
		try {
			const users = await RedisService.retrieveTotalUserCount();
			const wallets = users;
			const totalWalletBalance =
				await RedisService.retrieveTotalWalletBalance();
			const totalTransactionCount =
				await RedisService.retrieveTotalTransactionCount();

			new ServerResponse('Platform data retrieved')
				.data({ users, wallets, totalTransactionCount, totalWalletBalance })
				.respond(res);
		} catch (err) {
			next(err);
		}
	}
}

export default new UserController();
