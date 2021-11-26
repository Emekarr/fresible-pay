import { Schema, Types, model, Document } from 'mongoose';

import WalletTypes from '../utils/wallet_types';

import CustomError from '../utils/error';

export interface Wallet {
	owner: Types.ObjectId;
}

export interface IWallet extends Wallet {
	tokens: { token: string }[];
	type: string;
}

export interface IWalletDocument extends IWallet, Document {}

const walletSchemaFields: Record<keyof IWallet, any> = {
	owner: {
		type: Types.ObjectId,
		required: true,
		unique: true,
		ref: 'User',
	},
	type: {
		type: String,
		default: WalletTypes.NORMAL,
		validate(data: string) {
			if (data !== WalletTypes.NORMAL)
				throw new CustomError('invalid wallet type selected', 400);
		},
	},
	tokens: [
		{
			token: {
				type: String,
				required: true,
			},
		},
	],
};

const WalletSchema = new Schema(walletSchemaFields);

WalletSchema.virtual('transactions', {
	ref: 'Transaction',
	foreignField: 'owner',
	localField: '_id',
});

WalletSchema.methods.toJSON = function () {
	const wallet = this.toObject();
	delete wallet.tokens;
	delete wallet.__v;
	return wallet;
};

export default model<IWalletDocument>('Wallet', WalletSchema);
