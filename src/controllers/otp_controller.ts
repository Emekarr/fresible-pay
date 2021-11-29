import { Request, Response, NextFunction } from 'express';

// services
import OtpService from '../services/otp_services';
import MessagingService from '../services/messaging_service';
import QueryService from '../services/query_service';
import UserService from '../services/user_services';
import WalletService from '../services/wallet_service';
import RedisService from '../services/redis_service';

// utils
import CustomError from '../utils/error';
import ServerResponse from '../utils/response';

class OtpController {
	async requestOtp(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.query;
			const { email, model } = req.body;
			QueryService.checkIfNull([id, email, model]);
			const otp = OtpService.generateOtp();
			const savedOtp = await OtpService.saveOtp(
				otp,
				id as string,
				model as string,
			);
			if (!savedOtp) throw new CustomError('Failed to create new otp', 400);
			if (process.env.NODE_ENV === 'TEST' || process.env.NODE_ENV === 'DEV') {
				new ServerResponse('otp sent successfully').data({ otp }).respond(res);
			} else if (process.env.NODE_ENV === 'PROD') {
				const { success } = await MessagingService.sendEmail(
					email as string,
					`DO NOT SHARE THIS MESSAGE WITH ANYONE\nYour OTP is ${otp}`,
					'Fresible Wallet Account Verification.',
				);
				if (!success) throw new CustomError('Failed to send otp', 400);
				new ServerResponse('otp sent successfully').respond(res);
			} else {
				throw new CustomError('unknown environment running', 500);
			}
		} catch (err) {
			next(err);
		}
	}

	async verifyEmail(req: Request, res: Response, next: NextFunction) {
		try {
			const { otpCode, user } = req.body;
			QueryService.checkIfNull([otpCode, user]);
			let account = await UserService.findById(user);
			if (!account) throw new CustomError('user not found', 404);
			if (account?.verified_email)
				throw new CustomError('email already verified', 400);
			const { match, otp, accessToken, refreshToken } =
				await OtpService.verifyOtp(otpCode, user, req.socket.remoteAddress!);
			if (!match || !otp) throw new CustomError('otp validation failed', 400);
			if (otp.model === 'user') {
				account = await UserService.updateUser(user!, {
					verified_email: true,
				});
				if (!account) throw new CustomError('otp validation failed', 400);
				account.verified_email = true;
				const wallet = await WalletService.createWallet(account._id);
				if (!wallet) throw new CustomError('wallet creation failed', 400);
			} else {
				throw new CustomError('otp validation failed', 400);
			}
			await RedisService.updateTotalUserCount();
			res.cookie('ACCESS_TOKEN', accessToken, {
				httpOnly: true,
				maxAge: 14400,
			});
			res.cookie('REFRESH_TOKEN', refreshToken, {
				httpOnly: true,
				maxAge: 7884008,
			});
			new ServerResponse('Account email verified')
				.data({ user: account })
				.respond(res);
		} catch (err) {
			next(err);
		}
	}
}

export default new OtpController();
