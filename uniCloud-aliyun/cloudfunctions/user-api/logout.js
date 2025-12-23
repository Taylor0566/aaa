// logout.js
'use strict';
exports.main = async (event, context) => {
  // 清除 token 通常由前端完成，后端可记录日志或作废 token（简易版直接返回成功）
  return {
    code: 0,
    message: '退出成功',
    data: null
  };
};