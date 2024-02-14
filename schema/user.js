const { mongoose } = require('./mongoose')

var userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        unique: true
    },
    emailVerificationCode: String,
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
    }

},
{
    timestamps: true
}
)

let User = mongoose.model('User', userSchema)

module.exports = { User }
