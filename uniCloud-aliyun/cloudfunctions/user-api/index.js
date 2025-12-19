// index.js - 用户系统主云函数（完整版）
'use strict';
const uniID = require('uni-id-common')
const db = uniCloud.database()
const dbCmd = db.command
const userProfileCollection = db.collection('user-profile')
const userFollowsCollection = db.collection('user-follows')
const uniIDUsersCollection = db.collection('uni-id-users')

exports.main = async (event, context) => {
  const { action, data } = event
  const uniIDIns = uniID.createInstance({ context })
  const payload = await uniIDIns.checkToken(event.uniIdToken)
  
  if (payload.code) {
    // 如果是 register、login、logout 操作，不需要 token
    if (['register', 'login', 'logout'].includes(action)) {
      // 这些操作走 uniID 自己的逻辑
    } else {
      return payload
    }
  }
  
  const uid = payload.uid
  const userInfo = payload.userInfo
  
  switch (action) {
    // uniID 内置功能
    case 'register':
      return await uniIDIns.register(data)
    case 'login':
      return await uniIDIns.login(data)
    case 'logout':
      return await uniIDIns.logout(event.uniIdToken)
    case 'updatePwd':
      return await uniIDIns.updatePwd(data)
    case 'resetPwd':
      return await uniIDIns.resetPwd(data)
    case 'sendSmsCode':
      return await uniIDIns.sendSmsCode(data)
      
    // 您已经实现的功能
    case 'getProfile': // 获取用户资料
      return await getProfile(data, uid)
    case 'updateProfile': // 更新用户资料
      return await updateProfile(data, uid)
    case 'getUserContents': // 获取用户发布的内容
      return await getUserContents(data, uid)
    case 'followUser': // 关注用户
      return await followUser(data, uid)
    case 'unfollowUser': // 取消关注
      return await unfollowUser(data, uid)
    case 'getFollowers': // 获取粉丝列表
      return await getFollowers(data, uid)
    case 'getFollowing': // 获取关注列表
      return await getFollowing(data, uid)
      
    // 需要补充的功能
    case 'checkFollow': // 检查关注状态
      return await checkFollow(data, uid)
    case 'getUserStats': // 获取用户统计
      return await getUserStats(data, uid)
    case 'searchUsers': // 搜索用户
      return await searchUsers(data, uid)
    case 'getCurrentUser': // 获取当前用户信息
      return await getCurrentUser(uid)
    case 'uploadAvatar': // 上传头像
      return await uploadAvatar(data, uid)
    case 'updatePassword': // 修改密码（扩展）
      return await updatePassword(data, uid)
    case 'bindMobile': // 绑定手机号
      return await bindMobile(data, uid)
    case 'bindEmail': // 绑定邮箱
      return await bindEmail(data, uid)
      
    default:
      return {
        code: 400,
        message: '无效的操作'
      }
  }
}

// ==================== 以下是需要补充的函数 ====================

// 检查关注状态
async function checkFollow(data, uid) {
  const { target_user_id } = data
  
  if (!target_user_id) {
    return {
      code: 400,
      message: '目标用户ID不能为空'
    }
  }
  
  try {
    const followRes = await userFollowsCollection
      .where({
        follower_id: uid,
        following_id: target_user_id
      })
      .get()
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        is_following: followRes.data.length > 0
      }
    }
  } catch (error) {
    return {
      code: 500,
      message: '检查失败',
      error: error.message
    }
  }
}

