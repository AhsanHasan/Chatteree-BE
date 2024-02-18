'use strict'
const { Router } = require('express')
const { MessageController } = require('./../controllers/MessageController')
const { AuthenticateJWT } = require('../middleware/AuthenticateJWT')

const router = new Router()

router.post('/', AuthenticateJWT, MessageController.sendMessage)
router.get('/all', AuthenticateJWT, MessageController.getMessages)
router.get('/read', AuthenticateJWT, MessageController.readMessages)

module.exports = router
