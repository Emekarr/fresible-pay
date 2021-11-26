import { createClient } from 'redis';

import RefreshToken from '../models/tokens/refresh_tokens';
import AccessToken from '../models/tokens/access_tokens';

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

	async cacheRefreshTokens(id: string, token: RefreshToken): Promise<boolean> {
		let success;
		try {
			const count = await this.redis.SCARD(`${id}-refresh-tokens`);
			if (count >= 10) {
				const allTokens = await this.redis.SMEMBERS(`${id}-refresh-tokens`);
				await this.redis.SREM(`${id}-refresh-tokens`, allTokens[0]);
			}
			await this.redis.SADD(`${id}-refresh-tokens`, JSON.stringify(token));
			success = true;
		} catch (err) {
			success = false;
		}
		return success;
	}

	async cacheAccessTokens(id: string, token: AccessToken): Promise<boolean> {
		let success;
		try {
			const count = await this.redis.SCARD(`${id}-access-tokens`);
			if (count >= 10) {
				const allTokens = await this.redis.SMEMBERS(`${id}-access-tokens`);
				await this.redis.SREM(`${id}-access-tokens`, allTokens[0]);
			}
			await this.redis.SADD(`${id}-access-tokens`, JSON.stringify(token));
			success = true;
		} catch (err) {
			success = false;
		}
		return success;
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

	async retrieveTotalUserCount(): Promise<number> {
		let users!: number;
		try {
			const data = await this.redis.GET('total-user-count');
			if (!data) throw new Error();
			users = parseInt(data!, 10);
		} catch (err) {
			users = 0;
		}
		return users;
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

	async retrieveTotalTransactionCount(): Promise<number> {
		let count!: number | null;
		try {
			const data = await this.redis.GET('total-transaction-count');
			if (!data) throw new Error();
			count = parseInt(data!, 10);
		} catch (err) {
			count = 0;
		}
		return count;
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
