'use strict'

const { Router } = require('express')
const { TestController } = require('./../controllers/TestController')
const { AuthenticationController } = require('./../controllers/AuthenticationController')
const { AuthenticateJWT } = require('../middleware/AuthenticateJWT')
const router = new Router()

/**
 * Authentication routes
 */
router.post('/authenticate/google/token', AuthenticationController.verifyGoogleToken)
router.post('/authenticate/google', AuthenticationController.authenticateWithGoogle)
router.post('/authenticate', AuthenticationController.authenticateWithEmail)
router.get('/protected', AuthenticateJWT, TestController.testHello)
module.exports = router
