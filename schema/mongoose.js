'use strict'

const mongoose = require('mongoose')
const tunnel = require('tunnel-ssh')
const config = require('./../config')

mongoose.Promise = global.Promise

const mongoConnection = process.env.MONGO_CONNECTION || require('./../config').MONGO_CONNECTION

const ssh = config.SSH_TUNNEL
const connect = (port) => {
  if (config.NODE_ENV === 'local') {
    mongoose.connect(mongoConnection)
    console.log('DB connection successful')
  } else {
    ssh.dstPort = port
    tunnel(ssh, function (error, server) {
      if (error) {
        console.log('SSH connection error: ' + error)
      }
      mongoose.connect(mongoConnection)
      const db = mongoose.connection
      db.on('error', () => {
        console.error.bind(console, 'DB connection error:')
      })
      db.once('open', function () {
        console.log('DB connection successful')
      })
    })
  }
}

const connectionPromise = () => {
  return new Promise((resolve, reject) => {
    if (config.NODE_ENV === 'production') {
      mongoose.connect(mongoConnection, { useNewUrlParser: true, useUnifiedTopology: true })
      console.log('DB connection successful')
    } else {
      tunnel(ssh, function (error, server) {
        if (error) {
          console.log('SSH connection error: ' + error)
        }
        mongoose.connect(mongoConnection, { useNewUrlParser: true, useUnifiedTopology: true })
        const db = mongoose.connection
        db.on('error', () => {
          console.error.bind(console, 'DB connection error:')
          reject(error)
        })
        db.once('open', function () {
          console.log('DB connection successful')
          resolve()
        })
      })
    }
  })
}

module.exports = { mongoose, connect, connectionPromise }
