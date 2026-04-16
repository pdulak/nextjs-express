import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from "sequelize";
import sequelize from "../config/database";

class B2FileDownload extends Model<
  InferAttributes<B2FileDownload>,
  InferCreationAttributes<B2FileDownload>
> {
  declare id: CreationOptional<number>;
  declare b2FileId: number;
  declare ipAddress: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

B2FileDownload.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    b2FileId: DataTypes.INTEGER,
    ipAddress: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "B2FileDownload",
  }
);

export default B2FileDownload;
