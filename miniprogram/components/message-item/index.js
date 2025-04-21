// components/message-item/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    message: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 点击消息项
    onTapMessage: function() {
      const messageId = this.properties.message._id;
      const targetUserId = this.properties.message.targetUserId;
      
      wx.navigateTo({
        url: `/pages/chat-detail/index?id=${messageId}&targetUserId=${targetUserId}`
      });
    }
  }
})
