// cloudfunctions/user-api/login.js

exports.main = async (event) => {
  const { username, password } = event;

  if (!username || !password) {
    return {
      code: 400,
      message: '用户名和密码不能为空',
      data: null
    };
  }

  const db = uniCloud.database(); // ✅ 移到函数内部

  try {
    const userRes = await db.collection('users')
      .where({
        username: username,
        password: password
      })
      .get();

    if (!userRes.data || userRes.data.length === 0) {
      return {
        code: 401,
        message: '用户名或密码错误',
        data: null
      };
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
        token,          // 登录凭证
        userInfo: safeUserInfo  // 👈 显式命名，避免前端混淆
      }
    };

  } catch (err) {
    console.error('登录过程异常:', err);
    return {
      code: 500,
      message: '登录服务异常，请稍后重试',
      data: null
    };
  }
};