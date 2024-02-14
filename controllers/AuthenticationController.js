const { Response } = require('../utils/Response')
const { ErrorHandler } = require('../utils/ErrorHandler')
const { User } = require('../schema/user')
const { AuthMiddleware } = require('./../middleware/AuthMiddleware')
const { mongoose } = require('../schema/mongoose')
const { OAuth2Client } = require('google-auth-library')
const config = require('./../config.json')
class AuthenticationController {
    /**
     * API | POST | /api/authenticate
     * API is used to authenticate a user using email, 
     * if the user exists, it returns a token,
     * if the user does not exist, it creates a new user and returns a token
     * @example {
     *  "email": string
     * }
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    static async authenticateWithEmail(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let email = req.body.email;
            let requestType = 'login';
            // Check if the email exists
            let user = await User.findOne({ email: email }).session(session);
            if (!user) {
                // Create 6 digit OTP and send it to the user
                let otp = Math.floor(100000 + Math.random() * 900000);
                // Register the user and return the token
                user = new User({
                    email,
                    otp
                });
                let html = await PromiseEjs.renderFile('./emails/verifyEmail.ejs', { otp });
                mailSender.sendMail('syed.khan7007@gmail.com', 'Chatteree | Welcome', html);
                await user.save({ session });
                requestType = 'register';
            }
            // Create a token if the user is verified
            if (user.isActive) {
                let token = AuthMiddleware.createJWT(user);
                await session.commitTransaction();
                return new Response(res, null, { token: `Bearer ${token}`, user, requestType }, true);
            }
            await session.commitTransaction();
            return new Response(res, null, { user, requestType }, true);
        } catch (error) {
            await session.abortTransaction();
            ErrorHandler.sendError(res, error);
        } finally {
            session.endSession();
        }
    }

    /**
     * API | POST | /api/authenticate/google
     * API is used to authenticate a user using google,
     * if the user exists, it returns a token, if the user does not exist, it creates a new user and returns a token
     * @example {
     * "email": string,
     * "name": string,
     * "profilePic": string,
     * "verified_email": boolean
     * }
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    static async authenticateWithGoogle(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let email = req.body.email
            let name = req.body.name
            let profilePic = req.body.profilePic
            let verified_email = req.body.verified_email
            let requestType = 'login'
            let authToken = null

            // Check if the email exists
            let user = await User.findOne({ email: email }).session(session);
            if (!user) {
                // Check if the email is already verified
                if (!verified_email) {
                    // Create 6 digit OTP and send it to the user
                    let otp = Math.floor(100000 + Math.random() * 900000)
                    // Send the OTP to the user
                    let html = await PromiseEjs.renderFile('./emails/verifyEmail.ejs', { otp })
                    mailSender.sendMail('syed.khan7007@gmail.com', 'Chatteree | Welcome', html)
                }
                // Register the user and return the token
                user = new User({
                    email: email,
                    name: name,
                    profilePicture: profilePic,
                    isActive: verified_email,
                    lastLogin: new Date(),
                    onlineStatus: 'online',
                    otp: verified_email ? null : otp
                })
                await user.save({ session });
            }
            // Create a token if the user is verified
            if (user.isActive) {
                authToken = `Bearer ${AuthMiddleware.createJWT(user)}`
            }
            await session.commitTransaction();
            return new Response(res, null, { token: authToken, user, requestType }, true)
        } catch (error) {
            await session.abortTransaction();
            ErrorHandler.sendError(res, error)
        } finally {
            session.endSession();
        }
    }

    /**
     * API | POST | /api/authenticate/google/token
     * API is used to verify a google id token
     * @example {
     * "idToken": string
     * }
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    static async verifyGoogleToken(req, res) {
        try {
            let idToken = req.body.idToken
            const client = new OAuth2Client(config.GOOGLE_CLIENT_ID)
            const ticket = await client.verifyIdToken({
                idToken: idToken,
                audience: config.GOOGLE_CLIENT_ID
            })
            const payload = ticket.getPayload()
            const userid = payload['sub']
            return new Response(res, null, payload, true)
        } catch (error) {
            ErrorHandler.sendError(res, error)
        }
    }

    /**
     * API | POST | /api/uthenticate/email/verify
     * API is used to verify the email of a user by comparing the OTP
     * @example {
     * "email": string,
     * "otp": string
     * }
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    static async verifyEmail(req, res) {
        try {
            let otp = req.body.otp
            let email = req.body.email
            let user = await User.findOne({ email: email })
            if (!user) {
                return new Response(res, 'User not found', null, false)
            }
            if (user.otp !== otp) {
                return new Response(res, 'Invalid OTP', null, false)
            }
            user.otp = null
            user.isActive = true
            await user.save()
            // Create a token
            let token = AuthMiddleware.createJWT(user)
            return new Response(res, null, { token: `Bearer ${token}`, user, requestType }, true)
        } catch (error) {
            ErrorHandler.sendError(res, error)
        }
    }
}
module.exports = { AuthenticationController }
