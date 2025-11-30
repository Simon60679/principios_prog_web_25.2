import User, { UserCreationAttributes } from "../models/User";
import Cart from "../models/Cart";
import cartRepository from "./CartRepository";
import sequelize from "../config/database";

export class UserRepository {
  // Criar um novo usuário
  async createUser(user: UserCreationAttributes) {
    const t = await sequelize.transaction();

    try {
      const newUser = await User.create(user, { transaction: t });

      await cartRepository.createCart({ userId: newUser.id}, { transaction: t });

      await t.commit();

      const userWithCart = await User.findByPk(newUser.id, {
        include: [{ model: Cart, as: 'cart' }]
      });

      return userWithCart;

    } catch (error) {
      await t.rollback(); // Reverte a transação em caso de erro
      throw error;
    }
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
