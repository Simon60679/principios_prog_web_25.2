import { Request, Response } from 'express';
import { comparePassword, generateToken } from '../utils/auth';
import User from '../models/User';
import { tokenBlacklist } from '../utils/tokenBlacklist';

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autentica um usuário e retorna um token JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       400:
 *         description: Credenciais inválidas
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email ou senha inválidos' });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Email ou senha inválidos' });
    }

    const token = generateToken(user.id, user.name);

    res.status(200).json({ message: 'Login realizado com sucesso', token });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao realizar login', error: err });
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Realiza logout invalidando o token atual
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 */
export const logout = (req: Request, res: Response) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    tokenBlacklist.add(token);
  }
  res.status(200).json({ message: 'Logout realizado com sucesso' });
};
