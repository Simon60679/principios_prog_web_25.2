import { Model, DataTypes, Optional } from "sequelize";
import User from "./User";
import CartItem from "./CartItem";
import sequelize from "../config/database";

// 1. Atributos que existem na tabela
export interface CartAttributes {
  userId: number; // Chave estrangeira
}

// 2. Atributos necessários para criar (id é auto incremento)
export interface CartCreationAttributes {}

// 3. Classe do modelo
export class Cart
  extends Model<CartAttributes, CartCreationAttributes>
  implements CartAttributes
{
  public userId!: number;
  public readonly User?: User;
  public readonly CartItems?: CartItem[];
}

// 4. Inicialização do modelo (mapeia pra tabela)
Cart.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: { // configuração de chave estrangeira
        model: 'users',
        key: 'id',
      }
    }
  },
  {
    sequelize,
    tableName: "carts",
    timestamps: false,
  }
);

export default Cart;