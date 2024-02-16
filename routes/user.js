'use strict'
const { Router } = require('express')
const { UserController } = require('./../controllers/UserController')
const { AuthenticateJWT } = require('../middleware/AuthenticateJWT')

const router = new Router()

router.get('/', AuthenticateJWT, UserController.getUser)
router.post('/username', AuthenticateJWT, UserController.saveUsername)
router.put('/name', AuthenticateJWT, UserController.updateName)
router.put('/general-information', AuthenticateJWT, UserController.updateUserBasicInformation)

module.exports = router
