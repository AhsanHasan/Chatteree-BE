'use strict'
const { Router } = require('express')
const { UserController } = require('./../controllers/UserController')
const { AuthenticateJWT } = require('../middleware/AuthenticateJWT')

const router = new Router()

router.get('/', AuthenticateJWT, UserController.getUser)
router.put('/name', AuthenticateJWT, UserController.updateUserName)
router.put('/profile-picture', AuthenticateJWT, UserController.updateUserProfilePicture)


module.exports = router