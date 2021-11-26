import { Router } from 'express';

import WalletController from '../../controllers/wallet_controller';

const router = Router();

router.post('/charge-card', WalletController.chargeCard);

router.post('/validate-charge', WalletController.validateCard);

router.post('/transfer', WalletController.transferCash);

router.get('/all', WalletController.getAllWallets);

export default router;
