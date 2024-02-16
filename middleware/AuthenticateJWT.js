const passport = require('passport')

const AuthenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, user, info) => {
    if (error || !user) {
      return res.status(401).json({
        message: 'You are not authorized to access this resource',
        success: false,
        status: 401
      })
    }
    req.user = user
    next()
  })(req, res, next)
}

module.exports = { AuthenticateJWT }
