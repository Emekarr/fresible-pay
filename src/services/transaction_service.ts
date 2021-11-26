import { Types } from 'mongoose';

import Transaction, { ITransactionDocument } from '../models/transaction';
import CustomError from '../utils/error';
import TransactionTypes from '../utils/transaction_types';

import RedisService from './redis_service';

export const generateTransactionId = (): string =>
	new Types.ObjectId().toString();

export const getAllTransactions = async (
	walletId: string,
	limit?: string,
	page?: string,
) => {
	let transactions: ITransactionDocument[];
	try {
		if (limit && page) {
			transactions = await Transaction.find({ owner: walletId })
				.limit(Number(limit))
				.skip((Number(page) - 1) * Number(limit));
		} else {
			transactions = await Transaction.find({ owner: walletId });
		}
	} catch (err) {
		transactions = [];
	}
	return transactions;
};

export default class CreateTransaction {
	private payload;

	constructor(
		txRef: string | null,
		flwRef: string,
		description: string,
		amount: number,
		paymentType: string,
	) {
		this.payload = {
			_id: txRef,
			transactionId: flwRef,
			description: !description ? '' : description,
			amount,
			paymentType,
		};
	}

	async transact(
		senderId: string | null,
		recieverId: string | null,
		topup: boolean,
		id1?: string,
		id2?: string,
	): Promise<boolean> {
		let result: boolean;
		try {
			if (topup) {
				result = await this.recieve(senderId!, senderId!);
			} else {
				const send = await this.send(senderId!, recieverId!, id1);
				if (send) await this.recieve(recieverId!, senderId!, id2);
				result = true;
			}
		} catch (err) {
			result = false;
		}
		return result;
	}

	async send(senderId: string, recieverId: string, id?: string) {
		let currentBalance = await this.currentBalance(senderId);
		if (currentBalance < this.payload.amount)
			throw new CustomError('Insufficient funds.', 400);
		currentBalance -= this.payload.amount;
		if (id) this.payload._id = id;
		const payload = {
			...this.payload,
			owner: senderId,
			sentTo: recieverId,
			action: TransactionTypes.DEBIT,
			currentBalance,
		};
		const transaction = await new Transaction(payload).save();
		if (!transaction) return false;
		const success = await RedisService.cacheCurrentBalance(
			senderId,
			currentBalance.toString(),
		);
		if (!success)
			throw new Error(
				`falied to cache recievers current balance transactionid ${this.payload.transactionId}`,
			);
		return true;
	}

	async recieve(recieverId: string, senderId: string, id?: string) {
		let currentBalance = await this.currentBalance(recieverId);
		currentBalance += this.payload.amount;
		if (id) this.payload = { ...this.payload, _id: id };
		const payload = {
			...this.payload,
			owner: recieverId,
			sentFrom: senderId,
			action: TransactionTypes.CREDIT,
			currentBalance,
		};

		const transaction = await new Transaction(payload).save();
		if (!transaction) return false;
		const success = await RedisService.cacheCurrentBalance(
			recieverId,
			currentBalance.toString(),
		);
		if (!success)
			throw new Error(
				`falied to cache recievers current balance transactionid ${this.payload.transactionId}`,
			);
		return true;
	}

	async currentBalance(id: string): Promise<number> {
		const currentBalance = await RedisService.getCachedCurrentBalance(id);
		if (!currentBalance) return 0;
		return Number(currentBalance!);
	}
}
