const { mongoose } = require('./mongoose')

const statusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    default: 'video'
  },
  url: {
    type: String
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  viewedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
},
{
  timestamps: true
}
)
const Status = mongoose.model('Status', statusSchema)

module.exports = { Status }
