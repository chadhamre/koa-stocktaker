const dotenv = require('dotenv')
const { Sequelize, DataTypes } = require('sequelize')
const AccountModel = require('./models/account')
const UpdatesModel = require('./models/updates')

dotenv.config()

const sequelize = new Sequelize(process.env.CLEARDB_DATABASE_URL, {
  logging: false,
})

const Account = AccountModel(sequelize, Sequelize)
const Updates = UpdatesModel(sequelize, Sequelize)

sequelize.sync().then(() => {
  console.log(`Database & tables created!`)
})

module.exports = {
  Account,
  Updates,
}
