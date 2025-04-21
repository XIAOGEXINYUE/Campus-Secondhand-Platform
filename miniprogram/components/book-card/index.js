// components/book-card/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    bookInfo: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isLiked: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 点击书籍卡片
    onTapCard: function() {
      const bookId = this.properties.bookInfo._id;
      wx.navigateTo({
        url: `/pages/book-detail/index?id=${bookId}`
      });
    },
    
    // 切换收藏状态
    toggleLike: function(e) {
      // 阻止事件冒泡，避免触发卡片点击事件
      e.stopPropagation();
      
      const bookId = this.properties.bookInfo._id;
      const isLiked = !this.data.isLiked;
      
      this.setData({
        isLiked: isLiked
      });
      
      // 触发自定义事件，通知父组件收藏状态变化
      this.triggerEvent('toggleLike', {
        bookId: bookId,
        isLiked: isLiked
      });
      
      wx.showToast({
        title: isLiked ? '已收藏' : '已取消收藏',
        icon: 'success',
        duration: 1500
      });
    }
  }
})
