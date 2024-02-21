const { Response } = require('../utils/Response')
const { ErrorHandler } = require('../utils/ErrorHandler')
const { User } = require('../schema/user')
const { ChatRoom } = require('../schema/chatRoom')
const { mongoose } = require('../schema/mongoose')
const { Message } = require('../schema/message')

class ChatController {
  /**
     * API | GET | /api/chatroom
     * API is used to get the chat room by the user id and the logged in user
     * @example {
     *  "userId": string // Chatter id
     * }
     * @param {*} req
     * @param {*} res
     * @returns
     */
  static async getChatRoom (req, res) {
    try {
      const loggedInUser = req.user
      const chatterrId = req.query.userId
      // Check if the user exists
      const chatter = await User.findById(chatterrId)
      if (!chatter) {
        return new Response(res, null, 'User not found', false, 404)
      }
      let chatRoom = await ChatRoom.aggregate(ChatController.getChatRoomPipeline(loggedInUser, chatter))
      if (chatRoom && chatRoom.length > 0) {
        return new Response(res, chatRoom[0], 'Chat room found', true, 200)
      }
      // Create a chat room
      const newChatRoom = new ChatRoom({
        participants: [loggedInUser._id, chatter._id]
      })
      await newChatRoom.save()
      // Store a draft message in message collection
      const newMessage = new Message({
        chatroomId: newChatRoom._id,
        sender: loggedInUser._id,
        content: '',
        type: 'text'
      })
      await newMessage.save()
      // Store the message id in the chat room
      newChatRoom.lastMessage = newMessage._id
      await newChatRoom.save()
      // Get the chat room with the participants
      chatRoom = await ChatRoom.aggregate(ChatController.getChatRoomPipeline(loggedInUser, chatter))
      return new Response(res, chatRoom[0], 'Chat room created', true, 201)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }

  /**
   * API | GET | /api/chatroom/all
   * API is used to get all the chat rooms of the logged in user
   * @param {*} req
   * @param {*} res
   * @returns
   */
  static async getChatRooms (req, res) {
    try {
      const loggedInUser = req.user
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 10
      const chatRooms = await ChatRoom.aggregate([
        {
          $match: {
            participants: {
              $in: [new mongoose.Types.ObjectId(String(loggedInUser._id))]
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'participants',
            foreignField: '_id',
            as: 'participants'
          }
        },
        {
          $addFields: {
            participants: {
              $filter: {
                input: '$participants',
                as: 'participant',
                cond: { $ne: ['$$participant._id', new mongoose.Types.ObjectId(String(loggedInUser._id))] }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'messages',
            localField: '_id',
            foreignField: 'chatroomId',
            as: 'messages'
          }
        },
        {
          $addFields: {
            unreadMessages: {
              $size: {
                $filter: {
                  input: '$messages',
                  as: 'message',
                  cond: {
                    $and: [
                      { $eq: ['$$message.isRead', false] },
                      { $ne: ['$$message.sender', new mongoose.Types.ObjectId(String(loggedInUser._id))] }
                    ]
                  }
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'messages',
            localField: 'lastMessage',
            foreignField: '_id',
            as: 'lastMessage'
          }
        },
        {
          $unwind: {
            path: '$lastMessage',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lastMessage.sender',
            foreignField: '_id',
            as: 'lastMessage.sender'
          }
        },
        {
          $lookup: {
            from: 'favoritechatrooms',
            let: { chatRoomId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$chatRoomId', '$$chatRoomId'] },
                      { $eq: ['$userId', new mongoose.Types.ObjectId(String(loggedInUser._id))] }
                    ]
                  }
                }
              }
            ],
            as: 'favorite'
          }
        },
        {
          $unwind: {
            path: '$lastMessage.sender',
            preserveNullAndEmptyArrays: true

          }
        },
        {
          $addFields: {
            // Check if the chat room is favorite or not by checking the length of the favorite array
            isFavorite: { $gt: [{ $size: '$favorite' }, 0] }
          }
        },
        {
          $unwind: {
            path: '$lastMessage.sender',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$participants',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $sort: {
            'lastMessage.createdAt': -1
          }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        },
        {
          $project: {
            messages: 0,
            favorite: 0
          }
        }
      ])
      const totalDocuments = await ChatRoom.countDocuments({
        participants: {
          $in: [new mongoose.Types.ObjectId(String(loggedInUser._id))]
        }
      })
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
      return new Response(res, { chatRooms, pagination }, 'Chat rooms found', true, 200)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }

  /**
   * API | GET | /api/chatroom/id
   * @param {*} req
   * @param {*} res
   * @returns
   */
  static async getChatRoomById (req, res) {
    try {
      const chatRoomId = req.params.id
      const page = req.query.page || 1
      const limit = req.query.limit || 10
      const chatRoom = await ChatRoom.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(String(chatRoomId))
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'participants',
            foreignField: '_id',
            as: 'participants'
          }
        },
        {
          $lookup: {
            from: 'messages',
            localField: 'lastMessage',
            foreignField: '_id',
            as: 'lastMessage'
          }
        },
        {
          $lookup: {
            from: 'messages',
            localField: '_id',
            foreignField: 'chatroomId',
            as: 'messages'
          }
        },
        {
          $unwind: {
            path: '$lastMessage',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            participants: 1,
            lastMessage: 1,
            messages: 1
          }
        },
        {
          $sort: {
            'messages.createdAt': -1
          }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit

        }
      ])
      return new Response(res, chatRoom, 'Chat room found', true, 200)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }

  // Pipeline to get the chat rooms
  static getChatRoomPipeline (loggedInUser, chatter) {
    return [
      {
        $match: {
          participants: {
            $all: [new mongoose.Types.ObjectId(String(loggedInUser._id)), new mongoose.Types.ObjectId(String(chatter._id))]
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participants'
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'lastMessage',
          foreignField: '_id',
          as: 'lastMessage'

        }
      },
      {
        $unwind: {
          path: '$lastMessage',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'lastMessage.sender'
        }
      },
      {
        $unwind: {
          path: '$lastMessage.sender',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'chatroomId',
          as: 'messages'
        }
      },
      {
        $lookup: {
          from: 'favoritechatrooms',
          let: { chatRoomId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$chatRoomId', '$$chatRoomId'] },
                    { $eq: ['$userId', new mongoose.Types.ObjectId(String(loggedInUser._id))] }
                  ]
                }
              }
            }
          ],
          as: 'favorite'
        }
      },
      {
        $addFields: {
          // Check if the chat room is favorite or not by checking the length of the favorite array
          isFavorite: { $gt: [{ $size: '$favorite' }, 0] }
        }
      },
      {
        $project: {
          participants: 1,
          lastMessage: 1,
          messages: 1
        }
      }
    ]
  }
}

module.exports = { ChatController }
