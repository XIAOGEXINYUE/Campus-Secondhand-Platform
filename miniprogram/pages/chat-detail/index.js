// pages/chat-detail/index.js
Page({
  data: {
    chatInfo: null,
    productContext: null,
    messages: [],
    inputValue: '',
    currentTime: '',
    chatContainerPaddingBottom: 100, // 底部输入区域的高度 (需要动态计算)
    userInfo: {
      avatarUrl: '../../images/default-avatar.png',
      nickName: '我'
    },
    statusBarHeight: 0, // 状态栏高度
    navBarHeight: 0,    // 导航栏总高度
    scrollToView: '',   // 用于 scroll-view 滚动
    messageIdCounter: 0 // 用于生成唯一消息 ID
  },
  
  onLoad: function (options) {
    // [新增日志] 打印传入的 options
    console.log('[Chat Detail] onLoad options:', JSON.stringify(options)); 

    // 1. 获取设备信息计算导航栏高度
    this.calculateNavBarHeight();
    
    // 2. 设置默认用户信息，这里直接使用默认值，无需从storage获取
    // 在实际项目中，如果有用户登录功能，可以从wx.getStorageSync('userInfo')获取
    
    // 3. 获取聊天和商品信息(保持现有代码)
    const sellerId = options.sellerId || options.id; // 兼容直接传入 sellerId 或旧的 id
    console.log('[Chat Detail] sellerId:', sellerId);
    const productId = options.productId;
    const productName = options.productName;
    const productPrice = options.productPrice;
    const productImageUrl = options.productImageUrl;
    
    console.log('聊天页面接收参数:', options);
    this.getChatInfo(sellerId);
    
    // 4. 处理商品上下文 
    if (productId && productName && productPrice && productImageUrl) {
      // [新增日志] 确认参数存在
      console.log('[Chat Detail] Product context parameters found.');
      try {
          const decodedName = decodeURIComponent(productName);
          const decodedImageUrl = decodeURIComponent(productImageUrl);
          const productCtx = {
            id: productId,
            name: decodedName,
            price: productPrice,
            image: decodedImageUrl
          };
          this.setData({ productContext: productCtx }, () => { 
            // [新增日志] 确认 productContext 已设置
            console.log('[Chat Detail] Product context set in data:', JSON.stringify(this.data.productContext));
            this.updateChatContainerPadding(); 
          });
      } catch (e) {
          console.error('[Chat Detail] Error decoding product context URI components:', e);
          this.setData({ productContext: null }, () => { this.updateChatContainerPadding(); });
      }
    } else {
      // [新增日志] 确认参数不存在
      console.log('[Chat Detail] No product context parameters found.');
      this.setData({ productContext: null }, () => {
        this.updateChatContainerPadding();
      });
    }
    
    // 5. 加载历史消息或空状态
    const chatId = options.id || options.sellerId; // 使用 sellerId 作为聊天标识符
    let historyMessages = [];
    if (chatId) {
      historyMessages = this.getMessages(chatId);
    } else {
        historyMessages = this.getEmptyMessages();
    }
    this.setData({ messages: historyMessages });
    
    // 6. 设置当前时间 (不变)
    this.setCurrentTime();
    
    // 7. 页面加载后计算底部 padding 并滚动到底部
    wx.nextTick(() => {
      this.updateChatContainerPadding();
      this.scrollToBottom(true); // 首次加载无动画
    });
  },
  
  calculateNavBarHeight: function() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const windowWidth = systemInfo.windowWidth || 750; // 获取屏幕宽度，默认为750
    
    // 导航栏内容固定高度改为 110rpx
    const navBarContentHeightRpx = 110;
    // [修复] 正确的 rpx 转 px 计算
    const navBarContentHeightPx = (navBarContentHeightRpx * windowWidth) / 750;
    
    const totalNavBarHeight = statusBarHeight + navBarContentHeightPx;
    
    console.log(`状态栏高度: ${statusBarHeight}px, 屏幕宽度: ${windowWidth}px, 导航内容区高度(rpx): ${navBarContentHeightRpx}, 导航内容区高度(px): ${navBarContentHeightPx.toFixed(2)}px`);
    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: totalNavBarHeight
    });
  },
  
  setCurrentTime: function() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.setData({
      currentTime: `${hours}:${minutes}`
    });
  },
  
  getChatInfo: function(id) {
    // 模拟获取聊天信息
    const chatInfos = {
      '1': {
        id: '1',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
        name: '张同学'
      },
      '2': {
        id: '2',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
        name: '李同学'
      },
      '3': {
        id: '3',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
        name: '王同学'
      },
      '4': {
        id: '4',
        avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
        name: '赵同学'
      }
    };
    
    this.setData({
      chatInfo: chatInfos[id] || {}
    });
  },
  
  getMessages: function(id) {
    // 模拟获取消息记录
    const messagesList = {
      '1': [
        { id: 'hist_1_1', content: '您好，请问这本高等数学还在出售吗？', isSelf: false, time: '10:25', showTime: true },
        { id: 'hist_1_2', content: '在的，还没有卖出去', isSelf: true, time: '10:26', showTime: false },
        { id: 'hist_1_3', content: '请问是第七版同济大学的吗？', isSelf: false, time: '10:27', showTime: true },
        { id: 'hist_1_4', content: '是的，就是同济大学的第七版，书的品相很好，几乎全新', isSelf: true, time: '10:28', showTime: false }
      ],
      '2': [
        { id: 'hist_2_1', content: '你好，我想购买你发布的线性代数教材', isSelf: false, time: '昨天 15:30', showTime: true },
        { id: 'hist_2_2', content: '好的，请问你什么时候方便取书？', isSelf: true, time: '昨天 15:35', showTime: false },
        { id: 'hist_2_3', content: '明天下午三点可以吗？', isSelf: false, time: '昨天 15:40', showTime: true },
        { id: 'hist_2_4', content: '可以，明天下午三点图书馆门口见', isSelf: true, time: '昨天 15:42', showTime: false },
        { id: 'hist_2_5', content: '好的，明天下午三点图书馆门口见', isSelf: false, time: '昨天 15:45', showTime: true }
      ],
      '3': [
        { id: 'hist_3_1', content: '你好，我看到你发布的概率论与数理统计', isSelf: false, time: '周一 09:15', showTime: true },
        { id: 'hist_3_2', content: '请问这本书可以便宜一点吗？', isSelf: false, time: '周一 09:16', showTime: false },
        { id: 'hist_3_3', content: '你好，这本书已经是最低价了，因为品相很好', isSelf: true, time: '周一 09:20', showTime: true },
        { id: 'hist_3_4', content: '好吧，那我再考虑一下', isSelf: false, time: '周一 09:25', showTime: true }
      ],
      '4': [
        { id: 'hist_4_1', content: '你好，我已经收到书了', isSelf: false, time: '上周 14:20', showTime: true },
        { id: 'hist_4_2', content: '书的品相很好，谢谢！', isSelf: false, time: '上周 14:21', showTime: false },
        { id: 'hist_4_3', content: '不客气，祝你学习愉快', isSelf: true, time: '上周 14:25', showTime: true },
        { id: 'hist_4_4', content: '收到书了，谢谢！', isSelf: false, time: '上周 14:30', showTime: true }
      ]
    };
    
    const messages = messagesList[id] || [];
    this.setData({ messageIdCounter: messages.length }); // 初始化 ID 计数器
    return messages;
  },
  
  scrollToBottom: function(instant = false) {
    // 使用 wx.nextTick 确保 DOM 更新完毕
    wx.nextTick(() => {
        this.setData({ 
          scrollToView: 'scroll-bottom-anchor' // 滚动到末尾的锚点
        });
        console.log('Scrolling to bottom anchor');
    });
  },
  
  inputChange: function(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },
  
  sendMessage: function() {
    if (!this.data.inputValue.trim()) return;
    
    const newId = `msg_${this.data.messageIdCounter + 1}`;
    const newMessage = {
      id: newId,
      type: 'text',
      content: this.data.inputValue,
      isSelf: true,
      time: this.formatTime(new Date()),
      showTime: this.shouldShowTime(new Date()) // 判断是否需要显示时间
    };
    
    const newMessages = [...this.data.messages, newMessage];
    
    this.setData({
      messages: newMessages,
      inputValue: '',
      messageIdCounter: this.data.messageIdCounter + 1,
      // scrollToView: newId // 滚动到新消息
    }, () => {
        // setData 完成后滚动到底部
        this.scrollToBottom();
    });
  },
  
  formatTime: function(date) {
    const hour = date.getHours();
    const minute = date.getMinutes();
    return [hour, minute].map(n => n.toString().padStart(2, '0')).join(':');
  },
  
  navigateBack: function() {
    console.log('返回按钮被点击');
    wx.navigateBack({
      delta: 1,
      fail: function() {
        // 如果返回失败（没有上一级页面），则跳转到消息列表页
        console.log('返回失败，跳转到消息列表页');
        wx.switchTab({
          url: '/pages/message/index'
        });
      }
    });
  },
  
  viewBookDetail: function(e) {
    const productId = e.currentTarget.dataset.productid;
    if (productId) {
      console.log('查看商品详情，ID:', productId);
      wx.navigateTo({
        url: `/pages/book-detail/index?id=${productId}`
      });
    } else {
      wx.showToast({
        title: '无法获取商品信息',
        icon: 'none'
      });
    }
  },
  
  showMoreOptions: function() {
    wx.showActionSheet({
      itemList: ['举报', '删除聊天'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showToast({
            title: '举报功能开发中',
            icon: 'none'
          });
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: '提示',
            content: '确定要删除此聊天吗？',
            success: (res) => {
              if (res.confirm) {
                wx.navigateBack();
              }
            }
          });
        }
      }
    });
  },
  
  getEmptyMessages: function() {
    return [];
  },
  
  sendProductLink: function() {
    if (!this.data.productContext) return;
    
    const newId = `prod_${this.data.messageIdCounter + 1}`;
    const productMessage = {
      id: newId,
      type: 'product',
      content: { ...this.data.productContext }, // 复制一份，避免引用问题
      isSelf: true,
      time: this.formatTime(new Date()),
      showTime: this.shouldShowTime(new Date())
    };
    
    const newMessages = [...this.data.messages, productMessage];
    
    this.setData({
      messages: newMessages,
      productContext: null, // 发送后清除上下文
      messageIdCounter: this.data.messageIdCounter + 1,
      // scrollToView: newId
    }, () => {
      this.updateChatContainerPadding(); // 更新底部 padding
      this.scrollToBottom();
    });
  },
  
  closeProductContext: function() {
    this.setData({ productContext: null }, () => {
      this.updateChatContainerPadding();
    });
  },
  
  // 更新聊天容器底部内边距的函数
  updateChatContainerPadding: function() {
    const that = this;
    wx.createSelectorQuery().in(this).select('#bottom-area').boundingClientRect(res => {
      let padding = 100; // 默认值
      if (res && res.height) {
        padding = res.height + 10; // 获取底部区域高度并增加一点间距
      } else {
        console.warn("获取 #bottom-area 高度失败，使用默认值");
      }
      console.log('计算得到 padding-bottom:', padding);
      that.setData({ chatContainerPaddingBottom: padding });
    }).exec();
  },
  
  shouldShowTime: function(newTime) {
    const messages = this.data.messages;
    if (messages.length === 0) return true; // 第一条消息总显示时间
    
    const lastMessage = messages[messages.length - 1];
    // 假设 lastMessage.rawTime 存储了 Date 对象或其他可比较的时间戳
    // 这里简化处理，总是显示新消息的时间，实际项目应实现时间比较逻辑
    // if (lastMessage.rawTime && (newTime.getTime() - lastMessage.rawTime.getTime() > 5 * 60 * 1000)) {
    //   return true;
    // }
    // return false;
    return true; // 暂时总是显示时间
  }
})
