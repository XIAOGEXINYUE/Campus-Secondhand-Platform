// pages/settings/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    version: 'v1.0.0'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 页面加载时的逻辑
  },

  /**
   * 返回上一页
   */
  navigateBack() {
    wx.navigateBack();
  },

  /**
   * 导航到个人资料页面
   */
  navigateToUserInfo() {
    wx.navigateTo({
      url: '/pages/user-info/index',
    });
  },

  /**
   * 导航到消息通知页面
   */
  navigateToNotifications() {
    wx.navigateTo({
      url: '/pages/notifications/index',
    });
  },

  /**
   * 导航到账号安全页面
   */
  navigateToSecurity() {
    wx.navigateTo({
      url: '/pages/security/index',
    });
  },

  /**
   * 导航到支付管理页面
   */
  navigateToPayment() {
    wx.navigateTo({
      url: '/pages/payment/index',
    });
  },

  /**
   * 导航到帮助中心页面
   */
  navigateToHelp() {
    wx.navigateTo({
      url: '/pages/help/index',
    });
  },

  /**
   * 导航到关于我们页面
   */
  navigateToAbout() {
    wx.navigateTo({
      url: '/pages/about/index',
    });
  },

  /**
   * 导航到意见反馈页面
   */
  navigateToFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/index',
    });
  },

  /**
   * 退出登录
   */
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          wx.removeStorageSync('userInfo');
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            complete: () => {
              // 返回到用户中心页面
              wx.navigateBack();
            }
          });
        }
      }
    });
  }
});
