import { createClient } from 'redis';

class RedisService {
	private redis;

	constructor() {
		this.redis = createClient();
		// eslint-disable-next-line no-console
		this.redis.on('error', (err) => console.log('Redis Client Error', err));
	}

	connectToRedis(): RedisService {
		(async () => await this.redis.connect())();
		return this;
	}

	async cacheCurrentBalance(id: string, balance: string): Promise<boolean> {
		let success!: boolean;
		try {
			const result = await this.redis.SET(`${id}-current-balance`, balance);
			if (result === 'OK') {
				success = true;
			} else {
				success = false;
			}
		} catch (err) {
			success = false;
		}
		return success;
	}

	async getCachedCurrentBalance(id: string): Promise<string | null> {
		let balance!: string | null;
		try {
			balance = await this.redis.get(`${id}-current-balance`);
		} catch (err) {
			balance = null;
		}
		return balance;
	}
}

export default new RedisService().connectToRedis();
