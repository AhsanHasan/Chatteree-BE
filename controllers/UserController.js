const { Response } = require('../utils/Response')
const { ErrorHandler } = require('../utils/ErrorHandler')
const { User } = require('../schema/user')
const { AuthMiddleware } = require('./../middleware/AuthMiddleware')
const { mongoose } = require('../schema/mongoose')

class UserController {
  /**
     * API | GET | /api/user
     * API is used to get the user details by the token
     * @param {*} req
     * @param {*} res
     * @returns
     */
  static async getUser (req, res) {
    try {
      const token = req.headers.authorization.split(' ')[1]
      const user = await AuthMiddleware.decodeJWT(token)
      if (!user) {
        return new Response(res, 'User not found', null, false)
      }
      const userDetails = await User.findOne({ _id: user.sub })
      return new Response(res, null, userDetails, true)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }

  /**
     * API | PUT | /api/user/profile-picture
     * API is used to update the profile picture of a user
     * @example {
     * "userId": string,
     * "profilePicture": string
     * }
     * @param {*} req
     * @param {*} res
     * @returns
     */
  static async updateUserBasicInformation (req, res) {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const userId = req.body._id
      const profilePicture = req.body.profilePicture
      const name = req.body.name
      const user = await User.findOne({ _id: userId }).session(session)
      if (!user) {
        throw new Error('User not found')
      }
      user.profilePicture = profilePicture
      user.name = name
      user.onlineStatus = 'online'
      await user.save({ session })
      await session.commitTransaction()
      return new Response(res, user, 'Information updated successfully.', true)
    } catch (error) {
      await session.abortTransaction()
      if (error.message === 'User not found') {
        return new Response(res, null, 'User not found.', false)
      } else {
        ErrorHandler.sendError(res, error)
      }
    } finally {
      session.endSession()
    }
  }

  /**
     * API | PUT | /api/user/name
     * API is used to update the name of a user
     * @example {
     * "userId": string,
     * "name": string
     * }
     * @param {*} req
     * @param {*} res
     * @returns
     */
  static async updateName (req, res) {
    const session = await mongoose.startSession()
    try {
      session.startTransaction()
      const userId = req.body.userId
      const name = req.body.name
      const user = await User.findOne({ _id: userId }).session(session)
      if (!user) {
        throw new Error('User not found')
      }
      user.name = name
      await user.save({ session })
      await session.commitTransaction()
      return new Response(res, null, user, true)
    } catch (error) {
      await session.abortTransaction()
      ErrorHandler.sendError(res, error)
    } finally {
      session.endSession()
    }
  }

  /**
     * API | POST | /api/user/username
     * API is used to save the username of a user
     * @example {
     * "userId": string,
     * "username": string
     * }
     * @param {*} req
     * @param {*} res
     * @returns
     */
  static async saveUsername (req, res) {
    const session = await mongoose.startSession()
    try {
      session.startTransaction()
      const userId = req.body.userId
      const username = req.body.username
      // Check if username already exists
      const userExists = await User.findOne({ username }).session(session)
      if (userExists) {
        return new Response(res, null, 'Username already exist.', false)
      }
      const user = await User.findOne({ _id: userId }).session(session)
      if (!user) {
        throw new Error('User not found')
      }
      user.username = username
      await user.save({ session })
      await session.commitTransaction()
      return new Response(res, user, null, true)
    } catch (error) {
      await session.abortTransaction()
      ErrorHandler.sendError(res, error)
    } finally {
      session.endSession()
    }
  }

  /**
   * API | GET | /api/user/all
   * API is used to get all the users
   * @param {*} req
   * @param {*} res
   * @returns
   */
  static async getAllActiveUser (req, res) {
    try {
      const page = req.query.page || 1
      const limit = req.query.limit || 10
      const skip = (page - 1) * limit
      const search = req.query.search || ''
      // Get all users except the current user who is making the request and is active
      // If the seach query is present then search the user by name or username or email
      let users = []
      if (search && search !== '') {
        users = await User.find({ _id: { $ne: req.user._id }, isActive: true, $or: [{ name: { $regex: search, $options: 'i' } }, { username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }).skip(skip).limit(limit)
      } else {
        users = await User.find({ _id: { $ne: req.user._id }, isActive: true })
          .skip(skip)
          .limit(limit)
      }

      const totalDocuments = await User.countDocuments({ _id: { $ne: req.user._id }, isActive: true })
      const totalPages = Math.ceil(totalDocuments / limit)
      const hasNextPage = page < totalPages
      const hasPreviousPage = page > 1
      const pagination = {
        totalDocuments,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPreviousPage
      }
      users = {
        users,
        pagination
      }
      return new Response(res, users, null, true)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }

  static async updateOnlineStatus (req, res) {
    try {
      const userId = req.user._id
      const user = await User.findOneAndUpdate({ _id: userId }, { onlineStatus: 'offline' }, { new: true })
      return new Response(res, null, user, true)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }
}
module.exports = { UserController }
