/* eslint-disable no-console */
import { connect, connection, ConnectOptions } from 'mongoose';

class MongooseConnection {
	constructor() {
		connect(process.env.DB_URL!, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		} as ConnectOptions)
			.then(() => {
				console.log('DB CONNECTION SUCCESSFUL');
			})
			.catch((err) => {
				console.log(`DB CONNECTION FAILED ${err.message}`);
				process.kill(process.pid, 'SIGTERM');
			});
	}

	// FOR TESTING PURPOSES ONLY
	async dropDB() {
		// used to clear the database in a TEST environment
		if (process.env.NODE_ENV === 'TEST') {
			await connection.dropDatabase();
		}
	}
}

export default new MongooseConnection();
