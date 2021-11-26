import { Router } from 'express';

import UserController from '../../controllers/user_controller';

import authMiddleware from '../../middleware/auth_middleware';

const router = Router();

router.post('/signup', UserController.createUser);

router.post('/login', UserController.loginUser);

router.post('/password-reset-otp', UserController.requestPasswordResetOtp);

router.patch('/reset-password', UserController.resetPassword);

router.get('/all', authMiddleware, UserController.getAllUsers);

router.get('/profile', authMiddleware, UserController.getUserDetails);

router.get(
	'/platform-data',
	authMiddleware,
	UserController.retrievePlatformData,
);

export default router;
