'use strict'
const { Router } = require('express')
const { AuthenticateJWT } = require('../middleware/AuthenticateJWT')
const { FavoriteController } = require('../controllers/FavoriteController')

const router = new Router()

router.get('/', AuthenticateJWT, FavoriteController.getFavoriteChatRooms)
router.post('/', AuthenticateJWT, FavoriteController.favoriteChatRoom)

module.exports = router
