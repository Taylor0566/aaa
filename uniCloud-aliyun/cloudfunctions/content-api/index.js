const createContent = require('./create-content.js')
const updateContent = require('./update-content.js')
const deleteContent = require('./delete-content.js')
const approveContent = require('./approve-content.js')

exports.main = async (event, context) => {
  switch (event.action) {
    case 'create-content':
      return createContent.main(event, context)
    case 'update-content':
      return updateContent.main(event, context)
    case 'delete-content':
      return deleteContent.main(event, context)
    case 'approve-content':
      return approveContent.main(event, context)
    default:
      return { code: 400, message: '无效的请求' }
  }
}
