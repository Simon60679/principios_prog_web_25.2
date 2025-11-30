import { Model, DataTypes, Optional } from "sequelize";
import User from "./User";
import CartItem from "./CartItem";
import sequelize from "../config/database";

// 1. Atributos que existem na tabela
export interface ProductAttributes {
  id: number;
  userId: number; // Chave estrangeira
  name: string;
  price: number;
  stock: number;
  description: string;
}

// 2. Atributos necessários para criar (id é auto incremento)
export interface ProductCreationAttributes
  extends Optional<ProductAttributes, "id" | "stock"> {}

// 3. Classe do modelo
export class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  public id!: number;
  public userId!: number;
  public name!: string;
  public price!: number;
  public stock!: number;
  public description!: string;
  public readonly User?: User;
  public readonly CartItems?: CartItem[];
}

// 4. Inicialização do modelo (mapeia pra tabela)
Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { // configuração de chave estrangeira
        model: 'users',
        key: 'id',
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "products",
    timestamps: false,
  }
);

export default Product;
