import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

// Atributos que existem na tabela
export interface SaleItemAttributes {
  id: number;
  saleId: number; // Chave estrangeira para Sale
  productName: string; // Nome do produto no momento da venda (imutável)
  productPrice: number; // Preço unitário no momento da venda (imutável)
  quantity: number;
  subtotal: number; // productPrice * quantity
}

// Atributos necessários para criar
export interface SaleItemCreationAttributes
  extends Optional<SaleItemAttributes, "id" | "subtotal"> {}

export class SaleItem
  extends Model<SaleItemAttributes, SaleItemCreationAttributes>
  implements SaleItemAttributes
{
  public id!: number;
  public saleId!: number;
  public productName!: string;
  public productPrice!: number;
  public quantity!: number;
  public subtotal!: number;
}

// Inicialização do modelo
SaleItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    saleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sales',
        key: 'id',
      }
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    productPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    }
  },
  {
    sequelize,
    tableName: "sale_items",
    timestamps: false,
  }
);

export default SaleItem;