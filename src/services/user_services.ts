import UserModel, { User, IUser, IUserDocument } from '../models/user';

import TokenService from './token_service';

class UserServices {
	async createUser(userDetails: User): Promise<IUserDocument | null> {
		let user!: IUserDocument | null;
		try {
			user = await new UserModel(userDetails).save();
		} catch (err) {
			user = null;
		}
		return user;
	}

	async findById(id: string): Promise<IUserDocument | null> {
		let user!: IUserDocument | null;
		try {
			user = await UserModel.findById(id);
		} catch (err) {
			user = null;
		}
		return user;
	}

	async findByUsername(username: string): Promise<IUserDocument | null> {
		let user!: IUserDocument | null;
		try {
			user = await UserModel.findOne({ username });
		} catch (err) {
			user = null;
		}
		return user;
	}

	async findByEmail(email: string): Promise<IUserDocument | null> {
		let user!: IUserDocument | null;
		try {
			user = await UserModel.findOne({ email });
		} catch (err) {
			user = null;
		}
		return user;
	}

	async updateUser(id: string, user: IUser): Promise<IUserDocument | null> {
		let updatedUser!: IUserDocument | null;
		try {
			updatedUser = await this.findById(id);
			if (!updatedUser) throw new Error('No user returned');
			Object.assign(updatedUser, user);
			await updatedUser.save();
		} catch (err) {
			updatedUser = null;
		}
		return updatedUser;
	}

	async loginUser(
		{ username, email }: { username?: string; email?: string },
		password: string,
		ipAddress: string,
	): Promise<{
		loggedIn: boolean;
		accessToken: string | null;
		refreshToken: string | null;
		user: IUserDocument | null;
	}> {
		let data!: {
			loggedIn: boolean;
			accessToken: string | null;
			refreshToken: string | null;
			user: IUserDocument | null;
		};
		try {
			let user: IUserDocument | null;
			if (username) {
				user = await this.findByUsername(username as string);
			} else {
				user = await this.findByEmail(email as string);
			}
			if (!user) throw new Error('user not found');
			const matches = await user.verifyPassword(password);
			if (!matches) throw new Error('password does not match');
			const { newAccessToken, newRefreshToken } =
				await TokenService.generateToken(ipAddress, user._id);
			if (!newAccessToken || !newRefreshToken)
				throw new Error('tokens could not be generated');
			data = {
				loggedIn: true,
				accessToken: newAccessToken.token,
				refreshToken: newRefreshToken.token,
				user,
			};
		} catch (err) {
			data = {
				loggedIn: false,
				accessToken: null,
				refreshToken: null,
				user: null,
			};
		}
		return data;
	}

	async getAllUsers(limit?: string, page?: string): Promise<IUserDocument[]> {
		let user!: IUserDocument[];
		try {
			if (limit && page) {
				user = await UserModel.find()
					.limit(Number(limit))
					.skip((Number(page) - 1) * Number(limit));
			} else {
				user = await UserModel.find();
			}
		} catch (err) {
			user = [];
		}
		return user;
	}
}

export default new UserServices();
