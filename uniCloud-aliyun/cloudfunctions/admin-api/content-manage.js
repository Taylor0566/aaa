const db = uniCloud.database()
const dbCmd = db.command

exports.getContentList = async (event, context) => {
  const { 
    contentType, 
    status, 
    startDate, 
    endDate, 
    page = 1, 
    pageSize = 10,
    keyword = ''
  } = event
  
  // 构建查询条件
  let where = {}
  
  // 内容类型筛选
  if (contentType && contentType !== 'all') {
    where.content_type = contentType
  }
  
  // 状态筛选
  if (status && status !== 'all') {
    where.status = status
  }
  
  // 时间筛选
  if (startDate && endDate) {
    where.created_at = dbCmd.and(
      dbCmd.gte(new Date(startDate)),
      dbCmd.lte(new Date(endDate))
    )
  } else if (startDate) {
    where.created_at = dbCmd.gte(new Date(startDate))
  } else if (endDate) {
    where.created_at = dbCmd.lte(new Date(endDate))
  }
  
  // 关键词搜索
  if (keyword) {
    where.title = new RegExp(keyword, 'i')
  }
  
  // 执行查询
  const skip = (page - 1) * pageSize
  const total = await db.collection('contents').where(where).count()
  const contents = await db.collection('contents')
    .where(where)
    .orderBy('created_at', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()
  
  // 获取内容对应的用户名
  for (let content of contents.data) {
    const user = await db.collection('users').doc(content.user_id).field({ username: true }).get()
    content.username = user.data.length > 0 ? user.data[0].username : '未知用户'
  }
  
  return {
    code: 200,
    data: {
      list: contents.data,
      total: total.total,
      page,
      pageSize,
      totalPages: Math.ceil(total.total / pageSize)
    }
  }
}

exports.updateContentStatus = async (event, context) => {
  const { content_id, status, reason = '' } = event
  
  if (!content_id || !status) {
    return { code: 400, message: '参数不完整' }
  }
  
  const updateData = {
    status,
    updated_at: new Date()
  }
  
  // 如果是拒绝，添加拒绝原因
  if (status === 'rejected') {
    updateData['content_check.reject_reason'] = reason
    updateData['content_check.status'] = 'rejected'
    updateData['content_check.check_time'] = new Date()
  } else if (status === 'approved') {
    updateData['content_check.status'] = 'passed'
    updateData['content_check.check_time'] = new Date()
  }
  
  const res = await db.collection('contents')
    .doc(content_id)
    .update(updateData)
  
  if (res.updated === 1) {
    return { code: 200, message: '内容状态已更新' }
  }
  
  return { code: 500, message: '操作失败' }
}

exports.deleteContent = async (event, context) => {
  const { content_id } = event
  
  if (!content_id) {
    return { code: 400, message: '内容ID不能为空' }
  }
  
  // 软删除
  const res = await db.collection('contents').doc(content_id).update({
    deleted_at: new Date(),
    status: 'deleted'
  })
  
  if (res.updated === 1) {
    return { code: 200, message: '内容已删除（保留7天可恢复）' }
  }
  
  return { code: 500, message: '删除失败' }
}

exports.getContentDetail = async (event, context) => {
  const { content_id } = event
  
  if (!content_id) {
    return { code: 400, message: '内容ID不能为空' }
  }
  
  // 获取内容详情
  const content = await db.collection('contents').doc(content_id).get()
  
  if (content.data.length === 0) {
    return { code: 404, message: '内容不存在' }
  }
  
  // 获取发布者信息
  const user = await db.collection('users').doc(content.data[0].user_id).field({ username: true, email: true }).get()
  
  // 获取评论列表
  const comments = await db.collection('comments')
    .where({ content_id })
    .orderBy('created_at', 'desc')
    .limit(10)
    .get()
  
  return {
    code: 200,
    data: {
      content: content.data[0],
      userInfo: user.data.length > 0 ? user.data[0] : null,
      comments: comments.data
    }
  }
}