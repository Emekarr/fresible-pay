import { Request, Response, NextFunction } from 'express';

// models
import { IUserDocument, User } from '../models/user';

// services
import QueryService from '../services/query_service';
import UserServices from '../services/user_services';
import OtpService from '../services/otp_services';
import MessagingService from '../services/messaging_service';
import WalletService from '../services/wallet_service';
import { getAllTransactions } from '../services/transaction_service';

// utils
import CustomError from '../utils/error';
import ServerResponse from '../utils/response';

class UserController {
	async createUser(req: Request, res: Response, next: NextFunction) {
		try {
			const userDetails: User = req.body;
			QueryService.checkIfNull([userDetails]);
			const user = await UserServices.createUser(userDetails);
			if (!user) throw new CustomError('failed to create new user', 400);
			new ServerResponse('User created successfully').data(user).respond(res);
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
				maxAge: 14400,
			});
			res.cookie('REFRESH_TOKEN', loggedIn.refreshToken, {
				httpOnly: true,
				maxAge: 7884008,
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
			const { email, model } = req.body;
			QueryService.checkIfNull([email, model]);
			const user = await UserServices.findByEmail(email);
			if (!user) throw new CustomError('account not found', 404);
			const otp = OtpService.generateOtp();
			const savedOtp = await OtpService.saveOtp(otp, user._id, model as string);
			if (!savedOtp) throw new CustomError('Failed to create new otp', 400);
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
			const { match, otp } = await OtpService.verifyOtp(
				otpCode,
				user,
				req.socket.remoteAddress!,
			);
			if (!match || !otp) throw new CustomError('otp validation failed', 400);
			let account: IUserDocument | null;
			if (otp.model === 'user') {
				account = await UserServices.updateUser(user, {
					password,
				});
				if (!account) throw new CustomError('error updating password', 400);
			}

			new ServerResponse('password reset successful')
				.data({ user })
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
}

export default new UserController();
