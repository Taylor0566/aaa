// 引入uni-id-common模块
const uniID = require('uni-id-common');

// 封装用户登录
async function login(username, password) {
  const res = await uniID.login({ username, password });
  return res;
}

// 封装用户注册
async function register(username, password, email) {
  const res = await uniID.register({ username, password, email });
  return res;
}

// 封装检查用户token是否有效
async function checkToken(token) {
  const res = await uniID.checkToken(token);
  return res;
}

// 导出封装的函数
module.exports = {
  login,
  register,
  checkToken
};
