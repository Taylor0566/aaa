'use strict';

const db = uniCloud.database();

// ==============================
// 自定义 Token 校验
// ==============================
async function checkCustomToken(token) {
  if (!token) return { code: 401, uid: null };
  const now = Date.now();
  const res = await db.collection('users')
    .where({ login_token: token, token_expire: { $gt: now } })
    .get();
  return res.data?.length ? { code: 0, uid: res.data[0]._id } : { code: 401, uid: null };
}
const updatePassword = require('./update-password');
const logout = require('./logout');

// ==============================
// 登录逻辑（内联）
// ==============================
async function handleLogin(event) {
  const { username, password } = event;
  if (!username || !password) {
    return { code: 400, message: '用户名和密码不能为空', data: null };
  }

  const userRes = await db.collection('users')
    .where({ username, password })
    .get();

  if (!userRes.data?.length) {
    return { code: 401, message: '用户名或密码错误', data: null };
  }

  const user = userRes.data[0];
  const token = `${user._id}:${Date.now()}:${Math.random().toString(36).substring(2, 10)}`;
  const expireTime = Date.now() + 7 * 24 * 3600 * 1000;
  await db.collection('users').doc(user._id).update({
    login_token: token,
    token_expire: expireTime
  });

  const { password: _, login_token, token_expire, ...safeUserInfo } = user;

  return {
    code: 0,
    message: '登录成功',
    data: {
      token,
      userInfo: safeUserInfo
    }
  };
}

// ==============================
// 注册逻辑（可选，按需实现）
// ==============================
async function handleRegister(event) {
  const { username, password } = event;
  if (!username || !password) {
    return { code: 400, message: '用户名和密码不能为空', data: null };
  }

  const exists = await db.collection('users')
    .where({ username })
    .get();
  if (exists.data?.length) {
    return { code: 409, message: '用户名已存在', data: null };
  }

  const res = await db.collection('users').add({
    username,
    password,
    nickname: username,
    gender: 0,
    register_date: Date.now()
  });

  return { code: 0, message: '注册成功', data: { _id: res.id } };
}

// ==============================
// 主入口
// ==============================
exports.main = async (event, context) => {
  const { action, uniIdToken } = event;

  try {
    // 公开接口：直接调用内联函数
    if (action === 'login') {
      return await handleLogin(event);
    }
    else if (action === 'register') {
      return await handleRegister(event);
    }
    else if (action === 'logout') {              // ← 添加这行
      return await logout.main(event, context);
    }
    // 私有接口：校验 token
    const tokenCheck = await checkCustomToken(uniIdToken);
    if (tokenCheck.code !== 0) {
      return { code: 401, message: '请先登录', data: null };
    }
    const uid = tokenCheck.uid;

       if (action === 'get_profile' || action === 'get-profile') {
         return await handleGetProfile(uid);
       } else if (action === 'update_profile' || action === 'update-profile') {
         return await handleUpdateProfile(event, uid);
       } else if (action === 'update_password' || action === 'update-password') {
         return await updatePassword.main(event, context);
       } else {
         return { code: 400, message: '无效的操作类型', data: null };
       }

  } catch (error) {
    console.error(`[User API Error] ${action}:`, error);
    return { code: 500, message: '服务器内部错误', data: null };
  }
};

// ==============================
// 私有接口实现
// ==============================

async function handleGetProfile(uid) {
  const res = await db.collection('users').doc(uid).get();
  if (!res.data?.length) {
    return { code: 404, message: '用户不存在', data: null };
  }
  const user = res.data[0];
  const { password, login_token, token_expire, ...safeUser } = user;
  return { code: 200, message: '获取成功', data: safeUser };
}

async function handleUpdateProfile(event, uid) {
  const { nickname, gender, avatar, mobile, email } = event;
  const updateData = { updated_at: new Date() };

  if (nickname !== undefined) updateData.nickname = nickname;
  if (gender !== undefined) updateData.gender = gender;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (mobile !== undefined) updateData.mobile = mobile;
  if (email !== undefined) updateData.email = email;

  await db.collection('users').doc(uid).update(updateData);
  return { code: 200, message: '更新成功', data: null };
}

async function handleSubmit() {
  const oldPwd = oldPassword.value.trim()
  const newPwd = newPassword.value.trim()
  const confirmPwd = confirmPassword.value.trim()

  if (!oldPwd) {
    uni.showToast({ title: '请输入原密码', icon: 'none' })
    return
  }
  if (!newPwd || newPwd.length < 6) {
    uni.showToast({ title: '新密码至少6位', icon: 'none' })
    return
  }
  if (newPwd !== confirmPwd) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '修改中...' })

    // ✅ 调用 user-api，并传入 action: 'update-password'
    const res = await uniCloud.callFunction({
      name: 'user-api', // ← 云函数名是 user-api
      data: {
        action: 'update-password', // ← 指定具体操作
        old_password: oldPwd,
        new_password: newPwd,
        confirm_password: confirmPwd
      }
    })

    uni.hideLoading()
    const { code, message } = res.result

    if (code === 0) {
      uni.showToast({ title: '密码修改成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      let msg = message || '修改失败'
      if (code === 1002) msg = '原密码错误'
      else if (code === 401) msg = '请先登录'
      uni.showToast({ title: msg, icon: 'none' })
    }
  } catch (err) {
    uni.hideLoading()
    console.error('[修改密码错误]', err)
    uni.showToast({ title: '网络异常，请重试', icon: 'none' })
  }
}