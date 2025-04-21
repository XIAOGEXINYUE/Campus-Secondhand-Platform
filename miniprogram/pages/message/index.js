// pages/message/index.js
Page({
  data: {
    messages: [
      {
        id: '1',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
        name: '张同学',
        lastMessage: '您好，请问这本高等数学还在出售吗？',
        time: '10:30',
        unread: 2
      },
      {
        id: '2',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
        name: '李同学',
        lastMessage: '好的，明天下午三点图书馆门口见',
        time: '昨天',
        unread: 0
      },
      {
        id: '3',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
        name: '王同学',
        lastMessage: '请问这本书可以便宜一点吗？',
        time: '周一',
        unread: 0
      },
      {
        id: '4',
        avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
        name: '赵同学',
        lastMessage: '收到书了，谢谢！',
        time: '上周',
        unread: 0
      }
    ]
  },
  
  onLoad: function (options) {
    // 页面加载时执行，可以在这里获取消息列表数据
  },
  
  onShow: function () {
    // 页面显示时执行，可以在这里刷新消息列表
  },
  
  navigateToChat: function(e) {
    const id = e.currentTarget.dataset.id;
    // 跳转到聊天详情页，实际项目中需要实现
    wx.showToast({
      title: '聊天功能开发中',
      icon: 'none'
    });
  },
  
  showMoreOptions: function() {
    wx.showActionSheet({
      itemList: ['标记全部已读', '删除全部会话'],
      success: function(res) {
        if (res.tapIndex === 0) {
          // 标记全部已读
          wx.showToast({
            title: '已标记全部已读',
            icon: 'success'
          });
        } else if (res.tapIndex === 1) {
          // 删除全部会话
          wx.showModal({
            title: '提示',
            content: '确定要删除全部会话吗？',
            success: function(res) {
              if (res.confirm) {
                wx.showToast({
                  title: '已删除全部会话',
                  icon: 'success'
                });
              }
            }
          });
        }
      }
    });
  }
})
