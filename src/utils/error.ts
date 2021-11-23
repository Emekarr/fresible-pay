export default class CustomError extends Error {
	readonly name = 'CustomError';

	constructor(message: string, readonly errorCode: number) {
		super(message);
	}
}
