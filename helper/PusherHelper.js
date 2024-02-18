const config = require('../config.json')
const Pusher = require('pusher')

class PusherHelper {
  static async sendNotification (channel, data, event = 'new-message') {
    const pusher = new Pusher({
      appId: config.PUSHER.appId,
      key: config.PUSHER.key,
      secret: config.PUSHER.secret,
      cluster: config.PUSHER.cluster,
      useTLS: true
    })
    pusher.trigger(channel, event, data)
  }
}

module.exports = { PusherHelper }
