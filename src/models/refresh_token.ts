import { Schema, Document, model, Types } from 'mongoose';

interface RefreshToken {
	token: string;
	ip_address: string;
	createdAt: number;
	owner: Types.ObjectId;
}

interface IRefreshTokenDocument extends RefreshToken, Document {}

const refreshTokenFields: Record<keyof RefreshToken, any> = {
	owner: {
		type: Types.ObjectId,
		ref: 'Student',
		required: true,
	},
	token: {
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
		expires: process.env.REFRESH_TOKEN_LIFE,
	},
};

const RefreshTokenSchema = new Schema(refreshTokenFields, {
	timestamps: true,
});

export default model<IRefreshTokenDocument>('RefreshToken', RefreshTokenSchema);
