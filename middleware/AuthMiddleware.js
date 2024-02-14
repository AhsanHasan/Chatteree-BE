const moment = require('moment')
const jwt = require('jwt-simple')
const config = require('./../config')
const passport = require('passport');

class AuthMiddleware {
    /**
     * Ensure if a user is authenticated
     * @param {*} req
     * @param {*} res
     * @param {*} next
     */
    static ensureAuthenticated (req, res, next) {
        if (!req.header('Authorization')) {
            return res.status(401).send({ message: 'Please make sure your request has an Authorization header' })
        }
        var token = req.header('Authorization').split(' ')[1]

        var payload = null
        try {
            payload = jwt.decode(token, config.TOKEN_SECRET)
        } catch (err) {
            return res.status(401).send({ message: err.message })
        }

        if (payload.exp <= moment().unix()) {
            return res.status(401).send({ message: 'Token has expired' })
        }
        req.user = payload.sub
        next()
    }

    /**
     * Create JWT token
     * @param {*} user
     */
    static createJWT (user) {
        var payload = {
            sub: user._id,
            iat: moment().unix(),
            exp: moment().add(1, 'days').unix()
        }
        return jwt.encode(payload, config.TOKEN_SECRET)
    }

    /**
     * Decode JWT
     * @param {*} token
     */
    static decodeJWT (token) {
        return jwt.decode(token, config.TOKEN_SECRET)
    }
    
}

module.exports = { AuthMiddleware }
