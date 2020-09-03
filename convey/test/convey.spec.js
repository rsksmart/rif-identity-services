const request = require('supertest')
const express = require('express')
const convey = require('../convey')

const getRandomString = () => Math.random().toString(36).substring(3, 11)

describe('Express app tests', () => {
  let app;

  beforeAll(() => {
    const ipfsOptions = {
      port: '5001',
      host: 'localhost',
      protocol: 'http',
    }

    app = express()

    convey(app, ipfsOptions, '')
  })

  it('returns a valid cid', async () => {
    const file = getRandomString()

    const { body } = await request(app).post('/file').send({ file }).expect(200)

    const { cid, url } = body

    expect(cid).toBeTruthy()
    expect(url).toBeTruthy()
    expect(url).toContain('convey://')
  })

  it('gets a saved cid', async () => {
    const expected = getRandomString()

    let response = await request(app).post('/file').send({ file: expected }).expect(200)
    const { cid } = response.body
    
    const { body } = await request(app).get(`/file/${cid}`).expect(200)

    const { file } = body

    expect(file).toEqual(expected)
  })

  it('not found a cid that has not been saved in this convey', async () => {
    const cid = 'notExists'

    request(app).get(`/file/${cid}`).expect(404)
  })
})