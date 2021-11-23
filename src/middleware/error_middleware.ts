/* eslint-disable no-console */
import { Response, Request } from 'express';

import CustomError from '../utils/error';
import ServerResponse from '../utils/response';

const errNames = ['CastError', 'SyntaxError'];

export default (err: Error | CustomError, req: Request, res: Response) => {
	console.log('AN ERROR OCCURED!');
	console.log(`ERROR MESSAGE: ${err.message}\n ERROR_NAME: ${err.name}`);
	console.log(err);
	if (err.name === 'CustomError') {
		new ServerResponse(`oops! an error occured : ${err.message}`)
			.success(false)
			.statusCode((err as CustomError).errorCode)
			.respond(res);
	} else if (errNames.includes(err.name)) {
		new ServerResponse(`oops! an error occured : ${err.message}`)
			.success(false)
			.statusCode(400)
			.respond(res);
	} else {
		new ServerResponse(`oops! an error occured : ${err.message}`)
			.success(false)
			.statusCode(500)
			.respond(res);
	}
};
