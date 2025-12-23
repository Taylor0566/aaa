'use strict';

exports.main = async (event, context) => {
  const {
    username,
    password
  } = event;
  
  // 参数验证
  if (!username) {
    return {
      code: 400,
      message: '用户名不能为空',
      data: null
    };
  }
  
  if (!password) {
    return {
      code: 400,
      message: '密码不能为空',
      data: null
    };
  }
  
  if (password.length < 6) {
    return {
      code: 400,
      message: '密码长度至少6位',
      data: null
    };
  }
  
  try {
    const db = uniCloud.database();
    const usersCollection = db.collection('users');
    
    // 检查用户名是否已存在
    const existingUser = await usersCollection.where({
      username: username
    }).get();
    
    if (existingUser.data.length > 0) {
      return {
        code: 1004,
        message: '用户名已存在',
        data: null
      };
    }
    
    // 创建用户数据
    const userData = {
      username: username.trim(),
      password, // 注意：实际项目中应该加密存储
      nickname: username.trim(),
      avatar: '',
      gender: 0,
      mobile: '',
      email: '',
      status: 0,
      role: ['user'],
      register_date: new Date(),
      register_ip: context.CLIENTIP || '',
      last_login_date: new Date(),
      last_login_ip: context.CLIENTIP || '',
      updated_at: new Date(),
      score: 0,
      my_invite_code: generateInviteCode()
    };
    
    // 添加用户
    const result = await usersCollection.add(userData);
    
    // 生成token（与登录逻辑一致）
    const token = generateToken(result.id);
    
    return {
      code: 0,
      message: '注册成功',
      data: {
        uid: result.id,
        token: token,
        username: username.trim(),
        nickname: username.trim(),
        avatar: '',
        gender: 0,
        role: ['user'],
        tokenExpired: Date.now() + 86400000
      }
    };
  } catch (error) {
    console.error('[Register Error]', error);
    return {
      code: 500,
      message: '注册失败，请稍后重试',
      data: null
    };
  }
};

// 生成邀请码（保留字段，虽然现在不使用）
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 生成token（与login.js保持一致）
function generateToken(uid) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return Buffer.from(`${uid}:${timestamp}:${random}`).toString('base64');
}