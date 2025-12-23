// uniCloud-aliyun/cloudfunctions/admin-api/index.js
const userManage = require('./user-manage.js')
const contentManage = require('./content-manage.js')
const systemStats = require('./system-stats.js')
const { verifyAdminToken } = require('admin-auth')

exports.main = async (event, context) => {
  // 验证管理员权限
  try {
    const payload = verifyAdminToken(event.token, context)
    if (!payload?.role || !payload.role.includes('admin')) {
      return { code: 403, message: '没有管理员权限' }
    }
  } catch (e) {
    return { code: 403, message: '没有管理员权限: ' + e.message }
  }

  switch (event.action) {
    // 用户管理
    case 'getUserList':
      return userManage.getUserList(event, context)
    case 'toggleUserStatus':
      return userManage.toggleUserStatus(event, context)
    case 'deleteUser':
      return userManage.deleteUser(event, context)
    case 'getUserDetail':
      return userManage.getUserDetail(event, context)
      
    // 内容管理
    case 'getContentList':
      return contentManage.getContentList(event, context)
    case 'updateContentStatus':
      return contentManage.updateContentStatus(event, context)
    case 'deleteContent':
      return contentManage.deleteContent(event, context)
    case 'getContentDetail':
      return contentManage.getContentDetail(event, context)
      
    // 系统统计
    case 'getSystemStats':
      return systemStats.getSystemStats(event, context)
    case 'getTrendData':
      return systemStats.getTrendData(event, context)
      
    default:
      return { code: 400, message: '无效的请求' }
  }
}
