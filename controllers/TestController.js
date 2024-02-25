const { Response } = require('../utils/Response')

class TestController {
  static async testHello (req, res) {
    // generate a 6 digit OTP
    return new Response(res, null, 'Hello World!', true)
  }
}

module.exports = { TestController }
