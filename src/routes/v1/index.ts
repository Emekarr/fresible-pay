import { Router } from 'express';

import UserRoutes from './user_routes';

import OtpRoute from './otp_routes';

import WalletRoute from './wallet_routes';

const router = Router();

router.use('/user', UserRoutes);

router.use('/otp', OtpRoute);

router.use('/wallet', WalletRoute);


export default router;
