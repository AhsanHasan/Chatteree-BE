'use strict'

const { Response } = require('./Response')

class ErrorHandler {
  static sendError (res, error) {
    try {
      console.log(error)
      if (error.code <= 500 && error.code >= 300) {
        return new Response(res, false, error, JSON.stringify(error), 400)
      } else if (typeof error === 'string') {
        return new Response(res, false, error, JSON.stringify(error), 500)
      } else {
        // If the error is not a string, then it is an Error object
        return new Response(res, false, error.stack, error.toString(), 500)
      }
    } catch (error) {
      return new Response(res, false, { success: false }, 'Something went wrong', 500)
    }
  }
}

module.exports = { ErrorHandler }
