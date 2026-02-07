'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class B2FileDownload extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  B2FileDownload.init({
    b2FileId: DataTypes.INTEGER,
    ipAddress: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'B2FileDownload',
  });
  return B2FileDownload;
};