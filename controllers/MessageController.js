const { Response } = require('../utils/Response')
const { ErrorHandler } = require('../utils/ErrorHandler')
const { ChatRoom } = require('../schema/chatRoom')
const { Message } = require('../schema/message')
const { PusherHelper } = require('../helper/PusherHelper')
const { mongoose } = require('../schema/mongoose')

class MessageController {
  /**
         * API | POST | /api/message
         * API is used to send a message to a chat room
         * @example {
         *  "chatroomId": string,
         *  "content": string,
         *  "type": string
         * }
         * @param {*} req
         * @param {*} res
         * @returns
         */
  static async sendMessage (req, res) {
    try {
      const loggedInUser = req.user
      const chatroomId = req.body.chatroomId
      const content = req.body.content
      const type = req.body.type

      // Validate if the chat room exists
      const chatRoom = await ChatRoom.findById(chatroomId)
      if (!chatRoom) {
        return new Response(res, null, 'Chat room not found', false, 404)
      }
      // Validate if the user is a participant of the chat room
      if (!chatRoom.participants.includes(loggedInUser._id)) {
        return new Response(res, null, 'Unauthorized', false, 401)
      }
      // Check if there is only message in the chatroom and the content is empty
      const messages = await Message.find({ chatroomId })
      if (messages.length === 1 && messages[0].content === '') {
        // Delete the message
        await Message.deleteOne({ _id: messages[0]._id })
      }
      // Store the message in the message collection
      const newMessage = new Message({
        chatroomId,
        sender: loggedInUser._id,
        content,
        type
      })
      await newMessage.save()
      // Update the chat room with the last message
      chatRoom.lastMessage = newMessage._id
      await chatRoom.save()
      // Push the message to the chat room channel
      const channel = 'chat-room'
      PusherHelper.sendNotification(channel, newMessage)
      return new Response(res, newMessage, 'Message sent', true, 201)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }

  /**
         * API | GET | /api/message/all
         * API is used to get all the messages of a chat room
         * @param {*} req
         * @param {*} res
         * @returns
         */
  static async getMessages (req, res) {
    try {
      const loggedInUser = req.user
      const chatroomId = req.query.chatroomId
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 10
      // Validate if the chat room exists
      // Get the chatroom along with the participants details
      let chatRoom = await ChatRoom.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(String(chatroomId)),
            participants: { $in: [loggedInUser._id] }
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
          $project: {
            participants: {
              $filter: {
                input: '$participants',
                as: 'participant',
                cond: { $ne: ['$$participant._id', loggedInUser._id] }
              }
            }
          }
        },
        {
          $unwind: '$participants'
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
            isFavorite: { $gt: [{ $size: '$favorite' }, 0] }
          }
        },
        {
          $project: {
            favorite: 0
          }
        }

      ])
      chatRoom = chatRoom[0]
      if (!chatRoom) {
        return new Response(res, null, 'Chat room not found', false, 404)
      }
      // Get all the messages of the chat room with pagination
      let messages = await Message.aggregate([
        {
          $match: {
            chatroomId: new mongoose.Types.ObjectId(String(chatroomId))
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender'
          }
        },
        {
          $unwind: '$sender'
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            messages: {
              $push: '$$ROOT'
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])

      messages = messages.map(group => {
        group.messages = group.messages.reverse()
        return group
      })
      // Update the messages as read
      await Message.updateMany({
        chatroomId,
        sender: { $ne: loggedInUser._id }
      }, {
        isRead: true
      })
      const totalDocuments = await Message.countDocuments({ chatroomId })
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
      return new Response(res, { chatRoom, messages, pagination }, 'Messages found', true, 200)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }

  static async getMessagesById (req, res) {
    try {
      const loggedInUser = new mongoose.Types.ObjectId(String(req.user._id))
      const chatroomId = new mongoose.Types.ObjectId(String(req.query.chatroomId))
      let messageId = null
      if (req.query.messageId && mongoose.Types.ObjectId.isValid(req.query.messageId)) {
        messageId = new mongoose.Types.ObjectId(String(req.query.messageId))
      }
      const messagesType = req.query.messagesType || 'new'
      const isSearchQuery = req.query.isSearchQuery || false
      const limit = parseInt(req.query.limit) || 10

      let chatRoom = await ChatRoom.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(String(chatroomId)),
            participants: { $in: [loggedInUser._id] }
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
          $project: {
            participants: {
              $filter: {
                input: '$participants',
                as: 'participant',
                cond: { $ne: ['$$participant._id', loggedInUser._id] }
              }
            }
          }
        },
        {
          $unwind: '$participants'
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
            isFavorite: { $gt: [{ $size: '$favorite' }, 0] }
          }
        },
        {
          $project: {
            favorite: 0
          }
        }

      ])
      chatRoom = chatRoom[0]
      if (!chatRoom) {
        return new Response(res, null, 'Chat room not found', false, 404)
      }
      /**
       * 1 - If the message id is not provided. Get the last 10 messages
       * 2 - If the message id is provided and the message type is old. Get the 10 messages before the message id
       * 3 - If the message id is provided and the message type is new. Get the 10 messages after the message id
       * 4 - If the message id is provided also isSearchQuery is true, Get 10 old messages and 10 new messages including the message id
       */

      const matchCondition = {
        chatroomId
      }
      // Match condition
      if (messageId) {
        switch (messagesType) {
          case 'old':
            matchCondition._id = { $lt: messageId }
            break
          case 'new':
            matchCondition._id = { $gt: messageId }
            break
        }
      }
      let messages = []
      if (!isSearchQuery) {
        messages.push(...await MessageController.getMessagesWithoutSearch(matchCondition, limit))
        messages = messages.map(group => {
          group.messages = group.messages.reverse()
          return group
        })
      } else {
        messages.push(...await MessageController.getMessagesAroundId(chatroomId, messageId, limit))
      }
      // Update the messages as read
      await Message.updateMany({
        chatroomId,
        sender: { $ne: loggedInUser._id }
      }, {
        isRead: true
      })
      return new Response(res, { chatRoom, messages }, 'Messages found', true, 200)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }

  /**
   * API | PUT | /api/message/read
   * API is used to update the messages as read
   * @example {
   * "chatroomId": string
   * }
   * @param {*} req
   * @param {*} res
   * @returns
   */
  static async readMessages (req, res) {
    try {
      const loggedInUser = req.user
      const chatroomId = req.body.chatroomId
      // Validate if the chat room exists
      const chatRoom = await ChatRoom.findById(chatroomId)
      if (!chatRoom) {
        return new Response(res, null, 'Chat room not found', false, 404)
      }
      // Validate if the user is a participant of the chat room
      if (!chatRoom.participants.includes(loggedInUser._id)) {
        return new Response(res, null, 'Unauthorized', false, 401)
      }
      // Update the messages as read
      await Message.updateMany({
        chatroomId,
        sender: { $ne: loggedInUser._id }
      }, {
        isRead: true
      })
      return new Response(res, null, 'Messages read', true, 200)
    } catch (error) {
      ErrorHandler.sendError(res, error)
    }
  }

  static async getMessagesWithoutSearch (matchCondition, limit = 10) {
    return await Message.aggregate([
      {
        $match: matchCondition
      },
      {
        $sort: { _id: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $unwind: '$sender'
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          messages: {
            $push: '$$ROOT'
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ])
  }

  static async getMessagesAroundId (chatroomId, messageId, limit = 10) {
    let olderMessages = await Message.aggregate([
      {
        $match: {
          chatroomId,
          _id: { $lte: messageId }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: Math.floor(limit / 2)
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $unwind: '$sender'
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          messages: {
            $push: '$$ROOT'
          }
        }
      }
    ])

    // Reverse the messages inside group
    olderMessages = olderMessages.map(group => {
      group.messages = group.messages.reverse()
      return group
    })

    const newerMessages = await Message.aggregate([
      {
        $match: {
          chatroomId,
          _id: { $gt: messageId }
        }
      },
      {
        $sort: { createdAt: 1 }
      },
      {
        $limit: Math.ceil(limit / 2)
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $unwind: '$sender'
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          messages: {
            $push: '$$ROOT'
          }
        }
      }
    ])

    const allMessages = [...olderMessages, ...newerMessages]

    const groupedMessages = MessageController.groupMessagesByDate(allMessages)
    return groupedMessages
  }

  static groupMessagesByDate (data) {
    const mergedData = data.reduce((accumulator, entry) => {
      const { _id, messages } = entry
      // If the date already exists in the accumulator, merge the messages
      if (accumulator[_id]) {
        accumulator[_id].messages.push(...messages)
      } else {
        // Otherwise, create a new entry in the accumulator
        accumulator[_id] = { _id, messages: [...messages] }
      }
      return accumulator
    }, {})

    // Convert the merged data back to an array if needed
    const resultArray = Object.values(mergedData)
    return resultArray
  }
}

module.exports = { MessageController }
