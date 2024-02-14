'use strict'
const { Response } = require('./Response')

class ErrorHandler {
    static sendError (res, error) {
        try {
            console.log(error)
            return new Response(res, error, JSON.stringify(error), false, error.code)
        } catch (error) {
            return new Response(res, { success: false }, 'Something went wrong', false, 500)
        }
    }

    static showError (error) {
        console.log(error)
    }
}

module.exports = { ErrorHandler }