// 获取用户统计信息（独立接口）
async function getUserStats(data, uid) {
  const { user_id } = data
  
  const targetUserId = user_id || uid
  
  try {
    // 内容数量
    const contentCountRes = await db.collection('contents')
      .where({ 
        user_id: targetUserId, 
        status: 1, 
        is_deleted: false 
      })
      .count()
    
    // 粉丝数量
    const followerCountRes = await userFollowsCollection
      .where({ following_id: targetUserId })
      .count()
    
    // 关注数量
    const followingCountRes = await userFollowsCollection
      .where({ follower_id: targetUserId })
      .count()
    
    // 获赞数量（需要从点赞表中统计）
    const likesCountRes = await db.collection('likes')
      .aggregate()
      .lookup({
        from: 'contents',
        localField: 'content_id',
        foreignField: '_id',
        as: 'content'
      })
      .match({
        'content.user_id': targetUserId,
        'content.is_deleted': false
      })
      .group({
        _id: null,
        total: dbCmd.sum(1)
      })
      .end()
    
    const likesCount = likesCountRes.data[0] ? likesCountRes.data[0].total : 0
    
    // 收藏数量
    const collectCountRes = await db.collection('collects')
      .where({ user_id: targetUserId })
      .count()
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        content_count: contentCountRes.total,
        follower_count: followerCountRes.total,
        following_count: followingCountRes.total,
        likes_count: likesCount,
        collect_count: collectCountRes.total,
        total_view_count: 0 // 如果需要，可以从内容表中累加
      }
    }
  } catch (error) {
    return {
      code: 500,
      message: '获取统计失败',
      error: error.message
    }
  }
}

// 搜索用户
async function searchUsers(data, currentUid) {
  const { keyword, page = 1, pageSize = 20 } = data
  
  if (!keyword || keyword.trim() === '') {
    return {
      code: 400,
      message: '搜索关键词不能为空'
    }
  }
  
  try {
    // 搜索用户资料表中的昵称和签名
    const profileRes = await userProfileCollection
      .where({
        nickname: new RegExp(keyword, 'i')
      })
      .field({
        user_id: true,
        nickname: true,
        avatar: true,
        signature: true
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    if (profileRes.data.length === 0) {
      return {
        code: 0,
        message: '未找到相关用户',
        data: {
          list: [],
          hasMore: false
        }
      }
    }
    
    // 获取用户基础信息
    const userIds = profileRes.data.map(item => item.user_id)
    const userRes = await uniIDUsersCollection
      .where({
        _id: dbCmd.in(userIds)
      })
      .field({
        _id: true,
        username: true,
        email: true,
        mobile: true
      })
      .get()
    
    const userMap = {}
    userRes.data.forEach(user => {
      userMap[user._id] = user
    })
    
    // 获取当前用户对搜索结果用户的关注状态
    const followRes = await userFollowsCollection
      .where({
        follower_id: currentUid,
        following_id: dbCmd.in(userIds)
      })
      .get()
    
    const followingIds = followRes.data.map(item => item.following_id)
    
    // 获取每个用户的粉丝数和内容数
    const userStatsPromises = userIds.map(userId => 
      Promise.all([
        userFollowsCollection.where({ following_id: userId }).count(),
        db.collection('contents').where({ user_id: userId, status: 1 }).count()
      ])
    )
    
    const statsResults = await Promise.all(userStatsPromises)
    
    // 组合数据
    const list = profileRes.data.map((profile, index) => {
      const user = userMap[profile.user_id] || {}
      const [followerRes, contentRes] = statsResults[index]
      
      return {
        ...profile,
        username: user.username || '',
        email: user.email || '',
        mobile: user.mobile || '',
        is_following: followingIds.includes(profile.user_id),
        follower_count: followerRes.total,
        content_count: contentRes.total
      }
    })
    
    return {
      code: 0,
      message: '搜索成功',
      data: {
        list,
        hasMore: list.length === pageSize
      }
    }
  } catch (error) {
    return {
      code: 500,
      message: '搜索失败',
      error: error.message
    }
  }
}

// 获取当前用户信息（简化版）
async function getCurrentUser(uid) {
  try {
    // 获取用户基础信息
    const userRes = await uniIDUsersCollection.doc(uid).get()
    if (!userRes.data[0]) {
      return {
        code: 404,
        message: '用户不存在'
      }
    }
    
    // 获取用户资料
    const profileRes = await userProfileCollection
      .where({ user_id: uid })
      .get()
    
    const profile = profileRes.data[0] || {}
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        ...userRes.data[0],
        ...profile
      }
    }
  } catch (error) {
    return {
      code: 500,
      message: '获取失败',
      error: error.message
    }
  }
}

