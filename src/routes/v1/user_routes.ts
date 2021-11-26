import { Router } from 'express';

import UserController from '../../controllers/user_controller';

const router = Router();

router.post('/signup', UserController.createUser);

router.post('/login', UserController.loginUser);

router.post('/password-reset-otp', UserController.requestPasswordResetOtp);

router.patch('/reset-password', UserController.resetPassword);

router.get('/all', UserController.getAllUsers);

export default router;
