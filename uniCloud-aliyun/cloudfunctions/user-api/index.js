const register = require('./register.js')
const login = require('./login.js')
const profile = require('./profile.js')
const updatePassword = require('./update-password.js')

exports.main = async (event, context) => {
  switch (event.action) {
    case 'register':
      return register.main(event, context)
    case 'login':
      return login.main(event, context)
    case 'profile':
      return profile.main(event, context)
    case 'update-password':
      return updatePassword.main(event, context)
    default:
      return { code: 400, message: '无效的请求' }
  }
}
