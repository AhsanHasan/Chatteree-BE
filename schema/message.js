const { mongoose } = require('./mongoose')

const messageSchema = new mongoose.Schema({
  chatroomId: mongoose.Schema.Types.ObjectId,
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  content: {
    type: String,
    required: false
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
const Message = mongoose.model('Message', messageSchema)

module.exports = { Message }
