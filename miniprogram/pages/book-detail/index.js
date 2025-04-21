// pages/book-detail/index.js
const app = getApp();

Page({
  data: {
    bookId: '',
    bookInfo: {},
    bookImages: [],
    highQualityBookImages: [], // 高质量图片数组
    isLoadingHighQuality: false, // 是否正在加载高质量图片
    highQualityLoaded: false, // 高质量图片是否已加载完成
    sellerInfo: {},
    isLiked: false,
    isLoading: true
  },

  onLoad: function(options) {
    // 从页面参数中获取书籍ID
    const bookId = options.id;
    console.log('加载书籍详情，ID:', bookId);
    
    if (bookId) {
      this.setData({
        bookId: bookId
      });
      this.loadBookDetail(bookId);
      // 检查是否已收藏
      this.checkIfFavorited(bookId);
    } else {
      wx.showToast({
        title: '书籍信息不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 加载书籍详情
   */
  loadBookDetail: function (bookId) {
    // 显示加载中状态
    wx.showLoading({
      title: '加载中...',
    });
    
    // 调用云函数获取书籍详情
    wx.cloud.callFunction({
      name: 'getBookDetail',
      data: { 
        bookId: bookId 
      }
    }).then(res => {
      console.log("书籍详情获取成功:", res);
      
      if (res.result && res.result.data) {
        const book = res.result.data;
        
        // 初始化书籍图片数组
        const bookImages = [];
        
        // 使用低质量图片作为初始加载
        if (book.imagesLow && book.imagesLow.length > 0) {
          // 如果有低质量图片数组，使用它
          this.setData({
            bookImages: book.imagesLow
          });
        } else if (book.coverUrlLow) {
          // 如果只有低质量封面，使用它
          this.setData({
            bookImages: [book.coverUrlLow]
          });
        } else if (book.images && book.images.length > 0) {
          // 如果没有低质量图片，回退到高质量图片
          this.setData({
            bookImages: book.images
          });
        } else if (book.coverUrl) {
          // 最后回退到封面图
          this.setData({
            bookImages: [book.coverUrl]
          });
        }
        
        // 存储书籍信息
        this.setData({
          bookInfo: book
        });
        
        // 预加载高质量图片
        this.preloadHighQualityImages(book);
        
        // 检查是否已收藏
        this.checkIfLiked(bookId);
        
        // 加载卖家信息
        if (book.sellerId) {
          this.loadSellerInfo(book.sellerId);
        }
      } else {
        console.error("未获取到书籍数据");
        wx.showToast({
          title: '未找到书籍信息',
          icon: 'none'
        });
      }
      
      wx.hideLoading();
    }).catch(err => {
      console.error("获取书籍详情失败:", err);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    });
  },
  
  /**
   * 预加载高质量图片
   */
  preloadHighQualityImages: function(book) {
    // 如果没有高质量图片，不执行预加载
    if (!book.images || book.images.length === 0) {
      return;
    }
    
    this.setData({
      isLoadingHighQuality: true
    });
    
    // 获取高质量图片
    const highQualityImages = book.images;
    
    // 创建预加载任务
    const preloadPromises = highQualityImages.map(src => {
      return new Promise((resolve) => {
        wx.getImageInfo({
          src: src,
          success: () => {
            console.log('高质量图片预加载成功:', src);
            resolve(true);
          },
          fail: (err) => {
            console.error('高质量图片预加载失败:', err);
            resolve(false);
          }
        });
      });
    });
    
    // 所有高质量图片加载完成后切换
    Promise.all(preloadPromises).then(results => {
      if (results.some(success => success)) {
        this.setData({
          bookImages: highQualityImages,
          highQualityLoaded: true,
          isLoadingHighQuality: false
        });
        console.log('所有高质量图片加载完成，已切换');
      }
    });
  },

  // 获取卖家信息
  loadSellerInfo: function(sellerId) {
    const that = this;
    
    // 如果没有卖家ID，使用默认信息
    if (!sellerId) {
      that.setData({
        sellerInfo: {
          _id: 'unknown',
          nickname: '匿名卖家',
          avatar: '/images/default-avatar.png'
        }
      });
      return;
    }
    
    wx.cloud.callFunction({
      name: 'getUserInfo',
      data: {
        userId: sellerId
      },
      success: function(res) {
        console.log('获取卖家信息结果:', res);
        
        if (res.result && res.result.data) {
          that.setData({
            sellerInfo: res.result.data
          });
        } else {
          // 使用默认卖家信息
          that.setData({
            sellerInfo: {
              _id: sellerId,
              nickname: '书籍卖家',
              avatar: '/images/default-avatar.png'
            }
          });
        }
      },
      fail: function(err) {
        console.error('获取卖家信息失败', err);
        // 使用默认卖家信息
        that.setData({
          sellerInfo: {
            _id: sellerId,
            nickname: '书籍卖家',
            avatar: '/images/default-avatar.png'
          }
        });
      }
    });
  },

  // 收藏/取消收藏
  toggleLike: function() {
    // 检查用户是否登录
    if (!wx.getStorageSync('userInfo')) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    const db = wx.cloud.database();
    const favoritesCollection = db.collection('favorites');
    const bookId = this.data.bookId;
    const currentIsLiked = this.data.isLiked;

    // 乐观更新 UI，如果后端失败再回滚
    this.setData({
      isLiked: !currentIsLiked
    });

    if (!currentIsLiked) {
      // 添加收藏
      favoritesCollection.add({
        data: {
          bookId: bookId,
          addDate: new Date() // 记录添加时间
          // _openid 会自动添加
        }
      }).then(res => {
        console.log('收藏成功', res);
        wx.showToast({
          title: '已收藏',
          icon: 'success'
        });
      }).catch(err => {
        console.error('收藏失败', err);
        // 回滚 UI
        this.setData({
          isLiked: currentIsLiked
        });
        wx.showToast({
          title: '收藏失败，请重试',
          icon: 'none'
        });
      });
    } else {
      // 取消收藏：查找对应的记录并删除
      favoritesCollection.where({
        bookId: bookId
      }).get().then(res => {
        if (res.data && res.data.length > 0) {
          const favoriteRecordId = res.data[0]._id;
          favoritesCollection.doc(favoriteRecordId).remove()
            .then(() => {
              console.log('取消收藏成功');
              wx.showToast({
                title: '已取消收藏',
                icon: 'none' // 取消收藏用 none 更好
              });
            })
            .catch(err => {
              console.error('取消收藏失败', err);
              // 回滚 UI
              this.setData({
                isLiked: currentIsLiked
              });
              wx.showToast({
                title: '取消收藏失败',
                icon: 'none'
              });
            });
        } else {
          console.warn('未找到要取消的收藏记录');
          // 虽然前端状态是 isLiked，但数据库里没有，可能是数据不同步
          // 强制同步UI，并给提示
           this.setData({
             isLiked: false // 强制设为未收藏
           });
           wx.showToast({
             title: '操作异常',
             icon: 'none'
           });
        }
      }).catch(err => {
         console.error('查询收藏记录失败', err);
         // 回滚 UI
         this.setData({
           isLiked: currentIsLiked
         });
         wx.showToast({
           title: '操作失败',
           icon: 'none'
         });
      });
    }
  },

  // 联系卖家
  contactSeller: function() {
    // 获取当前商品和卖家的信息
    const { bookInfo, sellerInfo } = this.data;
    
    // 检查是否有必要的信息
    if (!bookInfo || !sellerInfo) {
      wx.showToast({
        title: '获取信息失败，请稍后再试',
        icon: 'none'
      });
      return;
    }
    
    // 获取商品的关键信息
    const productId = bookInfo._id;
    const productName = bookInfo.title;
    const productPrice = bookInfo.price;
    // 使用第一张图片作为商品图片
    const productImageUrl = this.data.bookImages && this.data.bookImages.length > 0 ? 
                           this.data.bookImages[0] : (bookInfo.coverUrl || '');
    // 获取卖家ID
    const sellerId = sellerInfo._id;
    
    // 检查关键信息是否存在
    if (!productId || !productName || !productPrice || !productImageUrl || !sellerId) {
      wx.showToast({
        title: '商品信息不完整，请稍后再试',
        icon: 'none'
      });
      return;
    }
    
    // 对名称和图片URL进行编码，避免URL参数问题
    const encodedName = encodeURIComponent(productName);
    const encodedImageUrl = encodeURIComponent(productImageUrl);
    
    // 构造跳转URL
    const targetUrl = `/pages/chat-detail/index?sellerId=${sellerId}&productId=${productId}&productName=${encodedName}&productPrice=${productPrice}&productImageUrl=${encodedImageUrl}`;
    
    console.log('跳转到聊天页面:', targetUrl);
    
    // 执行跳转
    wx.navigateTo({
      url: targetUrl
    });
  },

  // 立即购买
  buyNow: function() {
    wx.showToast({
      title: '购买功能开发中',
      icon: 'none'
    });
  },

  // 返回上一页
  navigateBack: function() {
    wx.navigateBack();
  },

  // 获取本地书籍数据，确保书籍详情页也能访问
  getLocalBooks: function() {
    return [
      {
        _id: '1',
        title: '理工类_大学物理学（上册）',
        coverUrl: 'https://img3.doubanio.com/view/subject/s/public/s29952535.jpg',
        price: 25.00,
        originalPrice: 42.80,
        condition: '少量笔记',
        category: '理工科',
        transactionMethod: '自取',
        college: '物理学院',
        isLiked: false,
        status: 'active',
        description: '质量好，有少量笔记，适合学习参考'
      },
      {
        _id: '2',
        title: '理工类_化工原理',
        coverUrl: 'https://img2.doubanio.com/view/subject/s/public/s29063045.jpg',
        price: 30.00,
        originalPrice: 55.00,
        condition: '全新',
        category: '理工科',
        transactionMethod: '包送',
        college: '化学工程学院',
        isLiked: false,
        status: 'active',
        description: '全新未使用，只拆封看了一下'
      },
      {
        _id: 'hydraulics_01',
        title: '水力学（第五版）',
        coverUrl: 'https://img2.doubanio.com/view/subject/s/public/s33532838.jpg',
        price: 32,
        originalPrice: 56,
        condition: '少量笔记',
        category: '工程技术',
        transactionMethod: '买家自取',
        campus: '江宁',
        college: '水利学院',
        isLiked: false,
        status: 'active',
        description: '书里有少量笔记，非常实用，有助于理解难点'
      },
      {
        _id: 'hydraulics_02',
        title: '水力学习题集（第四版）',
        coverUrl: 'https://img1.doubanio.com/view/subject/s/public/s29170281.jpg',
        price: 25,
        originalPrice: 42,
        condition: '全新',
        category: '工程技术',
        transactionMethod: '卖家包送',
        campus: '江宁',
        college: '水利学院',
        isLiked: false,
        status: 'active',
        description: '全新水力学习题集，包含详细解答'
      }
    ];
  },

  onShareAppMessage: function() {
    const { bookInfo } = this.data;
    return {
      title: `${bookInfo.title} - ¥${bookInfo.price}`,
      path: `/pages/book-detail/index?id=${this.data.bookId}`,
      imageUrl: this.data.bookImages.length > 0 ? this.data.bookImages[0] : ''
    };
  },

  /**
   * 加载推荐书籍
   */
  loadRecommendedBooks: function() {
    this.setData({ loading: true });
    
    console.log('开始加载推荐书籍');
    
    // 先使用本地模拟数据确保UI正常显示
    const mockBooks = this.getMockBooks();
    this.setData({
      books: mockBooks,
      loading: false
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

  // 新增：检查是否已收藏
  checkIfFavorited: function(bookId) {
    // 检查用户是否登录
    if (!wx.getStorageSync('userInfo')) {
      console.log('用户未登录，无法检查收藏状态');
      return;
    }
    
    const db = wx.cloud.database();
    // 查询当前用户是否已收藏此书
    db.collection('favorites')
      .where({
        bookId: bookId
      })
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          // 已收藏
          this.setData({
            isLiked: true
          });
          console.log('此书已被收藏');
        } else {
          // 未收藏
          this.setData({
            isLiked: false
          });
          console.log('此书未被收藏');
        }
      })
      .catch(err => {
        console.error('检查收藏状态失败:', err);
      });
  }
});