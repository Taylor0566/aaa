const db = uniCloud.database()
const dbCmd = db.command

exports.getUserList = async (event, context) => {
  const { 
    keyword, 
    startDate, 
    endDate, 
    page = 1, 
    pageSize = 10,
    status = 'all'
  } = event
  
  // 构建查询条件
  let where = {}
  
  // 关键词搜索
  if (keyword) {
    where = dbCmd.or([
      { username: new RegExp(keyword, 'i') },
      { email: new RegExp(keyword, 'i') }
    ])
  }
  
  // 时间筛选
  if (startDate && endDate) {
    where.create_time = dbCmd.and(
      dbCmd.gte(new Date(startDate)),
      dbCmd.lte(new Date(endDate))
    )
  } else if (startDate) {
    where.create_time = dbCmd.gte(new Date(startDate))
  } else if (endDate) {
    where.create_time = dbCmd.lte(new Date(endDate))
  }
  
  // 状态筛选
  if (status !== 'all') {
    where.status = status === 'active' ? 0 : 1
  }
  
  // 执行查询
  const skip = (page - 1) * pageSize
  const total = await db.collection('users').where(where).count()
  const users = await db.collection('users')
    .where(where)
    .orderBy('create_time', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()
  
  return {
    code: 200,
    data: {
      list: users.data,
      total: total.total,
      page,
      pageSize,
      totalPages: Math.ceil(total.total / pageSize)
    }
  }
}

exports.toggleUserStatus = async (event, context) => {
  const { user_id, status } = event
  
  if (!user_id) {
    return { code: 400, message: '用户ID不能为空' }
  }
  
  const res = await db.collection('users')
    .doc(user_id)
    .update({
      status: status ? 1 : 0,
      updated_at: new Date()
    })
  
  if (res.updated === 1) {
    return { code: 200, message: `用户已${status ? '禁用' : '启用'}` }
  }
  
  return { code: 500, message: '操作失败' }
}

exports.deleteUser = async (event, context) => {
  const { user_id } = event
  
  if (!user_id) {
    return { code: 400, message: '用户ID不能为空' }
  }
  
  // 软删除：设置 deleted_at 字段
  const res = await db.collection('users').doc(user_id).update({
    deleted_at: new Date(),
    status: -1 // 标记为删除状态
  })
  
  if (res.updated === 1) {
    return { code: 200, message: '用户已删除（保留7天可恢复）' }
  }
  
  return { code: 500, message: '删除失败' }
}

exports.getUserDetail = async (event, context) => {
  const { user_id } = event
  
  if (!user_id) {
    return { code: 400, message: '用户ID不能为空' }
  }
  
  // 获取用户基本信息
  const user = await db.collection('users').doc(user_id).get()
  
  if (user.data.length === 0) {
    return { code: 404, message: '用户不存在' }
  }
  
  // 获取用户发布的内容数量
  const contentCount = await db.collection('contents').where({ user_id }).count()
  
  // 获取用户评论数量
  const commentCount = await db.collection('comments').where({ user_id }).count()
  
  return {
    code: 200,
    data: {
      userInfo: user.data[0],
      contentCount: contentCount.total,
      commentCount: commentCount.total
    }
  }
}