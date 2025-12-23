'use strict';
const STS = require('@alicloud/sts-sdk');

exports.main = async (event, context) => {
  // 1. 从环境变量获取配置（不暴露在代码中）
  const config = {
    // 这里的 OSS_AK 等名称要和你稍后在 web 控制台填写的变量名一致
    accessKeyId: process.env.OSS_AK, 
    accessKeySecret: process.env.OSS_SK,
    roleArn: process.env.OSS_ARN, 
    roleSessionName: 'oss-upload-session'
  };

  const sts = new STS({
    endpoint: 'sts.aliyuncs.com',
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret
  });

  try {
    // 2. 向阿里云 STS 服务请求临时凭证
    const res = await sts.assumeRole(config.roleArn, config.roleSessionName, null, 3600);
    
    // 3. 返回凭证及 Bucket 信息给小程序
    return {
      code: 0,
      credentials: res.Credentials,
      bucket: '你的Bucket名称', // 这里也可以改为 process.env.OSS_BUCKET
      region: 'cn-hangzhou',
      host: `https://你的Bucket名称.oss-cn-hangzhou.aliyuncs.com` 
    };
  } catch (err) {
    return { code: 500, msg: err.message };
  }
};