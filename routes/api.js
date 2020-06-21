// import local dependencies
const jwt = require('../middleware/jwt')
const fetchLocations = require('../middleware/fetchLocations.js')
const fetchInventory = require('../middleware/fetchInventory.js')
const updateInventory = require('../middleware/updateInventory.js')
const checkStatus = require('../middleware/checkStatus.js')
const emailSummary = require('../middleware/emailSummary.js')

module.exports = ({ apiRouter }) => {
  apiRouter.get('/', jwt, async (ctx, next) => {
    ctx.body = 'Cycle Api'
  })

  apiRouter.post('/locations', jwt, async (ctx, next) => {
    await fetchLocations(ctx)
  })

  apiRouter.post('/inventory', jwt, async (ctx, next) => {
    await fetchInventory(ctx)
  })

  apiRouter.post('/update', jwt, async (ctx, next) => {
    await updateInventory(ctx)
  })

  apiRouter.post('/status', jwt, async (ctx, next) => {
    await checkStatus(ctx)
  })

  apiRouter.post('/summary', jwt, async (ctx, next) => {
    await emailSummary(ctx)
  })
}
