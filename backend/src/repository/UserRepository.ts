import User, { UserCreationAttributes } from "../models/User";
import { UserAttributes } from "../models/User";
import { Transaction } from "sequelize";

export class UserRepository {
  /**
   * Cria um novo usuário no banco de dados.
   * @param user - Dados do usuário a ser criado.
   * @param options - Opções adicionais (ex: transação).
   * @returns O usuário criado.
   */
  async createUser(user: UserCreationAttributes, options?: { transaction?: Transaction }) {
    return await User.create(user, options);
  }

  /**
   * Retorna todos os usuários cadastrados.
   * @returns Lista de usuários.
   */
  async getAllUsers() {
    return await User.findAll();
  }

  /**
   * Busca um usuário pelo endereço de email.
   * @param email - O email do usuário.
   * @returns O usuário encontrado ou null.
   */
  async findUserByEmail(email: string) {
    return await User.findOne({ where: { email } });
  }

  /**
   * Busca um usuário pelo ID.
   * @param id - O ID do usuário.
   * @returns O usuário encontrado ou null.
   */
  async findUserById(id: number) {
    return await User.findByPk(id);
  }

  /**
   * Remove um usuário do banco de dados.
   * @param id - O ID do usuário a ser removido.
   * @returns O número de linhas afetadas.
   */
  async deleteUser(id: number) {
    return await User.destroy({ where: { id } });
  }

  /**
   * Atualiza os dados de um usuário existente.
   * Remove o campo 'id' dos dados para evitar alteração da chave primária.
   * @param id - O ID do usuário a ser atualizado.
   * @param dataToUpdate - Objeto com os campos a serem atualizados.
   * @returns O número de linhas afetadas.
   */
  async updateUser(id: number, dataToUpdate: Partial<UserAttributes>) {
    delete dataToUpdate.id;

    const [affectedRows] = await User.update(dataToUpdate, {
      where: { id: id }
    });

    return affectedRows;
  }
}

export default new UserRepository();
