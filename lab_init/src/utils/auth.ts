import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * Gera um hash seguro para a senha utilizando bcrypt.
 * @param password - A senha em texto plano.
 * @returns O hash da senha.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compara uma senha em texto plano com um hash armazenado.
 * @param password - A senha em texto plano fornecida no login.
 * @param hashedPassword - O hash da senha armazenado no banco de dados.
 * @returns True se as senhas coincidirem, False caso contrário.
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Gera um token JWT para um usuário autenticado.
 * @param userId - O ID do usuário.
 * @param username - O nome do usuário.
 * @returns O token JWT assinado.
 */
export const generateToken = (userId: number, username: string): string => {
  return jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '1h' });
};

/**
 * Verifica a validade de um token JWT.
 * @param token - O token JWT a ser verificado.
 * @returns O payload decodificado se o token for válido. Lança um erro se inválido.
 */
export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};
