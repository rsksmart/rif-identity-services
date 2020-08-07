import express from 'express'
import bodyParser from 'body-parser'

const app = express()

app.post('/', bodyParser.text(), function (req, res) {
  console.log(req.body)
  res.status(200).send()
})

app.listen(20202)
