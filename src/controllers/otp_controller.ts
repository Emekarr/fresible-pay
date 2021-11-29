import { Request, Response, NextFunction } from 'express';

// services
import OtpService from '../services/otp_services';
import MessagingService from '../services/messaging_service';
import QueryService from '../services/query_service';
import WalletService from '../services/wallet_service';
import RedisService from '../services/redis_service';
import UserServices from '../services/user_services';
import TokenService from '../services/token_service';

// utils
import CustomError from '../utils/error';
import ServerResponse from '../utils/response';

class OtpController {
	async requestOtp(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.query;
			const { email, model } = req.body;
			QueryService.checkIfNull([id, email, model]);
			const user = await RedisService.getUser(id as string);
			if (!user) throw new CustomError('user does not exist', 404);
			const otp = OtpService.generateOtp();
			const newOtp = await OtpService.saveOtp(otp, id as string);
			if (!newOtp) throw new CustomError('Failed to create new otp', 400);
			const isSaved = await RedisService.cacheOtp(newOtp);
			if (!isSaved) return;
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
			const { otpCode, userId } = req.body;
			QueryService.checkIfNull([otpCode, userId]);
			const { match } = await OtpService.verifyOtp(otpCode, userId);
			if (!match) throw new CustomError('otp validation failed', 400);
			const userDetails = await RedisService.getUser(userId);
			if (!userDetails) {
				new ServerResponse('User not found')
					.success(false)
					.statusCode(404)
					.respond(res);
				return;
			}
			const user = await UserServices.createUser(userDetails);
			if (!user) throw new CustomError('user creation failed', 400);
			UserServices.updateUser(user._id, {
				verified_email: true,
			});
			user.verified_email = true;
			const { newAccessToken, newRefreshToken } =
				await TokenService.generateToken(req.socket.remoteAddress!, user._id);
			if (!newAccessToken || !newRefreshToken)
				throw new Error('tokens could not be generated');
			const wallet = await WalletService.createWallet(user._id);
			if (!wallet) throw new CustomError('wallet creation failed', 400);
			await RedisService.updateTotalUserCount();
			res.cookie('ACCESS_TOKEN', newAccessToken, {
				httpOnly: true,
				maxAge: parseInt(process.env.ACCESS_TOKEN_LIFE as string, 10),
			});
			res.cookie('REFRESH_TOKEN', newRefreshToken, {
				httpOnly: true,
				maxAge: parseInt(process.env.REFRESH_TOKEN_LIFE as string, 10),
			});
			new ServerResponse('Account email verified').data({ user }).respond(res);
		} catch (err) {
			next(err);
		}
	}
}

export default new OtpController();
