'use strict'
const { Router } = require('express')
const { ChatController } = require('./../controllers/ChatController')
const { AuthenticateJWT } = require('../middleware/AuthenticateJWT')

const router = new Router()

router.get('/', AuthenticateJWT, ChatController.getChatRoom)
router.get('/id', AuthenticateJWT, ChatController.getChatRoomById)
router.get('/all', AuthenticateJWT, ChatController.getChatRooms)
router.get('/search', AuthenticateJWT, ChatController.searchForChatroomParticipantsAndMessages)

module.exports = router
