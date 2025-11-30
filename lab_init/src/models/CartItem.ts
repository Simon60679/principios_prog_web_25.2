import { Model, DataTypes, Optional } from "sequelize";
import Product from "./Product";
import sequelize from "../config/database";

// 1. Atributos que existem na tabela
export interface CartItemAttributes {
  cartId: number;   // Chave Estrangeira para Cart
  productId: number; // Chave Estrangeira para Product
  quantity: number; // A quantidade do item
}

// 2. Atributos necessários para criar
export interface CartItemCreationAttributes 
  extends CartItemAttributes {}

// 3. Classe do modelo
export class CartItem
  extends Model<CartItemAttributes, CartItemCreationAttributes>
  implements CartItemAttributes
{
  public cartId!: number;
  public productId!: number;
  public quantity!: number;
  public readonly product?: Product;
}

// 4. Inicialização do modelo (mapeia pra tabela)
CartItem.init(
  {
    cartId: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Parte da chave primária composta
      allowNull: false,
      references: {
        model: 'carts',
        key: 'userId', // Lembrete.: 'userId' é a chave primária da tabela 'carts'
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Parte da chave primária composta
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    }
  },
  {
    sequelize,
    tableName: "itens_carrinho", // Novo nome da tabela de junção
    timestamps: false,
  }
);

export default CartItem;