// 上传头像
async function uploadAvatar(data, uid) {
  const { avatar_url } = data
  
  if (!avatar_url) {
    return {
      code: 400,
      message: '头像URL不能为空'
    }
  }
  
  try {
    // 更新用户资料中的头像
    const existProfile = await userProfileCollection
      .where({ user_id: uid })
      .get()
    
    const updateData = {
      avatar: avatar_url,
      update_date: Date.now()
    }
    
    if (existProfile.data.length > 0) {
      await userProfileCollection
        .doc(existProfile.data[0]._id)
        .update(updateData)
    } else {
      await userProfileCollection.add({
        user_id: uid,
        ...updateData,
        create_date: Date.now()
      })
    }
    
    return {
      code: 0,
      message: '头像更新成功',
      data: {
        avatar: avatar_url
      }
    }
  } catch (error) {
    return {
      code: 500,
      message: '头像更新失败',
      error: error.message
    }
  }
}

// 修改密码（扩展）
async function updatePassword(data, uid) {
  const { oldPassword, newPassword } = data
  
  if (!oldPassword || !newPassword) {
    return {
      code: 400,
      message: '参数不完整'
    }
  }
  
  if (newPassword.length < 6) {
    return {
      code: 400,
      message: '新密码长度不能少于6位'
    }
  }
  
  try {
    const uniIDIns = uniID.createInstance({ context: require('uni-id').getContext() })
    const result = await uniIDIns.updatePwd({
      uid,
      oldPassword,
      newPassword
    })
    
    return result
  } catch (error) {
    return {
      code: 500,
      message: '修改密码失败',
      error: error.message
    }
  }
}

// 绑定手机号
async function bindMobile(data, uid) {
  const { mobile, code } = data
  
  if (!mobile || !code) {
    return {
      code: 400,
      message: '手机号和验证码不能为空'
    }
  }
  
  try {
    const uniIDIns = uniID.createInstance({ context: require('uni-id').getContext() })
    const result = await uniIDIns.bindMobile({
      uid,
      mobile,
      code
    })
    
    return result
  } catch (error) {
    return {
      code: 500,
      message: '绑定手机号失败',
      error: error.message
    }
  }
}

// 绑定邮箱
async function bindEmail(data, uid) {
  const { email, code } = data
  
  if (!email || !code) {
    return {
      code: 400,
      message: '邮箱和验证码不能为空'
    }
  }
  
  try {
    const uniIDIns = uniID.createInstance({ context: require('uni-id').getContext() })
    const result = await uniIDIns.bindEmail({
      uid,
      email,
      code
    })
    
    return result
  } catch (error) {
    return {
      code: 500,
      message: '绑定邮箱失败',
      error: error.message
    }
  }
}

// ==================== 以下是需要完善的其他函数 ====================

// 取消关注
async function unfollowUser(data, uid) {
  const { target_user_id } = data
  
  if (uid === target_user_id) {
    return {
      code: 400,
      message: '不能取消关注自己'
    }
  }
  
  try {
    // 查找关注记录
    const followRes = await userFollowsCollection
      .where({
        follower_id: uid,
        following_id: target_user_id
      })
      .get()
    
    if (followRes.data.length === 0) {
      return {
        code: 400,
        message: '未关注该用户'
      }
    }
    
    // 删除关注记录
    await userFollowsCollection.doc(followRes.data[0]._id).remove()
    
    // 更新关注数
    await userProfileCollection
      .where({ user_id: uid })
      .update({
        following_count: dbCmd.inc(-1)
      })
    
    // 更新粉丝数
    await userProfileCollection
      .where({ user_id: target_user_id })
      .update({
        follower_count: dbCmd.inc(-1)
      })
    
    return {
      code: 0,
      message: '取消关注成功'
    }
  } catch (error) {
    return {
      code: 500,
      message: '取消关注失败',
      error: error.message
    }
  }
}

