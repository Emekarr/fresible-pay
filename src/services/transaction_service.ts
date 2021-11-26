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
		const currentBalance = await this.currentBalance(senderId);
		if (currentBalance < this.payload.amount)
			throw new CustomError('Insufficient funds.', 400);
		if (id) this.payload._id = id;
		const payload = {
			...this.payload,
			owner: senderId,
			sentTo: recieverId,
			action: TransactionTypes.DEBIT,
			currentBalance: currentBalance - this.payload.amount,
		};

		const transaction = await new Transaction(payload).save();
		if (!transaction) return false;
		return true;
	}

	async recieve(recieverId: string, senderId: string, id?: string) {
		const currentBalance = await this.currentBalance(recieverId);
		if (id) this.payload = { ...this.payload, _id: id };
		const payload = {
			...this.payload,
			owner: recieverId,
			sentFrom: senderId,
			action: TransactionTypes.CREDIT,
			currentBalance: currentBalance + this.payload.amount,
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
