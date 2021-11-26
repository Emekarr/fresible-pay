import { Types } from 'mongoose';

import Otp, { OTPDocument } from '../models/otp';

import TokenService from './token_service';

class OtpService {
	generateOtp(): string {
		return Math.floor(100000 + Math.random() * 899999).toString();
	}

	async saveOtp(
		code: string,
		id: string,
		model: string,
	): Promise<OTPDocument | null> {
		let newOtp!: OTPDocument | null;
		try {
			await Otp.findOneAndDelete({ user: id });
			newOtp = await new Otp({
				code,
				user: id,
				createdAt: Date.now(),
				model,
			}).save();
		} catch (err) {
			newOtp = null;
		}
		return newOtp;
	}

	async verifyOtp(
		otp: string,
		user: string,
		ipAddress: string,
	): Promise<{
		match: boolean;
		otp: OTPDocument | null;
		accessToken: string | null;
		refreshToken: string | null;
	}> {
		let data: {
			match: boolean;
			otp: OTPDocument | null;
			accessToken: string | null;
			refreshToken: string | null;
		};
		try {
			const currentOtp = await this.findOtpByUser(user);
			if (!currentOtp) throw new Error('No otp found with that code');
			const isValid = await currentOtp!!.verify(otp);
			if (!isValid) throw new Error('Invalid otp code');
			await currentOtp.delete();
			const { newAccessToken, newRefreshToken } =
				await TokenService.generateToken(ipAddress, user);
			if (!newAccessToken || !newRefreshToken)
				throw new Error('tokens could not be generated');
			data = {
				match: true,
				otp: currentOtp,
				refreshToken: newRefreshToken.token,
				accessToken: newAccessToken.token,
			};
		} catch (err) {
			data = {
				match: false,
				otp: null,
				refreshToken: null,
				accessToken: null,
			};
		}
		return data;
	}

	async findOtpByUser(user: string): Promise<OTPDocument | null> {
		let otp!: OTPDocument | null;
		try {
			otp = await Otp.findOne({ user: new Types.ObjectId(user) });
		} catch (err) {
			otp = null;
		}
		return otp;
	}
}

export default new OtpService();
