/* eslint-disable no-useless-constructor */
import { Types } from 'mongoose';

export default class RefreshToken {
	constructor(
		readonly token: string,
		readonly ipAddress: string,
		readonly createdAt: number,
		readonly owner: Types.ObjectId,
	) {
		//
	}
}
