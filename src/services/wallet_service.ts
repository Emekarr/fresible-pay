import Wallet, { IWalletDocument } from '../models/wallet';

class WalletService {
	async createWallet(id: string): Promise<IWalletDocument | null> {
		let newWallet!: IWalletDocument | null;
		try {
			newWallet = new Wallet({ owner: id });
		} catch (err) {
			newWallet = null;
		}
		return newWallet;
	}
}

export default new WalletService();
