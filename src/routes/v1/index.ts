import { Router } from 'express';

import UserRoutes from './user_routes';

import OtpRoute from './otp_routes';

const router = Router();

router.use('/user', UserRoutes);

router.use('/otp', OtpRoute);

export default router;
