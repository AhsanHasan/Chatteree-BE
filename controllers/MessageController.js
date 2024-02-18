const { Response } = require('../utils/Response')
const { ErrorHandler } = require('../utils/ErrorHandler')
const { ChatRoom } = require('../schema/chatRoom')
const { Message } = require('../schema/message')
const { PusherHelper } = require('../helper/PusherHelper')
// const { mongoose } = require('../schema/mongoose')

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
      const channel = `chat-room-${chatroomId}`
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
      const chatRoom = await ChatRoom.findById(chatroomId)
      if (!chatRoom) {
        return new Response(res, null, 'Chat room not found', false, 404)
      }
      // Validate if the user is a participant of the chat room
      if (!chatRoom.participants.includes(loggedInUser._id)) {
        return new Response(res, null, 'Unauthorized', false, 401)
      }
      // Get all the messages of the chat room with pagination
      const messages = await Message.find({
        chatroomId
      }).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit).populate('sender')
      return new Response(res, messages, 'Messages found', true, 200)
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
}

module.exports = { MessageController }
