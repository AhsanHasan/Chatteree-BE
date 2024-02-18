const { mongoose } = require('./mongoose')

const messageSchema = new mongoose.Schema({
  chatroomId: mongoose.Schema.Types.ObjectId,
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  }
},
{
  timestamps: true
}
)
const Message = mongoose.model('ChatRoom', messageSchema)

module.exports = { Message }
