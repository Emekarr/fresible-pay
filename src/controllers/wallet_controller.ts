/* eslint-disable consistent-return */
import { Request, Response, NextFunction } from 'express';
import { v1 as uuidv1 } from 'uuid';

// services
import UserService from '../services/user_services';
import FlutterwaveService from '../services/flutterwave_service';
import QueryService from '../services/query_service';
import WalletService from '../services/wallet_service';
import CreateTransaction, {
	generateTransactionId,
	getAllTransactions,
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
			const user = await UserService.findById(req.id);
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
			const wallet = await WalletService.findWalletByOwner(req.id);
			if (!wallet) throw new CustomError('wallet was not found', 404);

			const createTransaction = new CreateTransaction(
				response.txRef,
				flwRef,
				description,
				response.amount,
				response.paymentType,
			);

			const result = await createTransaction.transact(wallet._id, null, true);
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
			const sender = await UserService.findById(req.id);
			if (!sender)
				throw new CustomError('Transaction failed. Sender not found', 404);
			if (sender.username === recieverName)
				throw new CustomError('cannot foward money to yourself', 400);
			const senderWallet = await WalletService.findWalletByOwner(req.id);
			if (!senderWallet)
				throw new CustomError(
					'Transaction failed. Sender wallet not found',
					404,
				);
			const reciever = await UserService.findByUsername(recieverName);
			if (!reciever)
				throw new CustomError('Transaction failed. Reciever not found', 404);
			const recieverWallet = await WalletService.findWalletByOwner(
				reciever._id,
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

	async getWalletDetails(req: Request, res: Response, next: NextFunction) {
		try {
			const { walletId, limit, page } = req.query;
			QueryService.checkIfNull([walletId]);
			const wallet = await WalletService.findWalletById(walletId as string);
			if (!wallet)
				return new ServerResponse('wallet not found')
					.success(false)
					.statusCode(404)
					.respond(res);
			const user = await UserService.findById(wallet.owner.toString());
			const transactions = await getAllTransactions(
				wallet?._id,
				limit as string,
				page as string,
			);
			new ServerResponse('wallet retrieved and returned')
				.data({ wallet, user, transactions })
				.respond(res);
		} catch (err) {
			next(err);
		}
	}
}

export default new WalletController();
