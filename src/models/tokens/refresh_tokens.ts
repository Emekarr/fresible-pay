/* eslint-disable no-useless-constructor */
import { Types } from 'mongoose';

export default class RefreshToken {
	constructor(
		readonly token: string,
		readonly ipAddress: string,
		readonly deleteAt: Date,
		readonly owner: Types.ObjectId,
	) {
		//
	}
}
