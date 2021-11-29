import { Document, Schema, model } from 'mongoose';
import { compare, hash } from 'bcrypt';

import CustomError from '../utils/error';

export interface User {
	username?: string;
	email?: string;
	password?: string;
}

export interface IUser extends User {
	verified_email?: boolean;
}

export interface IUserDocument extends IUser, Document {
	verifyPassword: (password: string) => Promise<boolean>;
}

const userSchemaFields: Record<keyof IUser, any> = {
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		minlength: 2,
		maxlength: 20,
	},
	email: {
		type: String,
		required: true,
		maxlength: 100,
		trim: true,
		unique: true,
		validate(data: string) {
			const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!regex.test(data))
				throw new CustomError('invalid email provided', 400);
		},
	},
	password: {
		type: String,
		required: true,
		validate(data: string) {
			const regex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
			if (!regex.test(data))
				throw new CustomError('invalid password provided', 400);
		},
	},
	verified_email: {
		type: Boolean,
		default: false,
	},
};

const UserSchema = new Schema(userSchemaFields, { timestamps: true });

UserSchema.pre('save', async function (this: IUserDocument, next) {
	if (this.isModified('password')) {
		this.password = await hash(this.password!, 10);
	}
	next();
});


UserSchema.method('toJSON', function (this: IUserDocument) {
	const user = this.toObject();
	delete user.__v;
	delete user.password;
	return user;
});

UserSchema.method(
	'verifyPassword',
	async function (this: IUserDocument, password: string) {
		return await compare(password, this.password!);
	},
);

export default model<IUserDocument>('User', UserSchema);
