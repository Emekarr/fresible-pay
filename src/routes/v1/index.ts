import { Router } from 'express';

import UserRoutes from './user_routes';

import OtpRoute from './otp_routes';

import WalletRoute from './wallet_routes';

import authMiddleware from '../../middleware/auth_middleware';

const router = Router();

router.use('/user', UserRoutes);

router.use('/otp', OtpRoute);

router.use('/wallet', authMiddleware, WalletRoute);

export default router;
