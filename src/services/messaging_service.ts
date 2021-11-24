/* eslint-disable no-console */
import sgMail, { MailDataRequired } from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

class MessagingService {
	sendEmail(
		email: string,
		text: string,
		subject: string,
	): Promise<{ success: boolean }> {
		return new Promise((resolve, reject) => {
			try {
				const msg: MailDataRequired = {
					to: email,
					from: process.env.FRESIBLE_EMAIL as string,
					subject,
					text,
				};

				try {
					sgMail
						.send(msg)
						.then(() => {
							console.log(`MESSAGE SUCCESSFULLY SENT TO ${email}`);
							resolve({ success: true });
						})
						.catch((err: any) => {
							console.log(
								`AN ERROR OCCURED WHILE SENDING A MESSAGE TO ${email}`,
							);
							console.log(
								`ERROR_MESSAGE: ${err.message} \nERROR_NAME: ${err.name}`,
							);
							console.log(err);
							reject(Error(err.message));
						});
				} catch (err: any) {
					reject(Error(err.message));
				}
			} catch (err: any) {
				reject(Error(err.message));
			}
		});
	}
}

export default new MessagingService();
