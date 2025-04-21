// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      // 确保云环境ID正确
      const cloudEnv = 'YOUR_ENV_ID';
      console.log('初始化云环境:', cloudEnv);
      
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: cloudEnv,
        traceUser: true,
      });
      
      // 测试云环境连接
      wx.cloud.callFunction({
        name: 'getBooks',
        data: { limit: 1 },
        success: res => {
          console.log('云环境连接测试成功:', res);
        },
        fail: err => {
          console.error('云环境连接测试失败:', err);
        }
      });
    }

    this.globalData = {
      // 全局共享数据
      userInfo: null,
      cloudEnv: 'YOUR_ENV_ID',
      isLoggedIn: false,
      version: '1.0.0'
    };
  },
  
  // 检查用户登录状态
  checkLoginStatus: function() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            wx.getUserInfo({
              success: res => {
                this.globalData.userInfo = res.userInfo;
                this.globalData.isLoggedIn = true;
                resolve(true);
              },
              fail: err => {
                console.error('获取用户信息失败', err);
                this.globalData.isLoggedIn = false;
                resolve(false);
              }
            });
          } else {
            this.globalData.isLoggedIn = false;
            resolve(false);
          }
        },
        fail: err => {
          console.error('检查登录状态失败', err);
          reject(err);
        }
      });
    });
  }
});
