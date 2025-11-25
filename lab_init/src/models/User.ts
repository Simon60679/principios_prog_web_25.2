import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

// 1. Atributos que existem na tabela
export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
}

// 2. Atributos necessários para criar (id é auto incremento)
export interface UserCreationAttributes
  extends Optional<UserAttributes, "id"> {}

// 3. Classe do modelo
export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
}

// 4. Inicialização do modelo (mapeia pra tabela)
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: false,
  }
);

export default User;
