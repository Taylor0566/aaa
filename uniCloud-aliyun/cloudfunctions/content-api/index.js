'use strict';

async function checkCustomToken(token) {
  if (!token) return { code: 401, uid: null };
  
  const db = uniCloud.database();
  const now = Date.now();
  const res = await db.collection('users')
    .where({ login_token: token, token_expire: { $gt: now } })
    .get();
    
  return res.data?.length ? { code: 0, uid: res.data[0]._id } : { code: 401, uid: null };
}

// 获取用户信息函数
async function getUserInfo(data, context) {
  // 🟢 修改：支持多种参数名
  const { 
    user_ids,      // 原来的参数名
    _id,           // 🟢 新增：支持 _id
    user_id,       // 🟢 新增：支持 user_id
    userIds,       // 🟢 新增：支持 userIds
    get_current, 
    search, 
    page = 1, 
    page_size = 20 
  } = data;
  
  const db = uniCloud.database();
  const usersCollection = db.collection('users');
  const dbCmd = db.command;
  
  try {
    // 1. 获取当前登录用户信息
    if (get_current === true) {
      // ... 保持不变 ...
    }
    
    // 🟢 修改：处理多种ID参数
    let targetIds = null;
    
    // 优先级：_id > user_id > user_ids > userIds
    if (_id) {
      targetIds = _id;
    } else if (user_id) {
      targetIds = user_id;
    } else if (user_ids) {
      targetIds = user_ids;
    } else if (userIds) {
      targetIds = userIds;
    }
    
    // 2. 根据ID获取用户信息
    if (targetIds) {
      const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
      
      const result = await usersCollection
        .where({ _id: dbCmd.in(ids) })
        .field({ 
          _id: true,        // 🟢 确保包含_id
          nickname: true, 
          avatar: true, 
          gender: true, 
          username: true 
        })
        .get();
      
      return {
        code: 200,
        message: '获取成功',
        data: result.data.map(user => ({
          _id: user._id,
          username: user.username,
          nickname: user.nickname || user.username,
          avatar: user.avatar || '',
          gender: user.gender || 0
        }))
      };
    }
    
    return { code: 400, message: '参数错误', data: null };
    
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return {
      code: 500,
      message: '获取用户信息失败', 
      data: null
    };
  }
}

exports.main = async (event, context) => {
  const { action, uniIdToken, ...data } = event;  // 🟢 添加 uniIdToken
  
  try {
    console.log(`[Content API] Action: ${action}, User: ${context.UID || 'anonymous'}`);
    console.log('请求数据:', JSON.stringify({ uniIdToken, ...data }, null, 2));
    
    // ==================== 公开接口：不需要登录 ====================
    if (action === 'get' || action === 'get-content' || action === 'content-get') {
      console.log('>>> 处理获取内容（公开接口）');
      const getContent = require('./get-content.js');
      return await getContent.main(data, context);
    }
    
    // ==================== 获取用户信息接口（公开） ====================
    if (action === 'get_user_info' || action === 'user_info' || action === 'get-user-info') {
      console.log('>>> 处理获取用户信息');
      return await getUserInfo(data, context);
    }
    
    // ==================== 私有接口：需要登录验证 ====================
    console.log('>>> 验证用户登录状态');
    
    let uid = context.UID;
    
    // 如果没有 context.UID，尝试通过 token 验证
    if (!uid && uniIdToken) {  // 🟢 现在 uniIdToken 已定义
      console.log('>>> 通过token验证，token:', uniIdToken);
      const tokenCheck = await checkCustomToken(uniIdToken);
      if (tokenCheck.code !== 0) {
        return { code: 401, message: '请先登录', data: null };
      }
      uid = tokenCheck.uid;
      console.log('>>> 通过token验证成功，UID:', uid);
    }
    
    // 如果还是没有用户ID，返回未登录错误
    if (!uid) {
      return { code: 401, message: '请先登录', data: null };
    }
    
    // 创建增强的context，包含用户ID
    const enhancedContext = {
      ...context,
      UID: uid
    };
    
    console.log('>>> 用户验证成功，准备处理操作:', action);
    
    // ==================== 路由分发 ====================
    switch (action) {
      case 'create':
      case 'create-content':
      case 'content-create':
        console.log('>>> 调用创建内容');
        const createContent = require('./create-content.js');
        return await createContent.main(data, enhancedContext);
      
      case 'update':
      case 'update-content':
      case 'content-update':
        console.log('>>> 调用更新内容');
        const updateContent = require('./update-content.js');
        return await updateContent.main(data, enhancedContext);
      
      case 'delete':
      case 'delete-content':
      case 'content-delete':
        console.log('>>> 调用删除内容');
        const deleteContent = require('./delete-content.js');
        return await deleteContent.main(data, enhancedContext);
      case 'user_info':
        console.log('>>> 获取用户信息');
        return await getUserInfo(data, context);
      default:
        console.log('>>> 无效的操作类型:', action);
        return {
          code: 400,
          message: '无效的操作类型',
          data: null
        };
    }
  } catch (error) {
    console.error(`[Content API Error] ${action}:`, error);
    return {
      code: 500,
      message: '服务器内部错误',
      data: null
    };
  }
};