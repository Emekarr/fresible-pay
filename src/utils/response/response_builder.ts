import { Response } from 'express';

import ServerResponse from './response';

export default class ServerResponseBuilder {
	private response: ServerResponse;

	private status_code: number = 200;

	constructor(message: string) {
		this.response = new ServerResponse(message);
	}

	data(data: object) {
		this.response.data = data;
		return this;
	}

	success(success: boolean) {
		this.response.success = success;
		return this;
	}

	statusCode(statusCode: number) {
		this.status_code = statusCode;
		return this;
	}

	respond(res: Response) {
		this.response.respond(res, this.status_code);
	}
}
