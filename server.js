require('isomorphic-fetch')

// import npm dependencies
const Koa = require('koa')
const Router = require('koa-router')
const logger = require('koa-logger')
const bodyParser = require('koa-bodyparser')

// initialize app
const app = new Koa()

// add logging
app.use(logger())
app.use(bodyParser())

// add error handling
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.status = err.status || 500
    ctx.body = err.message
    ctx.app.emit('error', err, ctx)
  }
})

// add auth router
const authRouter = new Router({ prefix: '/auth' })
require('./routes/auth')({ authRouter })
app.use(authRouter.routes())
app.use(authRouter.allowedMethods())

// add api router
const apiRouter = new Router({ prefix: '/api' })
require('./routes/api')({ apiRouter })

app.use(apiRouter.routes())
app.use(apiRouter.allowedMethods())

// start server
const server = app.listen(3001)

// export server
module.exports = server
