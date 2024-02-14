const { Response } = require("../utils/Response")
const { mailSender } = require('./../utils/MailSender')
const { PromiseEjs } = require('../utils/PromiseEjs')

class TestController {
    static async testHello(req, res) {
        // generate a 6 digit OTP
        let otp = Math.floor(100000 + Math.random() * 900000)
        let html = await PromiseEjs.renderFile('./emails/verifyEmail.ejs', { otp })
        mailSender.sendMail('syed.khan7007@gmail.com', 'Chatteree | Welcome', html)
        return new Response(res, null, 'Hello World!', true)
    }
}

module.exports = { TestController }