import { Router } from 'express';

import WalletController from '../../controllers/wallet_controller';

const router = Router();

router.post('/charge-card', WalletController.chargeCard);

export default router;
