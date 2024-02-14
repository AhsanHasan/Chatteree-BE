const { Response } = require('../utils/Response')
const { ErrorHandler } = require('../utils/ErrorHandler')
const { User } = require('../schema/user')
const { AuthMiddleware } = require('./../middleware/AuthMiddleware')
const { mongoose } = require('../schema/mongoose')

class AuthenticationController {
    static async authenticateWithEmail(req, res) {
        try {
            let email = req.body.email
            let requestType = 'login'
            // Check if the email exists
            let user = await User.findOne({ email: email })
            if (!user) {
                // Register the user and return the token
                user = new User({
                    email: email
                })
                await user.save()
                requestType = 'register'
            }
            let token = AuthMiddleware.createJWT(user)
            return new Response(res, null, { token: `Bearer ${token}`, user, requestType }, true)
        } catch (error) {
            ErrorHandler.sendError(res, error)
        }
    }
}
module.exports = { AuthenticationController }
