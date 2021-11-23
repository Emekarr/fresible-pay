import { Request, Response, NextFunction } from 'express';

// models
import { User } from '../models/user';

// services
import QueryService from '../services/query_service';
import UserServices from '../services/user_services';

// utils
import CustomError from '../utils/error';
import ServerResponse from '../utils/response';

class UserController {
	createUser = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userDetails: User = req.body;
			QueryService.checkIfNull([userDetails]);
			const user = await UserServices.createUser(userDetails);
			if (!user) throw new CustomError('failed to create new user', 400);
			new ServerResponse('User created successfully').data(user).respond(res);
		} catch (err) {
			next(err);
		}
	};
}

export default new UserController();
