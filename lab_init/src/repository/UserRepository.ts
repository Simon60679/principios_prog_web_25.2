import User, { UserCreationAttributes } from "../models/User";
import { UserAttributes } from "../models/User";
import { Transaction } from "sequelize";

export class UserRepository {
  // Criar um novo usuário
  // Aceita opções para permitir transações externas
  async createUser(user: UserCreationAttributes, options?: { transaction?: Transaction }) {
    return await User.create(user, options);
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

  async updateUser(id: number, dataToUpdate: Partial<UserAttributes>) {
        
        // Remove 'id' e 'password' para evitar atualização acidental caso tenham sido passados.
        delete dataToUpdate.id;

        const [affectedRows] = await User.update(dataToUpdate, {
            where: { id: id }
        });

        return affectedRows;
    }
}

export default new UserRepository();
