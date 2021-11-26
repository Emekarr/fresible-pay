import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// services
import UserService from '../services/user_services';
import FlutterwaveService from '../services/flutterwave_service';
import QueryService from '../services/query_service';

// utils
import CustomError from '../utils/error';
import ServerResponse from '../utils/response';

class WalletController {
	async chargeCard(req: Request, res: Response, next: NextFunction) {
		try {
			const details = req.body;
			QueryService.checkIfNull([details]);
			const txRef = uuidv4();
			const cardDetails = { ...details, txRef };
			const user = await UserService.findById('61a03c089fab449027ffc498');
			if (!user) throw new CustomError('user not found', 404);
			cardDetails.email = user.email;
			const flwRef = await FlutterwaveService.chargeCard(cardDetails);
			if (!flwRef) throw new CustomError('card charge failed', 400);
			new ServerResponse('card charge successful')
				.data({ flwRef, txRef })
				.respond(res);
		} catch (err) {
			next(err);
		}
	}
}

export default new WalletController();
