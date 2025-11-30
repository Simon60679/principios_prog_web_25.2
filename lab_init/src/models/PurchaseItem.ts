import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

// 1. Atributos que existem na tabela
export interface PurchaseItemAttributes {
  id: number;
  purchaseId: number; // Chave estrangeira para Purchase
  productName: string; // Nome do produto no momento da compra
  productPrice: number; // Preço unitário no momento da compra
  quantity: number;
  subtotal: number; // productPrice * quantity
}

// 2. Atributos necessários para criar
export interface PurchaseItemCreationAttributes
  extends Optional<PurchaseItemAttributes, "id" | "subtotal"> {}

// 3. Classe do modelo
export class PurchaseItem
  extends Model<PurchaseItemAttributes, PurchaseItemCreationAttributes>
  implements PurchaseItemAttributes
{
  public id!: number;
  public purchaseId!: number;
  public productName!: string;
  public productPrice!: number;
  public quantity!: number;
  public subtotal!: number;
}

// 4. Inicialização do modelo
PurchaseItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchaseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'purchases',
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
    tableName: "purchase_items",
    timestamps: false,
  }
);

export default PurchaseItem;