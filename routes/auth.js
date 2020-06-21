const generateToken = require('../middleware/generateToken.js')

module.exports = ({ authRouter }) => {
  authRouter.post('/login', async (ctx, next) => {
    await generateToken(ctx)
  })
}
