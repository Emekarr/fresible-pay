import { sign } from 'jsonwebtoken';
import { Types } from 'mongoose';

import AccessToken from '../models/tokens/access_tokens';
import RefreshToken from '../models/tokens/refresh_tokens';

import RedisService from './redis_service';

class TokenService {
	async generateToken(
		ipAddress: string,
		id: string,
	): Promise<{
		newAccessToken: AccessToken;
		newRefreshToken: RefreshToken;
	}> {
		const newRefreshToken = await this.generateRefreshToken(ipAddress, id);
		const newAccessToken = await this.generateAccessToken(
			ipAddress,
			id,
			newRefreshToken.token,
		);
		return { newAccessToken, newRefreshToken };
	}

	async generateRefreshToken(
		ipAddress: string,
		id: string,
	): Promise<RefreshToken> {
		const newRefreshToken = new RefreshToken(
			sign({ id }, process.env.JWT_REFRESH_KEY!, {
				expiresIn: process.env.REFRESH_TOKEN_LIFE,
			}),
			ipAddress,
			new Date(),
			new Types.ObjectId(id),
		);
		await RedisService.cacheRefreshTokens(id, newRefreshToken);
		return newRefreshToken;
	}

	async generateAccessToken(
		ipAddress: string,
		id: string,
		refreshToken: string,
	): Promise<AccessToken> {
		const newAccessToken = new AccessToken(
			refreshToken,
			sign({ id, refreshToken }, process.env.JWT_ACCESS_KEY!, {
				expiresIn: process.env.ACCESS_TOKEN_LIFE,
			}),
			ipAddress,
			new Date(),
			new Types.ObjectId(id),
		);
		await RedisService.cacheAccessTokens(id, newAccessToken);
		return newAccessToken;
	}
}

export default new TokenService();
