import express from 'express';
import { login, logout } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

/**
 * Roteador para as rotas de autenticação.
 * Define os endpoints POST /login e /logout.
 */
const router = express.Router();

router.post('/login', login);
router.post('/logout', authenticate, logout);

export default router;
