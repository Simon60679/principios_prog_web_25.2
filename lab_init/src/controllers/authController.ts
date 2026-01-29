import { Request, Response } from 'express';
import { comparePassword, generateToken } from '../utils/auth';
import User from '../models/User';
import { tokenBlacklist } from '../utils/tokenBlacklist';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {

    // Verifica se o usuário existe

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email ou senha inválidos' });
    }

    // Compara a senha fornecida com a senha armazenada

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Email ou senha inválidos' });
    }

    // Gera um token JWT

    const token = generateToken(user.id, user.name);

    res.status(200).json({ message: 'Login realizado com sucesso', token });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao realizar login', error: err });
  }
};

export const logout = (req: Request, res: Response) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    tokenBlacklist.add(token);
  }
  res.status(200).json({ message: 'Logout realizado com sucesso' });
};
