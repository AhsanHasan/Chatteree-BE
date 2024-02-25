const { Response } = require('../utils/Response')
const { ErrorHandler } = require('../utils/ErrorHandler')
const { User } = require('../schema/user')
const { AuthMiddleware } = require('./../middleware/AuthMiddleware')
const { mongoose } = require('../schema/mongoose')
const { OAuth2Client } = require('google-auth-library')
const { mailSender } = require('./../utils/MailSender')
const { PromiseEjs } = require('../utils/PromiseEjs')
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
  static async authenticateWithEmail (req, res) {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const email = req.body.email
      let requestType = 'login'
      // Check if the email exists
      let user = await User.findOne({ email }).session(session)
      if (!user) {
        // Create 6 digit OTP and send it to the user
        const otp = Math.floor(100000 + Math.random() * 900000)
        // Register the user and return the token
        user = new User({
          email,
          otp,
          onlineStatus: 'online'
        })
        const html = await PromiseEjs.renderFile('./emails/verifyEmail.ejs', { otp })
        mailSender.sendMail(email, 'Chatteree | Welcome', html)
        await user.save({ session })
        requestType = 'register'
      }
      // Create a token if the user is verified
      if (user.isActive) {
        const token = AuthMiddleware.createJWT(user)
        await session.commitTransaction()
        return new Response(res, { token: `Bearer ${token}`, user, requestType }, 'User authenticated successfully', true)
      }
      await session.commitTransaction()
      return new Response(res, { user, requestType }, 'User registered successfully.', true)
    } catch (error) {
      await session.abortTransaction()
      ErrorHandler.sendError(res, error)
    } finally {
      session.endSession()
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
  static async authenticateWithGoogle (req, res) {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const email = req.body.email
      const name = req.body.name
      const profilePic = req.body.profilePicture
      const verifiedEmail = req.body.verifiedEmail
      const requestType = 'login'
      let authToken = null

      // Check if the email exists
      let user = await User.findOne({ email }).session(session)
      let otp = null
      if (!user) {
        // Check if the email is already verified
        if (!verifiedEmail) {
          // Create 6 digit OTP and send it to the user
          otp = Math.floor(100000 + Math.random() * 900000)
          // Send the OTP to the user
          const html = await PromiseEjs.renderFile('./emails/verifyEmail.ejs', { otp })
          mailSender.sendMail('syed.khan7007@gmail.com', 'Chatteree | Welcome', html)
        }
        // Register the user and return the token
        user = new User({
          email,
          name,
          profilePicture: profilePic,
          isActive: verifiedEmail,
          lastLogin: new Date(),
          onlineStatus: 'online',
          otp: verifiedEmail ? null : otp
        })
        await user.save({ session })
      }
      // Create a token if the user is verified
      if (user.isActive) {
        authToken = `Bearer ${AuthMiddleware.createJWT(user)}`
      }
      await session.commitTransaction()
      return new Response(res, { token: authToken, user, requestType }, 'User authenticated successfully.', true)
    } catch (error) {
      await session.abortTransaction()
      ErrorHandler.sendError(res, error)
    } finally {
      session.endSession()
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
  static async verifyGoogleToken (req, res) {
    try {
      const idToken = req.body.idToken
      const client = new OAuth2Client(config.GOOGLE_CLIENT_ID)
      const ticket = await client.verifyIdToken({
        idToken,
        audience: config.GOOGLE_CLIENT_ID
      })
      const payload = ticket.getPayload()
      const userId = payload.sub
      if (!userId) {
        throw new Error('Invalid token')
      }
      return new Response(res, payload, 'Google token verified.', true)
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
  static async verifyEmail (req, res) {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const otp = req.body.otp
      const userId = req.body.userId
      const user = await User.findOne({ _id: userId }).session(session)
      if (!user) {
        throw new Error('User not found')
      }
      if (user.otp !== otp) {
        throw new Error('Invalid OTP')
      }
      user.isActive = true
      user.otp = null
      await user.save({ session })
      // Create a token
      const token = AuthMiddleware.createJWT(user)
      await session.commitTransaction()
      return new Response(res, { token: `Bearer ${token}`, user }, 'Email verified successfully.', true)
    } catch (error) {
      await session.abortTransaction()
      if (error.message === 'User not found' || error.message === 'Invalid OTP') {
        return new Response(res, null, error.message, false)
      } else {
        ErrorHandler.sendError(res, error)
      }
    } finally {
      session.endSession()
    }
  }

  /**
     * API | POST | /api/authenticate/email/resend-otp
     * API is used to resend the OTP to the user
     * @example {
     * "userId": string
     * }
     * @param {*} req
     * @param {*} res
     * @returns
     */
  static async resendOtp (req, res) {
    try {
      const session = await mongoose.startSession()
      session.startTransaction()
      const userId = req.body.userId
      // Check if the email exists
      const user = await User.findOne({ _id: userId }).session(session)
      if (!user) {
        return new Response(res, null, 'User not found', false)
      }
      // Create 6 digit OTP and send it to the user
      const otp = Math.floor(100000 + Math.random() * 900000)
      await User.updateOne({ _id: userId }, { otp }, { session })
      await user.save({ session })
      // Send the OTP to the user
      const html = await PromiseEjs.renderFile('./emails/resendVerifyEmail.ejs', { otp })
      mailSender.sendMail(user.email, 'Chatteree | Welcome', html)
      await session.commitTransaction()
      return new Response(res, null, 'OTP sent successfully.', true)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }

  static async logout (req, res) {
    try {
      const user = req.user
      user.onlineStatus = 'offline'
      await user.save()
      return new Response(res, null, 'User logged out successfully.', true)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }
}
module.exports = { AuthenticationController }
