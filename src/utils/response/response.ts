import { Response } from 'express';

export default class ServerResponse {
	private payload: { message: string; data: object | null; success: boolean } =
		{ message: '', data: null, success: true };

	// eslint-disable-next-line no-useless-constructor
	constructor(
		public message: string,
		public data: object | null = null,
		public success: boolean = true,
	) {
		// do nothing
	}

	respond(res: Response, statusCode: number) {
		this.payload = {
			message: this.message
				.split(' ')
				.map((char) => char.substring(0, 1).toUpperCase() + char.substring(1))
				.join(' '),
			data: this.data || null,
			success: this.success || false,
		};

		res.status(statusCode).json(this.payload);
	}
}
