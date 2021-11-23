import UserModel, { User, IUserDocument } from '../models/user';

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
}

export default new UserServices();
