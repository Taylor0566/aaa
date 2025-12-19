const uniID = require('uni-id-common');

exports.main = async (event, context) => {
  const { username, password, email } = event;

  // 注册用户
  const res = await uniID.register({
    username,
    password,
    email
  });

  if (res.code === 0) {
    return { code: 0, msg: 'Registration successful', data: res };
  } else {
    return { code: 1, msg: 'Registration failed', data: res };
  }
};
