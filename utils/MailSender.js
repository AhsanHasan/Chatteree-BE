'use strict'
const nodemailer = require('nodemailer')
const config = require('./../config.json')

class MailSender {
  /**
     * sendMail
     * Sends html emails to specified email address(es)
     * @param {string} to
     * @param {string} subject
     * @param {string} html
     */
  async sendMail (to, subject, html) {
    try {
      const transporter = await MailSender.prototype.createTransporter()
      const mailOptions = {
        from: `Chatteree <${config.MAIL_FROM_ADDRESS}>`,
        to,
        subject,
        html
      }
      const response = await transporter.sendMail(mailOptions)
      return response
    } catch (error) {
      console.log(error)
    }
  }

  /**
     * createTransporter
     * Creates a nodemailer test account and transporter and returns a promise to resolve
     * when the transporter is created.
     */
  async createTransporter () {
    return new Promise((resolve, reject) => {
      nodemailer.createTestAccount((err, account) => {
        const transporter = nodemailer.createTransport({
          name: config.MAIL_FROM_NAME,
          host: config.MAIL_HOST,
          port: config.MAIL_PORT,
          secure: config.MAIL_ENCRYPTION,
          auth: {
            user: config.MAIL_FROM_ADDRESS,
            pass: config.MAIL_PASSWORD
          }
        })
        if (err) { reject(err) } else resolve(transporter)
      })
    })
  }
}

const mailSender = new MailSender()
module.exports = { mailSender }
