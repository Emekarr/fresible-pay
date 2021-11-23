import { Schema, Document, model, Types } from 'mongoose';
import { hash, compare } from 'bcrypt';

import CustomError from '../utils/error';

export interface Otp {
	code: string;
	user: Types.ObjectId;
	createdAt: string;
	model: string;
}

export interface OTPDocument extends Document, Otp {
	verify: (code: string) => Promise<boolean>;
}

const otpSchemaFields: Record<keyof Otp, any> = {
	user: {
		type: Types.ObjectId,
		required: true,
		unique: true,
	},
	code: {
		type: String,
		required: true,
	},
	model: {
		type: String,
		required: true,
		validate(data: string) {
			if (data !== 'user' && data !== 'writer')
				throw new CustomError('invalid model type passed', 400);
		},
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: '5m',
	},
};

const OTPSchema = new Schema<OTPDocument>(otpSchemaFields, {
	timestamps: true,
});

OTPSchema.pre('save', async function (this: OTPDocument, next) {
	if (this.isModified('otp')) {
		this.code = await hash(this.code, 10);
	}
	next();
});

OTPSchema.method(
	'verify',
	async function (this: OTPDocument, code: string): Promise<boolean> {
		return await compare(code, this.code);
	},
);

export default model<OTPDocument>('Otp', OTPSchema);
