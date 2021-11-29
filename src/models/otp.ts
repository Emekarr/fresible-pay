/* eslint-disable no-useless-constructor */
import { compare } from 'bcrypt';

export default class Otp {
	constructor(readonly code: string, readonly id: string) {
		//
	}
}

export const verify = async (
	code: string,
	hashedOtp: string,
): Promise<boolean> => await compare(code, hashedOtp);
