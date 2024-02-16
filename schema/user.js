const { mongoose } = require('./mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    unique: true
  },
  username: {
    type: String,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    required: false
  },
  lastLogin: Date,
  onlineStatus: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  },
  otp: {
    type: String,
    length: 6,
    required: false
  }

},
{
  timestamps: true
}
)

const User = mongoose.model('User', userSchema)

module.exports = { User }
