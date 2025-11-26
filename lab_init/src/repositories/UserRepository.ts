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

  // Buscar um usuário por ID
  async findUserById(id: number) {
    return await User.findByPk(id);
  }

  // Deletar um usuário por ID
  async deleteUser(id: number) {
    return await User.destroy({ where: { id } });
  }
}

export default new UserRepository();
