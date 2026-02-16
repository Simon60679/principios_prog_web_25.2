import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { tokenBlacklist } from '../utils/tokenBlacklist';

/**
 * Middleware de autenticação para proteger rotas.
 * Verifica se o token JWT está presente no cabeçalho 'Authorization',
 * se não está na blacklist e se é válido.
 *
 * @param req - Objeto de requisição do Express.
 * @param res - Objeto de resposta do Express.
 * @param next - Função para chamar o próximo middleware.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: 'Token inválido ou expirado (Logout realizado).' });
  }

  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido.' });
  }
};
