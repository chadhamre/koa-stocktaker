const { Sequelize, DataTypes } = require('sequelize')

module.exports = (sequelize, type) => {
  return sequelize.define('account', {
    shopifyShop: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    shopifyToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shopifyTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    shopifyEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cycleToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  })
}
