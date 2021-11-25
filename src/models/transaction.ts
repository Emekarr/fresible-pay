import { Schema, Types, model, Document } from 'mongoose';
import CustomError from '../utils/error';

export interface Transaction {
	_id: Types.ObjectId;
	owner: Types.ObjectId;
	sentFrom: Types.ObjectId;
	sentTo: Types.ObjectId;
	transactionId: string;
	action: string;
	paymentType: string;
	description: string;
	amount: number;
	currentBalance: number;
}

export interface ITransactionDocument
	extends Omit<Transaction, '_id'>,
		Document {}

const transactionModelFields: Record<keyof Transaction, any> = {
	_id: {
		type: String,
		required: true,
	},
	owner: {
		type: Types.ObjectId,
		required: true,
		ref: 'Wallet',
	},
	sentFrom: {
		type: Types.ObjectId,
		default: null,
		ref: 'Wallet',
	},
	sentTo: {
		type: Types.ObjectId,
		default: null,
		ref: 'Wallet',
	},
	transactionId: {
		type: String,
		required: true,
		unique: true,
	},
	action: {
		type: String,
		required: true,
		validate(data: string) {
			if (data !== 'CREDIT' && data !== 'DEBIT') {
				throw new CustomError(
					'Action type must be either CREDIT or DEBIT.',
					400,
				);
			}
		},
	},
	paymentType: {
		type: String,
		required: true,
		validate(data: string) {
			if (
				data !== 'CARD' &&
				data !== 'BANK TRANSFER' &&
				data !== 'PAYME TRANSFER'
			) {
				throw new CustomError(
					'Action type must be either CARD or BANK TRANSFER.',
					400,
				);
			}
		},
	},
	description: {
		type: String,
		maxlenth: 100,
	},
	amount: {
		type: Number,
		required: true,
	},
	currentBalance: {
		type: Number,
		required: true,
	},
};

const TransactionSchema = new Schema(transactionModelFields, {
	timestamps: true,
	_id: false,
});

TransactionSchema.method('toJSON', function () {
	const transaction = this.toObject();
	delete transaction.__v;
	delete transaction.updatedAt;
	return transaction;
});

TransactionSchema.pre('save', function (exit) {
	if (!this.sent_from && !this.sent_to) {
		throw new CustomError('Set a value for either sent_from or sent_to', 400);
	}
	exit();
});

export default model<ITransactionDocument>('Transaction', TransactionSchema);
