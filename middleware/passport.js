const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const config = require('./../config')
const { User } = require('../schema/user')
const passport = require('passport')
const opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
opts.secretOrKey = config.TOKEN_SECRET
passport.use(new JwtStrategy(opts, async function (jwtPayload, done) {
  try {
    const user = await User.findOne({ _id: jwtPayload.sub })
    if (user) {
      return done(null, user)
    } else {
      return done(null, false)
    }
  } catch (error) {
    return done(error, false)
  }
}))
