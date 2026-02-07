import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ForeignKey,
} from "sequelize";
import sequelize from "../config/database";

class UserPermission extends Model<
  InferAttributes<UserPermission>,
  InferCreationAttributes<UserPermission>
> {
  declare id: CreationOptional<number>;
  declare userId: ForeignKey<number>;
  declare permissionId: ForeignKey<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

UserPermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: DataTypes.INTEGER,
    permissionId: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "UserPermission",
  }
);

export default UserPermission;
