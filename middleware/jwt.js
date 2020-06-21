const dotenv = require('dotenv')
const koaJwt = require('koa-jwt')

dotenv.config()

module.exports = koaJwt({
  secret: process.env.JWT_SECRET,
  passthrough: true,
})
