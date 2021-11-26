import { Request, Response, NextFunction } from 'express';
import { v1 as uuidv1 } from 'uuid';

// services
import UserService from '../services/user_services';
import FlutterwaveService from '../services/flutterwave_service';
import QueryService from '../services/query_service';
import WalletService from '../services/wallet_service';
import CreateTransaction, {
	generateTransactionId,
} from '../services/transaction_service';

// utils
import CustomError from '../utils/error';
import ServerResponse from '../utils/response';
import PaymentTypes from '../utils/payment_types';

class WalletController {
	async chargeCard(req: Request, res: Response, next: NextFunction) {
		try {
			const details = req.body;
			QueryService.checkIfNull([details]);
			const txRef = generateTransactionId();
			const cardDetails = { ...details, txRef };
			/*
				NOTE HARDCODED CODE
			*/
			const user = await UserService.findById('61a0690abeacebc6a2f40e31');
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
				'61a06912beacebc6a2f40e40',
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
				'61a06912beacebc6a2f40e40',
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

	async transferCash(req: Request, res: Response, next: NextFunction) {
		try {
			const { recieverName, amount, description } = req.body;
			QueryService.checkIfNull([recieverName, amount, description]);
			const transactionId = uuidv1();
			/*
				NOTE HARDCODED CODE
			*/
			const sender = await UserService.findById('61a0690abeacebc6a2f40e31');
			if (!sender)
				throw new CustomError('Transaction failed. Sender not found', 404);
			const senderWallet = await WalletService.findWalletById(
				'61a06912beacebc6a2f40e40',
			);
			if (!senderWallet)
				throw new CustomError(
					'Transaction failed. Sender wallet not found',
					404,
				);
			const reciever = await UserService.findByUsername(recieverName);
			if (!reciever)
				throw new CustomError('Transaction failed. Reciever not found', 404);
			const recieverWallet = await WalletService.findWalletByOwner(
				'61a069bbfc261a2bea95056d',
			);
			if (!recieverWallet)
				throw new CustomError(
					'Transaction failed. Reciever wallet not found',
					404,
				);
			const senderTransactionId = generateTransactionId();
			const recieverTransactionId = generateTransactionId();
			const createTransaction = new CreateTransaction(
				null,
				transactionId,
				description,
				amount,
				PaymentTypes.PAYME_TRANSFER,
			);
			const result = await createTransaction.transact(
				senderWallet._id,
				recieverWallet._id,
				false,
				senderTransactionId,
				recieverTransactionId,
			);
			if (!result)
				throw new CustomError(
					`Transactions failed to create for\nWALLET: X\nFLWREF ${transactionId}`,
					500,
				);

			new ServerResponse('Transaction successfull.').respond(res);
		} catch (err) {
			next(err);
		}
	}

	async getAllWallets(req: Request, res: Response, next: NextFunction) {
		try {
			const { limit, page } = req.query;
			const wallets = await WalletService.getAllWallets(
				limit as string,
				page as string,
			);
			new ServerResponse('wallets retrieved and returned')
				.data(wallets)
				.respond(res);
		} catch (err) {
			next(err);
		}
	}
}

export default new WalletController();
