import { Router } from 'express';

import UserController from '../../controllers/user_controller';

const router = Router();

router.post('/signup', UserController.createUser);

router.post('/login', UserController.loginUser);

router.post('/password-reset-otp', UserController.requestPasswordResetOtp);

export default router;
