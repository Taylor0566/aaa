async fetchUserInfo() {
  this.loading = true;
  console.log('开始获取用户信息...');
  
  try {
    // 从本地存储获取token和用户信息
    const token = uni.getStorageSync('uni_id_token');
    const userInfo = uni.getStorageSync('user_info');
    
    console.log('本地token:', token);
    console.log('本地用户信息:', userInfo);
    
    if (!token || !userInfo || !userInfo.uid) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => {
        uni.redirectTo({
          url: '/pages/user/login/login'
        });
      }, 1000);
      return;
    }
    
    // 方法1：直接调用profile云函数，传递token和用户ID
    console.log('调用profile云函数...');
    const res = await uniCloud.callFunction({
      name: 'profile',
      data: {
        token: token,
        user_id: userInfo.uid  // 明确传递用户ID
      }
    });

    console.log('profile云函数返回:', JSON.stringify(res, null, 2));

    const { code, message, data } = res.result || {};

    if (code === 200 && data) {
      console.log('获取用户信息成功:', data);
      // 更新用户信息和统计
      this.userInfo = data.profile || {};
      this.userStats = data.stats || {};
      
      // 如果头像为空，使用默认头像
      if (!this.userInfo.avatar) {
        this.userInfo.avatar = this.defaultAvatar;
      }
    } else {
      throw new Error(message || '获取用户信息失败');
    }
  } catch (err) {
    console.error('获取用户信息异常:', err);
    uni.showToast({
      title: '获取信息失败，请重试',
      icon: 'none',
      duration: 2000
    });
  } finally {
    this.loading = false;
    uni.stopPullDownRefresh();
  }
},