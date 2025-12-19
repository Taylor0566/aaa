const uniID = require('uni-id-common');

exports.main = async (event, context) => {
  const { username, newPassword } = event;

  // 重置密码
  const res = await uniID.updatePassword({
    username,
    newPassword
  });

  if (res.code === 0) {
    return { code: 0, msg: 'Password reset successful', data: res };
  } else {
    return { code: 1, msg: 'Password reset failed', data: res };
  }
};
