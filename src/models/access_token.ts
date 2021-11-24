import { Schema, Document, model, Types } from 'mongoose';

interface AccessToken {
	refresh_token: string;
	token: string;
	ip_address: string;
	createdAt: number;
	owner: Types.ObjectId;
}

interface IAccessTokenDocument extends AccessToken, Document {}

const accessTokenFields: Record<keyof AccessToken, any> = {
	owner: {
		type: Types.ObjectId,
		ref: 'Student',
		required: true,
	},
	token: {
		type: String,
		required: true,
	},
	refresh_token: {
		type: String,
		required: true,
	},
	ip_address: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: process.env.AUTH_TOKEN_LIFE,
	},
};

const AuthTokenSchema = new Schema(accessTokenFields, { timestamps: true });

export default model<IAccessTokenDocument>('AuthToken', AuthTokenSchema);
