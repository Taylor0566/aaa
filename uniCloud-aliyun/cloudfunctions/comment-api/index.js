const addComment = require('./add-commit.js')
const deleteComment = require('./delete-comment.js')
const getContentRating = require('./get-content-rating.js')
const listComments = require('./list-comments.js')

module.exports.main = async (event, context) => {
  switch (event.action) {
    case 'add-comment':
      return addComment.main(event, context)
    case 'delete-comment':
      return deleteComment.main(event, context)
    case 'get-content-rating':
      return getContentRating.main(event, context)
    case 'list-comments':
      return listComments.main(event, context)
    default:
      return { code: 400, message: '无效的请求' }
  }
}