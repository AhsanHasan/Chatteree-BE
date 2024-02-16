'use strict'

const { Router } = require('express')
const { TestController } = require('./../controllers/TestController')
const { AuthenticateJWT } = require('../middleware/AuthenticateJWT')
const authentication = require('./authentication')
const user = require('./user')
const router = new Router()

/**
 * Authentication Endpoints
 */
router.use('/authenticate', authentication)

/**
 * User Endpoints
 */
router.use('/user', user)

router.get('/protected', AuthenticateJWT, TestController.testHello)
module.exports = router
