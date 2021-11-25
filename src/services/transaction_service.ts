import Transaction from '../models/transaction';
import CustomError from '../utils/error';
import TransactionTypes from '../utils/transaction_types';

export default class CreateTransaction {
	private payload;

	constructor(
		txRef: string,
		flwRef: string,
		description: string,
		amount: number,
		paymentType: string,
	) {
		this.payload = {
			_id: txRef,
			transaction_id: flwRef,
			description: !description ? '' : description,
			amount,
			payment_type: paymentType,
		};
	}

	async transact(
		senderId: string,
		recieverId: string,
		topup: string,
		id1: string,
		id2: string,
	): Promise<boolean> {
		let result: boolean;
		try {
			if (topup) {
				result = await this.recieve(senderId, senderId);
			} else {
				const send = await this.send(senderId, recieverId, id1);
				if (send) await this.recieve(recieverId, senderId, id2);
				result = true;
			}
		} catch (err) {
			result = false;
		}
		return result;
	}

	async send(senderId: string, recieverId: string, id?: string) {
		const currentBalance = await this.currentBalance(senderId);
		if (currentBalance < this.payload.amount)
			throw new CustomError('Insufficient funds.', 400);
		if (id) this.payload._id = id;
		const payload = {
			...this.payload,
			owner: senderId,
			sent_to: recieverId,
			action: TransactionTypes.DEBIT,
			current_balance: currentBalance - this.payload.amount,
		};

		const transaction = await new Transaction(payload).save();
		if (!transaction) return false;
		return true;
	}

	async recieve(recieverId: string, senderId: string, id?: string) {
		const currentBalance = await this.currentBalance(recieverId);
		if (id) this.payload._id = id;
		const payload = {
			...this.payload,
			owner: recieverId,
			sent_from: senderId,
			action: TransactionTypes.CREDIT,
			current_balance: currentBalance + this.payload.amount,
		};

		const transaction = await new Transaction(payload).save();
		if (!transaction) return false;
		return true;
	}

	async currentBalance(id: string): Promise<number> {
		const lastTransaction = await Transaction.findOne(
			{ owner: id },
			{},
			{ sort: { created_at: 1 } },
		);
		if (!lastTransaction) return 0;
		return lastTransaction.currentBalance;
	}
}
