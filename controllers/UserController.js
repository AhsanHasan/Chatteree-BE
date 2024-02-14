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
    static async getUser(req, res) {
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
    static async updateUserProfilePicture(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let userId = req.body.userId;
            let profilePicture = req.body.profilePicture;
            let user = await User.findOne({ _id: userId }).session(session);
            if (!user) {
                throw new Error('User not found');
            }
            user.profilePicture = profilePicture;
            await user.save({ session });
            await session.commitTransaction();
            return new Response(res, null, user, true);
        } catch (error) {
            await session.abortTransaction();
            if (error.message === 'User not found') {
                return new Response(res, 'User not found', null, false);
            } else {
                ErrorHandler.sendError(res, error);
            }
        } finally {
            session.endSession();
        }
    }
}
module.exports = { UserController }