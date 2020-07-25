const request = require('supertest')
const server = require('../server.js')

beforeAll(async () => {})

afterAll(() => {
  server.close()
})

describe('basic route tests', async () => {
  test('get home route GET /api/', async () => {
    const response = await request(server).get('/api/')
    expect(response.status).toEqual(200)
    expect(response.text).toContain('Cycle Api')
  })
})
