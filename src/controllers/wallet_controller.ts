import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// services
import UserService from '../services/user_services';
import FlutterwaveService from '../services/flutterwave_service';
import QueryService from '../services/query_service';
import WalletService from '../services/wallet_service';
import CreateTransaction from '../services/transaction_service';

// utils
import CustomError from '../utils/error';
import ServerResponse from '../utils/response';
import PaymentTypes from '../utils/payment_types';

class WalletController {
	async chargeCard(req: Request, res: Response, next: NextFunction) {
		try {
			const details = req.body;
			QueryService.checkIfNull([details]);
			const txRef = uuidv4();
			const cardDetails = { ...details, txRef };
			/*
				NOTE HARDCODED CODE
			*/
			const user = await UserService.findById('61a0552de1af5add823d12dc');
			if (!user) throw new CustomError('user not found', 404);
			cardDetails.email = user.email;
			const flwRef = await FlutterwaveService.chargeCard(cardDetails);
			if (!flwRef) throw new CustomError('card charge failed', 400);
			new ServerResponse('card charge successful')
				.data({ flw_ref: flwRef, tx_ref: txRef })
				.respond(res);
		} catch (err) {
			next(err);
		}
	}

	async validateCard(req: Request, res: Response, next: NextFunction) {
		try {
			const { otp, flwRef, save, description } = req.body;
			QueryService.checkIfNull([otp, flwRef, save, description]);
			// eslint-disable-next-line prefer-const
			let response = await FlutterwaveService.validateCharge(otp, flwRef);
			if (!response) throw new CustomError('card validation failed', 400);
			if (response.paymentType === 'card') {
				response.paymentType = PaymentTypes.CARD;
			} else if (response.paymentType === 'bank transfer') {
				response.paymentType = PaymentTypes.BANK_TRANSFER;
			}

			if (response.status !== 'success')
				throw new CustomError('validation failed', 400);
			/*
				NOTE HARDCODED CODE
			*/
			const wallet = await WalletService.findWalletById(
				'61a05554485acb918ac67fe5',
			);
			if (!wallet) throw new CustomError('wallet was not found', 404);

			const createTransaction = new CreateTransaction(
				response.txRef,
				flwRef,
				description,
				response.amount,
				response.paymentType,
			);

			/*
				NOTE HARDCODED CODE
			*/
			const result = await createTransaction.transact(
				'61a05554485acb918ac67fe5',
				null,
				true,
			);
			if (!result)
				throw new CustomError(
					`Transactions failed to create for\nWALLET: X\nFLWREF ${flwRef}`,
					500,
				);

			if (save) {
				const transactionToken = await FlutterwaveService.verifyTransaction(
					response.id,
				);
				if (!transactionToken)
					throw new CustomError(
						'Transaction successful. Failure generating token.',
						500,
					);
				wallet.tokens.push({ token: transactionToken });
				await wallet.save();
			}
			new ServerResponse('Validation successfull.').respond(res);
		} catch (err) {
			next(err);
		}
	}
}

export default new WalletController();
