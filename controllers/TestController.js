const { Response } = require("../utils/Response")

class TestController {
    static async testHello(req, res) {
        return new Response(res, null, 'Hello World!', true)
    }
}

module.exports = { TestController }