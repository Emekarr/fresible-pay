import Flutterwave from 'flutterwave-node-v3';

class FlutterwaveService {
	private flw;

	constructor() {
		this.flw = new Flutterwave(process.env.FLW_PUB, process.env.FLW_SEC);
	}

	async chargeCard({
		cardNumber,
		cvv,
		expiryMonth,
		expiryYear,
		amount,
		email,
		txRef,
		pin,
	}: {
		cardNumber: string;
		cvv: string;
		expiryMonth: string;
		expiryYear: string;
		amount: number;
		email: string;
		txRef: string;
		pin: number;
	}): Promise<string | null> {
		let flwRef!: string | null;

		const payload = {
			card_number: cardNumber,
			cvv,
			expiry_month: expiryMonth,
			expiry_year: expiryYear,
			currency: 'NGN',
			amount,
			email,
			enckey: process.env.ENC_KEY as string,
			tx_ref: txRef,
		};

		try {
			//  charge the users card
			const response = await this.flw.Charge.card(payload);
			if (response.meta.authorization.mode === 'pin') {
				const payload2 = {
					...payload,
					authorization: {
						mode: 'pin',
						fields: ['pin'],
						pin,
					},
				};
				const reCallCharge = await this.flw.Charge.card(payload2);
				flwRef = reCallCharge.data.flw_ref;
			}
		} catch (err) {
			console.log(err)
			flwRef = null;
		}
		return flwRef;
	}

	// validate the charge request
	async validateCharge(
		otp: string,
		flwRef: string,
	): Promise<{
		status: string;
		amount: string;
		paymentType: string;
		txRef: string;
		id: string;
	}> {
		const callValidate = await this.flw.Charge.validate({
			otp,
			flw_ref: flwRef,
		});
		return {
			status: callValidate.status,
			amount: callValidate.data.amount,
			paymentType: callValidate.data.payment_type,
			txRef: callValidate.data.tx_ref,
			id: callValidate.data.id,
		};
	}

	async verifyTransaction(id: string): Promise<{ transactionToken: string }> {
		const payload = { id };
		const response = await this.flw.Transaction.verify(payload);
		const transactionToken = response.data.card.token;
		return { transactionToken };
	}

	async token_charge(
		amount: string,
		narration: string,
		token: string,
		email: string,
		txRef: string,
	): Promise<{ flwRef: string; status: string; paymentType: string }> {
		const payload = {
			amount,
			narration,
			token,
			currency: 'NGN',
			country: 'NG',
			email,
			txRef,
		};
		const response = await this.flw.Tokenized.charge(payload);
		return {
			flwRef: response.data.flw_ref,
			status: response.status,
			paymentType: response.data.payment_type,
		};
	}
}

export default new FlutterwaveService();
