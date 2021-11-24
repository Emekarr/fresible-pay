import { sign } from 'jsonwebtoken';

import AccessToken from '../models/access_token';
import RefreshToken from '../models/refresh_token';

class TokenService {
	async generateToken(
		ipAddress: string,
		id: string,
	): Promise<{ accessToken: string; refreshToken: string }> {
		// max allowed is 10
		const currentTokenCount = await RefreshToken.count({ owner: id });
		if (currentTokenCount >= 10) {
			await RefreshToken.findOneAndDelete({ owner: id })
				.sort({ createdAt: 1 })
				.exec();
		}
		const refreshToken = sign({ id }, process.env.JWT_REFRESH_KEY!, {
			expiresIn: '730h',
		});
		const accessToken = sign(
			{ id, refreshToken },
			process.env.JWT_ACCESS_KEY!,
			{
				expiresIn: '4h',
			},
		);

		await new RefreshToken({
			token: refreshToken,
			createdAt: Date.now(),
			ip_address: ipAddress,
			owner: id,
		}).save();
		await new AccessToken({
			token: accessToken,
			refresh_token: refreshToken,
			createdAt: Date.now(),
			ip_address: ipAddress,
			owner: id,
		}).save();

		return { accessToken, refreshToken };
	}
}

export default new TokenService();
