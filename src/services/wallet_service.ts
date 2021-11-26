import Wallet, { IWalletDocument } from '../models/wallet';

class WalletService {
	async createWallet(id: string): Promise<IWalletDocument | null> {
		let newWallet!: IWalletDocument | null;
		try {
			newWallet = await new Wallet({ owner: id }).save();
		} catch (err) {
			newWallet = null;
		}
		return newWallet;
	}

	async findWalletById(id: string) {
		let wallet!: IWalletDocument | null;
		try {
			wallet = await Wallet.findById(id);
		} catch (err) {
			wallet = null;
		}
		return wallet;
	}

	async findWalletByOwner(ownerId: string): Promise<IWalletDocument | null> {
		let wallet!: IWalletDocument | null;
		try {
			wallet = await Wallet.findOne({ owner: ownerId });
		} catch (err) {
			wallet = null;
		}
		return wallet;
	}
}

export default new WalletService();
