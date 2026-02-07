'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserPermission extends Model {
    static associate(models) {
      UserPermission.belongsTo(models.User);
      UserPermission.belongsTo(models.Permission);
    }
  }
  UserPermission.init({
    userId: DataTypes.INTEGER,
    permissionId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'UserPermission',
  });
  return UserPermission;
};