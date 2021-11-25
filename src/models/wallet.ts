import { Schema, Types, model, Document } from 'mongoose';

export interface Wallet {
	owner: Types.ObjectId;
}

export interface IWallet extends Wallet {
	tokens: string[];
}

export interface IWalletDocument extends Wallet, Document {}

const walletSchemaFields: Record<keyof IWallet, any> = {
	owner: {
		type: Types.ObjectId,
		required: true,
		unique: true,
		ref: 'User',
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

export default model('Wallet', WalletSchema);
