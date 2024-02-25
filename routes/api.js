'use strict'

const { Router } = require('express')
const { TestController } = require('./../controllers/TestController')
const authentication = require('./authentication')
const user = require('./user')
const chatroom = require('./chatroom')
const message = require('./message')
const favoriteChatRoom = require('./favorite-chatroom')
const status = require('./status')
const router = new Router()

/**
 * Authentication Endpoints
 */
router.use('/authenticate', authentication)

/**
 * User Endpoints
 */
router.use('/user', user)

/**
 * Chatroom Endpoints
 */
router.use('/chatroom', chatroom)

/**
 * Message Endpoints
 */
router.use('/message', message)

/**
 * Favorite Chatroom Endpoints
 */
router.use('/favorite-chatroom', favoriteChatRoom)

/**
 * Status Endpoints
 */
router.use('/status', status)

router.get('/protected', TestController.testHello)
module.exports = router
