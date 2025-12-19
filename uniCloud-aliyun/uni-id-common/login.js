const uniID = require('uni-id-common');

exports.main = async (event, context) => {
  const { username, password } = event;

  // 登录，返回 token
  const res = await uniID.login({
    username,
    password
  });

  if (res.code === 0) {
    return { code: 0, msg: 'Login successful', data: res };
  } else {
    return { code: 1, msg: 'Login failed', data: res };
  }
};
