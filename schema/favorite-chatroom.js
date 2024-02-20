const { mongoose } = require('./mongoose')

const favoriteChatRoomSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom'
  }
},
{
  timestamps: true
}
)
const FavoriteChatRoom = mongoose.model('FavoriteChatRoom', favoriteChatRoomSchema)

module.exports = { FavoriteChatRoom }
