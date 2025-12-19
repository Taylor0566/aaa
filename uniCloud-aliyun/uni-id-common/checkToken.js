const uniID = require('uni-id-common');

exports.main = async (event, context) => {
  const { token } = event;

  // 验证 token
  const res = await uniID.checkToken(token);

  if (res.code === 0) {
    return { code: 0, msg: 'Token is valid', data: res };
  } else {
    return { code: 1, msg: 'Token is invalid', data: res };
  }
};
