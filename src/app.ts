import express, { Application } from 'express';

class App {
	private express: Application;

	constructor() {
		this.express = express();
		this.express.use(express.json());
		this.express.use(express.urlencoded({ extended: true }));
	}

	listen(port: string, cb: () => void) {
		this.express.listen(port, cb);
	}
}

export default new App();
