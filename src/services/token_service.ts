import { sign } from 'jsonwebtoken';
import { Types } from 'mongoose';

import AccessToken from '../models/tokens/access_tokens';
import RefreshToken from '../models/tokens/refresh_tokens';

import RedisService from './redis_service';

class TokenService {
	async generateToken(
		ipAddress: string,
		id: string,
	): Promise<{ newAccessToken: AccessToken; newRefreshToken: RefreshToken }> {
		const newRefreshToken = new RefreshToken(
			sign({ id }, process.env.JWT_REFRESH_KEY!, {
				expiresIn: '730h',
			}),
			ipAddress,
			Date.now(),
			new Types.ObjectId(id),
		);
		const newAccessToken = new AccessToken(
			newRefreshToken.token,
			sign(
				{ id, refreshToken: newRefreshToken.token },
				process.env.JWT_ACCESS_KEY!,
				{
					expiresIn: '730h',
				},
			),
			ipAddress,
			Date.now(),
			new Types.ObjectId(id),
		);
		await RedisService.cacheRefreshTokens(id, newRefreshToken);
		await RedisService.cacheAccessTokens(id, newAccessToken);
		return { newAccessToken, newRefreshToken };
	}
}

export default new TokenService();
