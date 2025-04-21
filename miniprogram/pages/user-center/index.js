// pages/user-center/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null, // Initialize userInfo to null
    isLoggedIn: false, // Add isLoggedIn flag, default to false
    myListings: [],
    statusBarHeight: 0,
    isAdmin: true, // 默认设为true方便测试，实际应该根据用户角色判断
    showMenuForBookId: null, // Track which book's menu is currently shown
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // Check login status from storage
    const storedUserInfo = wx.getStorageSync('userInfo');
    if (storedUserInfo) {
      console.log('User info found in storage:', storedUserInfo);
      this.setData({
        userInfo: storedUserInfo,
        isLoggedIn: true
      });
    } else {
      console.log('No user info in storage, user is not logged in.');
      this.setData({
        isLoggedIn: false
      });
    }
    
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    this.setData({
      statusBarHeight: statusBarHeight
    });
    
    // 注册事件监听器，用于从其他页面切换到"我的发布"
    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel && eventChannel.on) {
      eventChannel.on('switchToMyPosts', () => {
        console.log('收到切换到我的发布的通知');
        this.navigateToMyListings();
      });
    }
    
    // 加载我的发布列表
    this.loadMyListings();
  },
  
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次页面显示时检查并可能刷新用户数据 (可以考虑刷新)
    const storedUserInfo = wx.getStorageSync('userInfo');
    if (storedUserInfo && (!this.data.userInfo || storedUserInfo._id !== this.data.userInfo._id)) {
       // If storage has info and it differs from current data, update
       this.setData({ userInfo: storedUserInfo, isLoggedIn: true });
    } else if (!storedUserInfo && this.data.isLoggedIn) {
       // If storage has no info but page thinks user is logged in, update
       this.setData({ userInfo: null, isLoggedIn: false });
    }
    
    // 刷新我的发布列表
    this.loadMyListings();
  },
  
  /**
   * 加载我的发布列表
   */
  loadMyListings() {
    // 检查用户是否登录
    if (!this.data.isLoggedIn || !this.data.userInfo) {
      console.log('用户未登录，不加载我的发布');
      this.setData({
        myListings: []
      });
      return;
    }

    console.log('开始加载我的发布列表');
    wx.showLoading({
      title: '加载中...',
    });

    // 确保我们有正确的用户ID
    const userId = this.data.userInfo.openid || this.data.userInfo._openid || this.data.userInfo._id;
    console.log('用户ID:', userId);

    // 从云数据库获取当前用户发布的书籍
    wx.cloud.callFunction({
      name: 'getBooks',
      data: {
        userId: userId,
        myPosts: true // 表示获取我的发布
      }
    }).then(res => {
      console.log('获取我的发布成功:', res);
      wx.hideLoading();
      
      if (res.result && res.result.success && res.result.data) {
        const books = res.result.data;
        console.log('书籍数量:', books.length);
        
        if (books.length === 0) {
          this.setData({
            myListings: []
          });
          return;
        }
        
        // 对数据进行处理，添加日期格式化等
        const formattedBooks = books.map(book => {
          // 输出单本书的信息用于调试
          console.log('处理书籍:', book);
          
          // 确保书籍有封面图片
          const coverUrl = book.coverUrl || book.images?.[0] || '../../images/default-book.png';
          
          // 计算日期显示
          let dateStr = '刚刚';
          if (book.createdAt) {
            // 如果有时间戳，转换为易读格式
            const date = new Date(book.createdAt);
            const now = new Date();
            const diffDays = Math.floor((now - date) / (24 * 60 * 60 * 1000));
            
            if (diffDays === 0) {
              // 今天发布的
              const hours = date.getHours();
              const minutes = date.getMinutes();
              dateStr = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
            } else if (diffDays < 30) {
              // 一个月内
              dateStr = `${diffDays}天前`;
            } else {
              // 超过一个月
              dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
            }
          }
          
          return {
            ...book,
            coverUrl: coverUrl, // 确保有封面图片
            date: dateStr,
            status: book.status === 'sold' ? '已售出' : '出售中',
            id: book._id || book.id // 确保有id字段
          };
        });
        
        console.log('格式化后的书籍:', formattedBooks);
        
        // 限制显示的书籍数量为3本，以适应用户中心页面
        const limitedBooks = formattedBooks.slice(0, 3);
        
        this.setData({
          myListings: limitedBooks
        });
      } else {
        console.log('获取数据为空或格式不正确:', res);
        this.setData({
          myListings: []
        });
      }
    }).catch(err => {
      console.error('获取我的发布失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({
        myListings: []
      });
    });
  },
  
  /**
   * 导航到设置页面
   */
  navigateToSettings() {
    wx.navigateTo({
      url: '/pages/settings/index',
    });
  },
  
  /**
   * 导航到我的发布页面
   */
  navigateToMyListings() {
    wx.navigateTo({
      url: '/pages/goods-list/index?type=my',
    });
  },
  
  /**
   * 导航到我的订单页面
   */
  navigateToMyOrders() {
    wx.navigateTo({
      url: '/pages/orders/index',
    });
  },
  
  /**
   * 导航到我的收藏页面
   */
  navigateToMyFavorites() {
    wx.navigateTo({
      url: '/pages/favorites/index',
    });
  },
  
  /**
   * 导航到我的钱包页面
   */
  navigateToMyWallet() {
    wx.navigateTo({
      url: '/pages/wallet/index',
    });
  },
  
  /**
   * 导航到书籍详情页面
   */
  navigateToBookDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/book-detail/index?id=${id}`,
    });
  },
  
  /**
   * 导航到发布页面
   */
  navigateToPublish() {
    wx.navigateTo({
      url: '/pages/publish/index',
    });
  },
  
  /**
   * 导航到图片管理页面
   */
  navigateToImageManager() {
    wx.navigateTo({
      url: '/pages/image-manager/index'
    });
  },

  /**
   * 处理用户点击登录区域的事件
   */
  handleLogin: async function() {
    // 如果已经登录，可以考虑是刷新用户信息或导航到编辑资料页
    if (this.data.isLoggedIn) {
      console.log('User already logged in. Maybe navigate to profile edit?');
      // wx.navigateTo({ url: '/pages/profile-edit/index' }); // Example
      return; 
    }

    // 如果未登录，开始登录流程
    console.log('Login button clicked, starting login process...');
    wx.showLoading({ title: '登录中...' });

    try {
      // 1. 获取用户信息（头像、昵称）
      const profileRes = await wx.getUserProfile({ 
        desc: '用于完善会员资料' // 声明获取用户个人信息后的用途，后续会展示在弹窗中
      });
      // --- 添加日志 ---
      console.log('[Frontend Login] wx.getUserProfile success ON PHONE:', JSON.stringify(profileRes)); 
      const userProfile = profileRes.userInfo;
      console.log('[Frontend Login] UserProfile extracted ON PHONE:', JSON.stringify(userProfile)); 
      // --- 结束日志 ---

      // 2. 调用云函数进行登录或注册
      const dataToSend = {
        userInfo: {
          nickName: userProfile.nickName,
          avatarUrl: userProfile.avatarUrl
        }
      };
      // --- 添加日志 ---
      console.log('[Frontend Login] Data being sent to cloud function ON PHONE:', JSON.stringify(dataToSend));
      // --- 结束日志 ---

      const loginRes = await wx.cloud.callFunction({
        name: 'login',
        data: dataToSend
      });
      // --- 添加日志 ---
      console.log('[Frontend Login] Cloud function login result ON PHONE:', JSON.stringify(loginRes)); 
      // --- 结束日志 ---

      // 3. 处理云函数返回结果
      if (loginRes.result && loginRes.result.success) {
        const loggedInUserInfo = loginRes.result.data;
        // --- 添加日志 ---
        console.log('[Frontend Login] Parsed loggedInUserInfo from cloud func ON PHONE:', JSON.stringify(loggedInUserInfo));
        // --- 结束日志 ---
        
        // 更新页面数据
        this.setData({
          userInfo: loggedInUserInfo,
          isLoggedIn: true
        });

        // 将用户信息存入本地缓存
        wx.setStorageSync('userInfo', loggedInUserInfo);
        console.log('User info saved to storage.');
        wx.showToast({ title: '登录成功', icon: 'success' });

        // 可以选择性地在这里刷新需要登录才能获取的数据，比如收藏、订单等
        this.loadMyListings(); // 重新加载我的发布 (如果它需要登录的话)

      } else {
        // 云函数返回失败
        console.error('Cloud function login failed:', loginRes.result ? loginRes.result.error : 'Unknown error');
        wx.showToast({ title: loginRes.result?.error?.message || '登录失败，请重试', icon: 'none' });
      }

    } catch (error) {
      // 获取用户信息失败 (用户拒绝授权) 或调用云函数失败
      console.error('Login process error:', error);
      if (error.errMsg && error.errMsg.includes('getUserProfile:fail auth deny')) {
        wx.showToast({ title: '您拒绝了授权', icon: 'none' });
      } else {
        wx.showToast({ title: '登录失败，请稍后重试', icon: 'none' });
      }
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 点击"更多"按钮，显示操作菜单
   */
  showActionMenu(e) {
    const bookId = e.currentTarget.dataset.id;
    // Toggle menu: if clicking the same button, hide it; otherwise show the new one
    this.setData({
      showMenuForBookId: this.data.showMenuForBookId === bookId ? null : bookId
    });
    // Prevent event bubbling up to the card's navigateToBookDetail
    // Note: catchtap already prevents bubbling in WXML, but adding here for clarity/safety
  },

  /**
   * 标记为已售
   */
  markAsSold(e) {
    const bookId = e.currentTarget.dataset.id;
    console.log('Marking book as sold:', bookId);
    this.setData({ showMenuForBookId: null }); // Hide menu after action

    wx.showModal({
      title: '确认操作',
      content: '确定要将这本书标记为已售出吗？',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          // 调用新的云函数
          wx.cloud.callFunction({
            name: 'updateBookStatusNew', // 改为新的云函数名
            data: {
              bookId: bookId,
              status: '已售出'
            }
          }).then(cfRes => {
            wx.hideLoading();
            console.log('Cloud function result:', cfRes); // 添加更多日志
            if (cfRes.result && cfRes.result.success) {
              wx.showToast({ title: '已标记为售出', icon: 'success' });
              this.updateListingStatus(bookId, '已售出');
            } else {
              console.error('Mark as sold failed (cloud function):', cfRes);
              wx.showToast({ title: '操作失败，请重试', icon: 'none' });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error('Mark as sold failed (network/call):', err);
            wx.showToast({ title: '操作失败，请重试', icon: 'none' });
          });
        }
      }
    });
  },

  /**
   * 修改价格
   */
  editPrice(e) {
    const bookId = e.currentTarget.dataset.id;
    const currentPrice = e.currentTarget.dataset.price;
    console.log('Editing price for book:', bookId, 'Current price:', currentPrice);
    this.setData({ showMenuForBookId: null }); // Hide menu

    wx.showModal({
      title: '修改价格',
      content: `当前价格：¥${currentPrice}`,
      editable: true, // 显示输入框
      placeholderText: '请输入新的价格',
      success: (res) => {
        if (res.confirm && res.content) {
          const newPrice = parseFloat(res.content);
          if (isNaN(newPrice) || newPrice <= 0) {
            wx.showToast({ title: '请输入有效的价格', icon: 'none' });
            return;
          }

          wx.showLoading({ title: '正在保存...' });
          // --- 调用云函数更新价格 ---
          wx.cloud.callFunction({
            name: 'updateBookPrice', // 你需要创建一个名为 updateBookPrice 的云函数
            data: {
              bookId: bookId,
              price: newPrice
            }
          }).then(cfRes => {
            wx.hideLoading();
            if (cfRes.result && cfRes.result.success) {
              wx.showToast({ title: '价格已更新', icon: 'success' });
              // --- 刷新列表数据 ---
              this.updateListingPrice(bookId, newPrice);
            } else {
              console.error('Update price failed (cloud function):', cfRes);
              wx.showToast({ title: '更新失败，请重试', icon: 'none' });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error('Update price failed (network/call):', err);
            wx.showToast({ title: '更新失败，请重试', icon: 'none' });
          });
          // --- End Cloud Function Call ---
        }
      }
    });
  },

  /**
   * 重新上架
   */
  relistItem(e) {
    const bookId = e.currentTarget.dataset.id;
    console.log('Relisting book:', bookId);
    this.setData({ showMenuForBookId: null }); // Hide menu

    wx.showModal({
      title: '确认操作',
      content: '确定要重新上架这本书吗？',
      confirmColor: '#007AFF',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          // 调用新的云函数
          wx.cloud.callFunction({
            name: 'updateBookStatusNew', // 改为新的云函数名
            data: {
              bookId: bookId,
              status: '出售中'
            }
          }).then(cfRes => {
            wx.hideLoading();
            console.log('Cloud function result:', cfRes); // 添加更多日志
            if (cfRes.result && cfRes.result.success) {
              wx.showToast({ title: '已重新上架', icon: 'success' });
              this.updateListingStatus(bookId, '出售中');
            } else {
              console.error('Relist failed (cloud function):', cfRes);
              wx.showToast({ title: '操作失败，请重试', icon: 'none' });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error('Relist failed (network/call):', err);
            wx.showToast({ title: '操作失败，请重试', icon: 'none' });
          });
        }
      }
    });
  },

  /**
   * 本地更新列表中的书籍状态 (优化体验，避免重新加载整个列表)
   */
  updateListingStatus(bookId, newStatus) {
    const listings = this.data.myListings;
    const index = listings.findIndex(item => (item.id || item._id) === bookId);
    if (index !== -1) {
      this.setData({
        [`myListings[${index}].status`]: newStatus
      });
    } else {
      // 如果找不到，可能需要重新加载
      this.loadMyListings();
    }
  },

  /**
   * 本地更新列表中的书籍价格
   */
  updateListingPrice(bookId, newPrice) {
    const listings = this.data.myListings;
    const index = listings.findIndex(item => (item.id || item._id) === bookId);
    if (index !== -1) {
      this.setData({
        [`myListings[${index}].price`]: newPrice
      });
    } else {
      this.loadMyListings();
    }
  },

  /**
   * 处理图片加载错误 (如果需要)
   */
  onImageError(e) {
    console.log('Image failed to load:', e);
    // 可以设置一个默认图片
    // const index = e.currentTarget.dataset.index;
    // this.setData({
    //   [`myListings[${index}].coverUrl`]: '../../images/default-book-cover.png'
    // });
  },
})
