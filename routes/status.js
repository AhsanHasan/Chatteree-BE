'use strict'
const { Router } = require('express')
const { AuthenticateJWT } = require('../middleware/AuthenticateJWT')
const { StatusController } = require('../controllers/StatusController')

const router = new Router()

router.get('/', AuthenticateJWT, StatusController.getStatus)
router.post('/', AuthenticateJWT, StatusController.createStatus)
router.post('/view', AuthenticateJWT, StatusController.viewStatus)

module.exports = router
