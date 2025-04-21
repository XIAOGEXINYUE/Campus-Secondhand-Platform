const app = getApp();
const db = wx.cloud.database();
const _ = db.command; // 获取数据库查询指令

Page({
  data: {
    favoriteBooks: [], // 收藏的书籍列表
    isLoading: true,   // 是否正在加载
    hasMore: false,    // 是否还有更多数据（用于分页）
    page: 0,           // 当前页码
    pageSize: 10       // 每页加载数量
  },

  onLoad: function () {
    this.setData({ isLoading: true, favoriteBooks: [], page: 0 }); // 重置状态
    this.loadFavoriteBooks(true); // 首次加载
  },

  onShow: function () {
    // 每次进入页面都可能需要刷新，因为可能在详情页取消了收藏
    this.setData({ isLoading: true, favoriteBooks: [], page: 0 }); 
    this.loadFavoriteBooks(true); 
  },

  // 加载收藏的书籍
  loadFavoriteBooks: function(isRefresh = false) {
    // 检查登录状态
    if (!wx.getStorageSync('userInfo')) {
      wx.showToast({ 
        title: '请先登录', 
        icon: 'none' 
      });
      this.setData({ isLoading: false });
      return;
    }

    this.setData({ isLoading: true });
    const page = isRefresh ? 0 : this.data.page;
    const pageSize = this.data.pageSize;

    // 1. 从 favorites 集合获取收藏记录
    db.collection('favorites')
      .orderBy('addDate', 'desc') // 按收藏时间倒序
      .skip(page * pageSize)
      .limit(pageSize)
      .get()
      .then(res => {
        const favoriteRecords = res.data;
        console.log('获取到的收藏记录:', favoriteRecords);

        if (favoriteRecords.length === 0) {
          // 没有收藏记录
          this.setData({ 
            isLoading: false, 
            favoriteBooks: isRefresh ? [] : this.data.favoriteBooks,
            hasMore: false 
          });
          return;
        }
        
        const bookIds = favoriteRecords.map(record => record.bookId);

        if (bookIds.length === 0) {
          // 本页没有更多收藏了
          this.setData({ isLoading: false, hasMore: false });
          return;
        }

        // 2. 根据 bookId 列表去查询书籍详情
        return db.collection('books').where({
          _id: _.in(bookIds) // 使用 _.in 查询多个 ID
        }).get();
      })
      .then(res => {
        if (!res) return; // 如果前面没有收藏记录，这里会是 undefined
        
        const booksData = res.data;
        console.log('获取到的书籍详情:', booksData);

        // 将书籍数据与收藏记录关联
        const currentBooks = this.data.favoriteBooks;
        const newBooks = isRefresh ? booksData : [...currentBooks, ...booksData];
        
        this.setData({
          favoriteBooks: newBooks,
          isLoading: false,
          hasMore: booksData.length === this.data.pageSize, // 判断是否还有更多
          page: page + 1 // 页码增加
        });
      })
      .catch(err => {
        console.error('加载收藏失败:', err);
        this.setData({ isLoading: false });
        wx.showToast({ 
          title: '加载失败，请重试', 
          icon: 'none' 
        });
      });
  },
  
  // 下拉刷新
  onPullDownRefresh: function () {
    this.loadFavoriteBooks(true); // 传递 true 表示刷新
    wx.stopPullDownRefresh(); // 停止下拉刷新动画
  },

  // 上拉触底加载更多
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadFavoriteBooks(); // 加载下一页
    }
  },

  // 加载更多按钮点击事件
  loadMoreBooks: function() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadFavoriteBooks(); // 加载下一页
    }
  },

  // 跳转到书籍详情页
  navigateToBookDetail: function(event) {
    const bookId = event.currentTarget.dataset.id;
    if (bookId) {
      wx.navigateTo({
        url: `/pages/book-detail/index?id=${bookId}`
      });
    }
  },
  
  // 去首页逛逛
  goToHome: function() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 返回上一页
  navigateBack: function() {
    wx.navigateBack({
      delta: 1
    });
  }
});
