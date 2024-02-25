const express = require('express')
const mongoose = require('./schema/mongoose')
const bodyParser = require('body-parser')
const config = require('./config')
const cors = require('cors')
const api = require('./routes/api')
const path = require('path')
const passport = require('passport')
const port = process.env.PORT || config.PORT

const app = express()
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))
app.use(passport.initialize())
require('./middleware/passport')

// const whitelist = [
//   'http://localhost:4200',
//   'http://159.89.1.194:4000'
// ]
// const corsOptionsDelegate = function (req, callback) {
//   let corsOptions
//   if (whitelist.indexOf(req.header('Origin')) !== -1) {
//     corsOptions = { origin: true, credentials: true }
//   } else {
//     corsOptions = { origin: false, credentials: true }
//   }
//   callback(null, corsOptions)
// }

const allOrigins = function (req, callback) {
  callback(null, { origin: true, credentials: true })
}

app.use('/api', cors(allOrigins), api)
app.set('trust proxy', true)

app.use('/api', api)
app.use('/public', express.static(path.join(__dirname, '/public')))

app.listen(port, () => {
  mongoose.connect(config.SSH_TUNNEL.dstPort)
  console.log(`listening on port ${port}`)
}).on('error', (error) => {
  console.error('Something went wrong:', error)
})
