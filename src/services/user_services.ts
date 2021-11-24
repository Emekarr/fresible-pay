import UserModel, { User, IUser, IUserDocument } from '../models/user';

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

	async updateUser(id: string, user: IUser): Promise<IUserDocument | null> {
		let updatedUser!: IUserDocument | null;
		try {
			updatedUser = await this.findById(id);
			if (!updatedUser) throw new Error('No user returned');
			updatedUser.update(user);
			await updatedUser.save();
		} catch (err) {
			updatedUser = null;
		}
		return updatedUser;
	}
}

export default new UserServices();
