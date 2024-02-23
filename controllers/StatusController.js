const { Response } = require('../utils/Response')
const { ErrorHandler } = require('../utils/ErrorHandler')
const { Status } = require('../schema/status')
const { ChatRoom } = require('../schema/chatRoom')
const { mongoose } = require('../schema/mongoose')
class StatusController {
  /**
     * API | POST | /api/status
     * API is used to create a status
     * @example {
     * "type": string,
     * "url": string
     * }
     * @param {*} req
     * @param {*} res
     * @returns
     */
  static async createStatus (req, res) {
    try {
      const userId = req.user._id
      const type = req.body.type || 'video'
      const url = req.body.url
      const newStatus = new Status({ userId, type, url })
      await newStatus.save()
      return new Response(res, newStatus, 'Status created', true, 201)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }

  /**
   * API | POST | /api/status/view/
   * @param {*} req
   * @param {*} res
   * @returns
   */
  static async viewStatus (req, res) {
    try {
      const userId = req.user._id
      const statusId = req.body.statusId
      const status = await Status.findById(statusId)
      if (!status) {
        return new Response(res, null, 'Status not found', false, 404)
      }
      if (status.userId.toString() === userId) {
        return new Response(res, null, 'Unauthorized', false, 401)
      }
      if (status.viewedBy.includes(userId)) {
        return new Response(res, null, 'Status already viewed', true, 200)
      }
      status.viewedBy.push(userId)
      await status.save()
      return new Response(res, null, 'Status viewed', true, 200)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }

  /**
   * API | GET | /api/status
   * @param {*} req
   * @param {*} res
   * @returns
   */
  static async getStatus (req, res) {
    try {
      const userId = new mongoose.Types.ObjectId(String(req.user._id))
      // Find the users that the logged in user shares chatroom with
      let userIds = await ChatRoom.aggregate([
        {
          $match: {
            participants: {
              $in: [userId]
            }
          }
        },
        {
          $unwind: '$participants'
        },
        {
          $match: {
            participants: {
              $ne: userId
            }
          }
        },
        {
          $group: {
            _id: null,
            userIds: { $addToSet: '$participants' }
          }
        }
      ])
      userIds = userIds.length > 0 ? userIds[0].userIds : []
      const status = await Status.aggregate([
        {
          $match: {
            userId: {
              $in: userIds
            },
            isExpired: false
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $addFields: {
            isViewed: {
              $in: [userId, '$viewedBy']
            }
          }
        },
        {
          $group: {
            _id: '$user._id',
            name: { $first: '$user.name' },
            profilePicture: { $first: '$user.profilePicture' },
            statuses: {
              $push: {
                _id: '$_id',
                type: '$type',
                url: '$url',
                isExpired: '$isExpired',
                isViewed: '$isViewed'
              }
            }
          }
        },
        {
          $addFields: {
            isAllViewed: {
              $allElementsTrue: {
                $map: {
                  input: '$statuses',
                  as: 'status',
                  in: '$$status.isViewed'
                }
              }
            }
          }
        }
      ])
      return new Response(res, status, 'Status retrieved', true, 200)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }
}

module.exports = { StatusController }
