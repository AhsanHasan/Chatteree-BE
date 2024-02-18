const { mongoose } = require('./mongoose')

const chatRoomSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
},
{
  timestamps: true
}
)
const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema)

module.exports = { ChatRoom }
