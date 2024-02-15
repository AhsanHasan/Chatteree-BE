'use strict'
const { Router } = require('express')
const { AuthenticationController } = require('./../controllers/AuthenticationController')

const router = new Router()

router.post('/google/token', AuthenticationController.verifyGoogleToken)
router.post('/google', AuthenticationController.authenticateWithGoogle)
router.post('/', AuthenticationController.authenticateWithEmail)
router.post('/email/verify', AuthenticationController.verifyEmail)
router.post('/email/resend-otp', AuthenticationController.resendOtp)

module.exports = router