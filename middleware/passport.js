const JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
const config = require('./../config')
const { User } = require('../schema/user')
const passport = require('passport')
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.TOKEN_SECRET;
passport.use(new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
        let user = await User.findOne({ _id: jwt_payload.sub })
        if (user) {
            return done(null, user)
        } else {
            return done (null, false)
        }
    } catch (error) {
        return done(error, false)
    }
}));