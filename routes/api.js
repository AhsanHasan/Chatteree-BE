'use strict'

const { Router } = require('express')
const { TestController } = require('./../controllers/TestController')
const { AuthenticationController } = require('./../controllers/AuthenticationController')
const { AuthenticateJWT } = require('../middleware/AuthenticateJWT')
const router = new Router()

/**
 * Authentication routes
 */
router.post('/authenticate', AuthenticationController.authenticateWithEmail)
router.get('/protected', AuthenticateJWT, TestController.testHello)
module.exports = router
