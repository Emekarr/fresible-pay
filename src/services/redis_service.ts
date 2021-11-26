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
			balance = await this.redis.GET(`${id}-current-balance`);
		} catch (err) {
			balance = null;
		}
		return balance;
	}

	async updateTotalUserCount(): Promise<boolean> {
		let success!: boolean;
		try {
			await this.redis.INCR('total-user-count');
			success = true;
		} catch (err) {
			success = false;
		}
		return success;
	}

	async updateTotalTransactionCount(): Promise<boolean> {
		let success!: boolean;
		try {
			await this.redis.INCR('total-transaction-count');
			success = true;
		} catch (err) {
			success = false;
		}
		return success;
	}

	async retrieveTotalWalletBalance(): Promise<number> {
		let count: number = 0;
		try {
			// eslint-disable-next-line no-restricted-syntax
			for await (const key of this.redis.scanIterator({
				MATCH: '*-current-balance',
				TYPE: 'string',
			})) {
				count += parseInt((await this.redis.get(key))!, 10);
			}
		} catch (err) {
			count = 0;
		}
		return count;
	}
}

export default new RedisService().connectToRedis();
