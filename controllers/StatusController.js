const { Response } = require('../utils/Response')
const { ErrorHandler } = require('../utils/ErrorHandler')
const { Status } = require('../schema/status')
const { ChatRoom } = require('../schema/chatRoom')
const { mongoose } = require('../schema/mongoose')
const { PusherHelper } = require('../helper/PusherHelper')
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
      const channel = 'chat-room'
      PusherHelper.sendNotification(channel, newStatus, 'new-status')
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
      const statusIds = req.body.statusIds
      // Convert string statusIds to mongoose objectIds
      statusIds.forEach((id, index) => {
        statusIds[index] = new mongoose.Types.ObjectId(String(id))
      })
      const statuses = await Status.find({ _id: { $in: statusIds } })
      const statusUserId = req.body.userId
      if (!statuses || statuses.length === 0) {
        return new Response(res, null, 'Status not found', false, 404)
      }
      if (statusUserId === userId) {
        return new Response(res, null, 'User viewing its own status.', true, 200)
      }
      // update all the statuses to viewed by the user if not already viewed
      for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i]
        if (!status.viewedBy.includes(userId)) {
          status.viewedBy.push(userId)
          await status.save()
        }
      }
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
      userIds.push(userId)
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
