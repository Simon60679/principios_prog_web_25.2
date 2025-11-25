import User, { UserCreationAttributes } from "../models/User";

export class UserRepository {
  // Criar um novo usuário
  async createUser(user: UserCreationAttributes) {
    return await User.create(user);
  }

  // Listar todos os usuários
  async getAllUsers() {
    return await User.findAll();
  }

  // Buscar um usuário por email
  async findUserByEmail(email: string) {
    return await User.findOne({ where: { email } });
  }
}

export default new UserRepository();
