const app = getApp();
const cloudStorage = require('../../utils/cloudStorage');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    books: [],
    loading: true,
    currentPage: 1,
    hasMore: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.loadRecommendedBooks();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 如果需要刷新数据，可以在这里重新加载
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.setData({
      books: [],
      currentPage: 1,
      hasMore: true
    });
    this.loadRecommendedBooks();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    if (this.data.hasMore) {
      this.loadMoreBooks();
    }
  },

  /**
   * 加载推荐书籍
   */
  loadRecommendedBooks: function() {
    this.setData({ loading: true });
    
    console.log('开始加载推荐书籍');
    
    // 先使用本地模拟数据确保UI正常显示
    const mockBooks = this.getMockBooks();
    console.log('使用模拟书籍数据:', mockBooks.length, '本');
    
    // 立即设置模拟数据，确保界面显示多本书籍
    this.setData({
      books: mockBooks,
      loading: false,
      hasMore: false
    });
    
    // 然后尝试从云数据库获取数据
    wx.cloud.callFunction({
      name: 'getBooks',
      data: {
        limit: 10,
        skip: 0
      },
      success: res => {
        console.log('云函数getBooks返回结果:', res);
        
        // 只有当云函数返回多本书籍时才替换本地数据
        if (res.result && res.result.data && res.result.data.length > 1) {
          console.log('使用云数据库书籍:', res.result.data.length, '本');
          this.setData({
            books: res.result.data,
            hasMore: res.result.data.length >= 10
          });
        } else {
          console.log('云函数返回数据不足，保留模拟数据');
        }
        
        wx.stopPullDownRefresh();
      },
      fail: err => {
        console.error('获取书籍数据失败', err);
        console.log('保留模拟数据');
        wx.stopPullDownRefresh();
      }
    });
  },

  /**
   * 加载更多书籍
   */
  loadMoreBooks: function() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ 
      loading: true,
      currentPage: this.data.currentPage + 1
    });
    
    // 从云数据库获取更多书籍数据
    wx.cloud.callFunction({
      name: 'getBooks',
      data: {
        limit: 10,
        skip: (this.data.currentPage - 1) * 10
      },
      success: res => {
        const moreBooks = res.result.data || [];
        
        this.setData({
          books: [...this.data.books, ...moreBooks],
          loading: false,
          hasMore: moreBooks.length >= 10
        });
      },
      fail: err => {
        console.error('获取更多书籍数据失败', err);
        this.setData({
          loading: false,
          hasMore: false
        });
      }
    });
  },

  /**
   * 获取模拟书籍数据
   */
  getMockBooks: function() {
    // 云存储中的图片路径前缀
    const CLOUD_PATH = 'cloud://cloud1-2g21cwvn7097e332.636c-cloud1-2g21cwvn7097e332-1348406115/book-covers/';
    
    return [
      {
        _id: '1',
        title: '理工类_大学物理学（上册）',
        coverUrl: `${CLOUD_PATH}理工类_大学物理学（上册）封面.jpg`,
        price: 25.00,
        originalPrice: 42.80,
        condition: '少量笔记',
        category: '理工科',
        transactionMethod: '买家自取',
        college: '物理学院',
        isLiked: false,
        status: 'active'
      },
      {
        _id: '2',
        title: '理工类_化工原理',
        coverUrl: `${CLOUD_PATH}理工类_化工原理封面.jpg`,
        price: 30.00,
        originalPrice: 55.00,
        condition: '全新',
        category: '理工科',
        transactionMethod: '卖家包送',
        college: '化学工程学院',
        isLiked: false,
        status: 'active'
      },
      {
        _id: '3',
        title: '理工类_机械原理',
        coverUrl: `${CLOUD_PATH}理工类_机械原理封面.jpg`,
        price: 35.00,
        originalPrice: 45.00,
        condition: '全新',
        category: '理工科',
        transactionMethod: '买家自取',
        college: '机械工程学院',
        isLiked: false,
        status: 'active'
      },
      {
        _id: '4',
        title: '外语类_视听说教程3',
        coverUrl: `${CLOUD_PATH}外语类_视听说教程3封面.jpg`,
        price: 45.00,
        originalPrice: 59.00,
        condition: '大量笔记',
        category: '外语类',
        transactionMethod: '卖家包送',
        college: '外国语学院',
        isLiked: false,
        status: 'active'
      },
      {
        _id: '5',
        title: '文史类_毛泽东思想和中国特色社会主义理论',
        coverUrl: `${CLOUD_PATH}文史类_毛泽东思想和中国特色社会主义理论封面.jpg`,
        price: 20.00,
        originalPrice: 38.00,
        condition: '少量笔记',
        category: '文史类',
        transactionMethod: '买家自取',
        college: '马克思主义学院',
        isLiked: false,
        status: 'active'
      },
      {
        _id: '6',
        title: '文史类_思想道德与法治',
        coverUrl: `${CLOUD_PATH}文史类_思想道德与法治封面.jpg`,
        price: 18.00,
        originalPrice: 32.50,
        condition: '全新',
        category: '文史类',
        transactionMethod: '卖家包送',
        college: '法学院',
        isLiked: false,
        status: 'active'
      }
    ];
  },

  /**
   * 点击书籍卡片
   */
  onTapBook: function(e) {
    const bookId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/book-detail/index?id=${bookId}`
    });
  },

  /**
   * 切换收藏状态
   */
  toggleLike: function(e) {
    const bookId = e.currentTarget.dataset.id;
    const books = this.data.books.map(book => {
      if (book._id === bookId) {
        return { ...book, isLiked: !book.isLiked };
      }
      return book;
    });
    
    this.setData({ books });
    
    // 实际项目中应该调用API更新收藏状态
    wx.showToast({
      title: books.find(b => b._id === bookId).isLiked ? '已收藏' : '已取消收藏',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 查看全部书籍
   */
  viewAllBooks: function() {
    wx.switchTab({
      url: '/pages/goods-list/index'
    });
  },

  /**
   * 跳转到搜索页面
   */
  navigateToSearch: function() {
    wx.navigateTo({
      url: '/pages/search/index'
    });
  },

  /**
   * 跳转到通知页面
   */
  navigateToNotifications: function() {
    wx.navigateTo({
      url: '/pages/notifications/index'
    });
  },

  /**
   * 跳转到发布页面
   */
  navigateToPublish: function() {
    wx.navigateTo({
      url: '/pages/publish/index'
    });
  },

  /**
   * 跳转到消息页面
   */
  navigateToMessages: function() {
    wx.navigateTo({
      url: '/pages/messages/index'
    });
  },

  /**
   * 跳转到个人中心页面
   */
  navigateToProfile: function() {
    wx.switchTab({
      url: '/pages/user-center/index'
    });
  }
});
