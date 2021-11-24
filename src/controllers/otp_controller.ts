import { Request, Response, NextFunction } from 'express';

// services
import OtpService from '../services/otp_services';
import MessagingService from '../services/messaging_service';
import QueryService from '../services/query_service';
import UserService from '../services/user_services';

// utils
import CustomError from '../utils/error';
import ServerResponse from '../utils/response';

class OtpController {
	async requestOtp(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.query;
			const { email, model } = req.body;
			QueryService.checkIfNull([id, email]);
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

	async verify_otp(req: Request, res: Response, next: NextFunction) {
		try {
			const { otpCode, user } = req.body;
			QueryService.checkIfNull([otpCode, user]);
			const { match, otp } = await OtpService.verifyOtp(otpCode, user);
			if (!match || !otp) throw new CustomError('otp validation failed', 400);
			if (otp.model === 'user') {
				const account = await UserService.findById(otp.user.toString()!!);
				if (!account) throw new CustomError('otp validation failed', 400);
				const updatedAccount = await UserService.updateUser(account._id!!, {
					verified_email: false,
				});
				if (!updatedAccount)
					throw new CustomError('otp validation failed', 400);
			}

			new ServerResponse('Account email verified').respond(res);
		} catch (err) {
			next(err);
		}
	}
}

export default new OtpController();
