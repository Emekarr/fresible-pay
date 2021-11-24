import { Request, Response, NextFunction } from 'express';

// models
import { IUserDocument, User } from '../models/user';

// services
import QueryService from '../services/query_service';
import UserServices from '../services/user_services';

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
}

export default new UserController();
