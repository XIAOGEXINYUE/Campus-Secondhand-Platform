// pages/search/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    searchKeyword: '',
    recentSearches: ['高等数学', '线性代数', '大学英语', '数据结构', '经济学原理'],
    hotSearches: ['高等数学', '大学物理', '计算机网络', '操作系统', '数据库原理', '微积分', '概率论', '大学英语'],
    showResults: false,
    resultsCount: 0,
    searchResults: [],
    selectedCategory: 'all'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 如果有传入的关键词，直接搜索
    if (options.keyword) {
      this.setData({
        searchKeyword: options.keyword
      });
      this.onSearch();
    }
  },

  /**
   * 搜索输入
   */
  onSearchInput: function (e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  /**
   * 执行搜索
   */
  onSearch: function () {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) return;

    console.log('搜索关键词:', keyword);

    // 添加到最近搜索
    this.addToRecentSearches(keyword);

    // 特殊处理水力学搜索，确保能找到结果
    if (keyword.includes('水力') || keyword.includes('水力学')) {
      console.log('检测到水力学关键词，使用特殊处理');
      
      // 提前显示提示
      wx.showToast({
        title: '正在搜索水力学相关书籍',
        icon: 'none',
        duration: 1500
      });
    }

    // 跳转到搜索结果页
    wx.navigateTo({
      url: `/pages/search-results/index?keyword=${encodeURIComponent(keyword)}`
    });
  },

  /**
   * 添加到最近搜索
   */
  addToRecentSearches: function (keyword) {
    let recentSearches = this.data.recentSearches;
    
    // 如果已存在，先移除
    const index = recentSearches.indexOf(keyword);
    if (index > -1) {
      recentSearches.splice(index, 1);
    }
    
    // 添加到最前面
    recentSearches.unshift(keyword);
    
    // 保持最多5个
    if (recentSearches.length > 5) {
      recentSearches = recentSearches.slice(0, 5);
    }
    
    this.setData({
      recentSearches: recentSearches
    });
  },

  /**
   * 清除最近搜索
   */
  clearRecentSearches: function () {
    this.setData({
      recentSearches: []
    });
  },

  /**
   * 点击搜索标签
   */
  onTagTap: function (e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      searchKeyword: keyword
    });
    this.onSearch();
  },

  /**
   * 点击分类
   */
  onCategoryTap: function (e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: category
    });
    
    // 跳转到搜索结果页并传递分类
    wx.navigateTo({
      url: `/pages/search-results/index?category=${category}`
    });
  },

  /**
   * 点击书籍
   */
  onBookTap: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/goods-detail/index?id=${id}`
    });
  },

  /**
   * 点击收藏
   */
  onLikeTap: function (e) {
    const id = e.currentTarget.dataset.id;
    const searchResults = this.data.searchResults;
    
    // 找到对应的书籍并切换收藏状态
    const index = searchResults.findIndex(item => item.id === id);
    if (index > -1) {
      searchResults[index].isLiked = !searchResults[index].isLiked;
      this.setData({
        searchResults: searchResults
      });
    }
    
    // 阻止事件冒泡
    return false;
  },

  /**
   * 获取模拟搜索结果
   */
  getMockSearchResults: function () {
    return [
      {
        id: 1,
        title: '高等数学（第七版）同济大学',
        image: 'https://img3.doubanio.com/view/subject/s/public/s3392671.jpg',
        category: '理工科',
        condition: '9成新',
        price: 25,
        college: '计算机学院',
        transactionMethod: '买家自取',
        isLiked: false
      },
      {
        id: 2,
        title: '线性代数（第六版）北大出版社',
        image: 'https://img2.doubanio.com/view/subject/s/public/s29958081.jpg',
        category: '理工科',
        condition: '8成新',
        price: 20,
        college: '数学学院',
        transactionMethod: '卖家包送',
        isLiked: true
      },
      {
        id: 3,
        title: '大学英语四级考试指南',
        image: 'https://img1.doubanio.com/view/subject/s/public/s33480841.jpg',
        category: '外语类',
        condition: '全新',
        price: 30,
        college: '外国语学院',
        transactionMethod: '买家自取',
        isLiked: false
      },
      {
        id: 4,
        title: '数据结构与算法分析',
        image: 'https://img2.doubanio.com/view/subject/s/public/s29358625.jpg',
        category: '理工科',
        condition: '少量笔记',
        price: 35,
        college: '计算机学院',
        transactionMethod: '卖家包送',
        isLiked: false
      },
      {
        id: 5,
        title: '经济学原理（第八版）曼昆',
        image: 'https://img9.doubanio.com/view/subject/s/public/s33975147.jpg',
        category: '经管类',
        condition: '仅有划线',
        price: 40,
        college: '经济学院',
        transactionMethod: '买家自取',
        isLiked: false
      },
      {
        id: 6,
        title: '计算机网络（第七版）谢希仁',
        image: 'https://img1.doubanio.com/view/subject/s/public/s29825217.jpg',
        category: '理工科',
        condition: '大量笔记',
        price: 22,
        college: '计算机学院',
        transactionMethod: '卖家包送',
        isLiked: false
      }
    ];
  }
});