// 获取粉丝列表
async function getFollowers(data, uid) {
  const { user_id, page = 1, pageSize = 20 } = data
  
  const targetUserId = user_id || uid
  
  try {
    const followRes = await userFollowsCollection
      .where({ following_id: targetUserId })
      .orderBy('create_date', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    if (followRes.data.length === 0) {
      return {
        code: 0,
        message: '暂无粉丝',
        data: {
          list: [],
          hasMore: false
        }
      }
    }
    
    // 获取粉丝用户信息
    const followerIds = followRes.data.map(item => item.follower_id)
    const [profileRes, userRes] = await Promise.all([
      userProfileCollection
        .where({ user_id: dbCmd.in(followerIds) })
        .field({
          user_id: true,
          nickname: true,
          avatar: true,
          signature: true
        })
        .get(),
      uniIDUsersCollection
        .where({ _id: dbCmd.in(followerIds) })
        .field({
          _id: true,
          username: true
        })
        .get()
    ])
    
    // 构建用户信息映射
    const profileMap = {}
    profileRes.data.forEach(profile => {
      profileMap[profile.user_id] = profile
    })
    
    const userMap = {}
    userRes.data.forEach(user => {
      userMap[user._id] = user
    })
    
    // 检查当前用户是否关注了这些粉丝
    const followCheckRes = await userFollowsCollection
      .where({
        follower_id: uid,
        following_id: dbCmd.in(followerIds)
      })
      .get()
    
    const followingIds = followCheckRes.data.map(item => item.following_id)
    
    // 组合数据
    const list = followRes.data.map(follow => {
      const profile = profileMap[follow.follower_id] || {}
      const user = userMap[follow.follower_id] || {}
      
      return {
        ...follow,
        user_info: {
          ...profile,
          username: user.username || ''
        },
        is_following: followingIds.includes(follow.follower_id),
        time_ago: formatTimeAgo(follow.create_date)
      }
    })
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        list,
        hasMore: list.length === pageSize
      }
    }
  } catch (error) {
    return {
      code: 500,
      message: '获取粉丝列表失败',
      error: error.message
    }
  }
}

// 获取关注列表
async function getFollowing(data, uid) {
  const { user_id, page = 1, pageSize = 20 } = data
  
  const targetUserId = user_id || uid
  
  try {
    const followRes = await userFollowsCollection
      .where({ follower_id: targetUserId })
      .orderBy('create_date', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    if (followRes.data.length === 0) {
      return {
        code: 0,
        message: '暂无关注',
        data: {
          list: [],
          hasMore: false
        }
      }
    }
    
    // 获取关注用户信息
    const followingIds = followRes.data.map(item => item.following_id)
    const [profileRes, userRes] = await Promise.all([
      userProfileCollection
        .where({ user_id: dbCmd.in(followingIds) })
        .field({
          user_id: true,
          nickname: true,
          avatar: true,
          signature: true
        })
        .get(),
      uniIDUsersCollection
        .where({ _id: dbCmd.in(followingIds) })
        .field({
          _id: true,
          username: true
        })
        .get()
    ])
    
    // 构建用户信息映射
    const profileMap = {}
    profileRes.data.forEach(profile => {
      profileMap[profile.user_id] = profile
    })
    
    const userMap = {}
    userRes.data.forEach(user => {
      userMap[user._id] = user
    })
    
    // 组合数据
    const list = followRes.data.map(follow => {
      const profile = profileMap[follow.following_id] || {}
      const user = userMap[follow.following_id] || {}
      
      return {
        ...follow,
        user_info: {
          ...profile,
          username: user.username || ''
        },
        time_ago: formatTimeAgo(follow.create_date)
      }
    })
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        list,
        hasMore: list.length === pageSize
      }
    }
  } catch (error) {
    return {
      code: 500,
      message: '获取关注列表失败',
      error: error.message
    }
  }
}

// 时间格式化函数
function formatTimeAgo(timestamp) {
  if (!timestamp) return ''
  
  const now = Date.now()
  const diff = now - timestamp
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const month = 30 * day
  const year = 365 * day
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前'
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前'
  } else if (diff < month) {
    return Math.floor(diff / day) + '天前'
  } else if (diff < year) {
    return Math.floor(diff / month) + '个月前'
  } else {
    return Math.floor(diff / year) + '年前'
  }
}