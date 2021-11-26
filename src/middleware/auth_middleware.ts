/* eslint-disable consistent-return */
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// utils
import ServerResponse from '../utils/response';

// models
import User from '../models/user';

// services
import RedisService from '../services/redis_service';

export default async (req: Request, res: Response, next: NextFunction) => {
	try {
		const accessTokenHeader = req.headers.authorizationaccesstoken as string;
		const refreshTokenHeader = req.headers.authorizationrefreshtoken as string;
		if (
			!accessTokenHeader ||
			accessTokenHeader === ' ' ||
			!refreshTokenHeader ||
			refreshTokenHeader === ' '
		)
			return new ServerResponse('Tokens not provided')
				.statusCode(400)
				.success(false)
				.respond(res);

		let refreshDecoded: JwtPayload | undefined;
		jwt.verify(
			refreshTokenHeader,
			process.env.JWT_REFRESH_KEY!,
			(err, decoded) => {
				if (err) {
					if (err.name === 'TokenExpiredError') {
						return new ServerResponse(
							'Refresh token expired. Please sign in again.',
						)
							.statusCode(400)
							.success(false)
							.respond(res);
					}
				}
				refreshDecoded = decoded;
			},
		);

		if (!refreshDecoded)
			return new ServerResponse('Refresh token expired. Please sign in again.')
				.statusCode(400)
				.success(false)
				.respond(res);

		let authDecoded: JwtPayload | undefined;
		jwt.verify(
			accessTokenHeader,
			process.env.JWT_ACCESS_KEY!,
			(err, decoded) => {
				if (err) {
					if (err.name === 'TokenExpiredError') {
						return new ServerResponse(
							'Auth token expired. Please sign in again.',
						)
							.statusCode(400)
							.success(false)
							.respond(res);
					}
				}
				authDecoded = decoded;
			},
		);

		if (!authDecoded)
			return new ServerResponse('Auth token expired. Please sign in again.')
				.statusCode(400)
				.success(false)
                .respond(res);
        
		if (authDecoded.refreshToken !== refreshTokenHeader)
			return new ServerResponse('Invalid tokens used.')
				.statusCode(400)
				.success(false)
				.respond(res);
		if (refreshDecoded.id !== authDecoded.id)
			return new ServerResponse('Invalid tokens used.')
				.statusCode(400)
				.success(false)
				.respond(res);

		const user = await User.findById(refreshDecoded.id);
		if (!user)
			return new ServerResponse('No user was found.')
				.statusCode(400)
				.success(false)
				.respond(res);

		const refreshToken = await RedisService.getRefreshToken(
			authDecoded.id,
			refreshTokenHeader,
		);
		if (!refreshToken)
			return new ServerResponse('Expired refresh token used.')
				.statusCode(400)
				.success(false)
				.respond(res);

		const accessToken = await RedisService.getAccessTokens(
			authDecoded.id,
			accessTokenHeader,
		);
		if (!accessToken)
			return new ServerResponse('Expired auth token used.')
				.statusCode(400)
				.success(false)
				.respond(res);

		const ipAddress = req.socket.remoteAddress!;
		if (
			ipAddress !== accessToken.ipAddress ||
			ipAddress !== refreshToken.ipAddress
		) {
			await RedisService.deleteAccessToken(authDecoded.id, accessToken);
			await RedisService.deleteRefreshToken(authDecoded.id, refreshToken);
			return new ServerResponse('token used from unrecognised device.')
				.statusCode(400)
				.success(false)
				.respond(res);
		}
		req.id = user._id;
		next();
	} catch (err) {
		next(err);
	}
};
