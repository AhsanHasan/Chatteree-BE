const { Response } = require('../utils/Response')
const { ErrorHandler } = require('../utils/ErrorHandler')
const { FavoriteChatRoom } = require('../schema/favorite-chatroom')
const { mongoose } = require('../schema/mongoose')

class FavoriteController {
  /**
     * API | GET | /api/favorite-chatroom
     * API is used to favorite chat rooms
     * @example {
     *  "userId": string // User id
     *  "chatRoomId": string // Chat room id
     * }
     * @param {*} req
     * @param {*} res
     * @returns
     */
  static async favoriteChatRoom (req, res) {
    try {
      const userId = req.user._id
      const chatRoomId = req.body.chatRoomId
      const favorite = await FavoriteChatRoom.findOne({ userId, chatRoomId })
      if (favorite) {
        // Unfavorite the chat room
        await FavoriteChatRoom.deleteOne({ userId, chatRoomId })
        return new Response(res, null, 'Chat room unfavorited', true, 200)
      }
      const newFavorite = new FavoriteChatRoom({ userId, chatRoomId })
      await newFavorite.save()
      return new Response(res, newFavorite, 'Chat room favorited', true, 201)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }

  /**
   * API | Favorites | /api/favorite-chatroom
   * API is used to get the favorite chat rooms of the logged in user
   * @param {*} req
   * @param {*} res
   * @returns
   */
  static async getFavoriteChatRooms (req, res) {
    try {
      const userId = req.user._id
      // Get the favorite chat rooms also add the total number of unread messages
      const favoriteChatRooms = await FavoriteChatRoom.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(String(userId))
          }
        },
        {
          $lookup: {
            from: 'chatrooms',
            localField: 'chatRoomId',
            foreignField: '_id',
            as: 'chatRoom'
          }
        },
        {
          $unwind: '$chatRoom'
        },
        {
          $lookup: {
            from: 'messages',
            let: { chatRoomId: '$chatRoom._id', userId: new mongoose.Types.ObjectId(String(userId)) },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$chatroomId', '$$chatRoomId'] },
                      { $ne: ['$sender', '$$userId'] },
                      { $eq: ['$isRead', false] }
                    ]
                  }
                }
              },
              {
                $count: 'unreadMessages'
              }
            ],
            as: 'unreadMessages'
          }
        },
        {
          $unwind: {
            path: '$unreadMessages',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'chatRoom.participants',
            foreignField: '_id',
            as: 'chatRoom.participants'
          }
        },
        {
          $addFields: {
            'chatRoom.participants': {
              $filter: {
                input: '$chatRoom.participants',
                as: 'participant',
                cond: { $ne: ['$$participant._id', new mongoose.Types.ObjectId(String(userId))] }
              }
            }
          }
        },
        {
          $unwind: {
            path: '$chatRoom.participants'
          }
        },
        {
          $project: {
            chatRoom: 1,
            unreadMessages: {
              $ifNull: ['$unreadMessages.unreadMessages', 0]
            }
          }
        }
      ])
      return new Response(res, favoriteChatRooms, 'Favorite chat rooms', true)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }
}

module.exports = { FavoriteController }
