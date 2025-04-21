// pages/publish/index.js
const cloudStorage = require('../../utils/cloudStorage');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    bookImages: [], // 书籍照片数组
    cloudFileIDs: [], // 云存储文件ID数组
    title: '', // 书名
    categories: ['理工科', '文史类', '外语类', '考研类', '考公类', '经管类', '其它'], // 分类选项
    categoryIndex: -1, // 选中的分类索引
    conditions: ['全新', '仅有划线', '少量笔记', '大量笔记'], // 品相选项
    conditionIndex: -1, // 选中的品相索引
    transactionMethod: '买家自取', // 交易方式，默认为买家自取
    price: '', // 价格
    description: '', // 详细描述
    version: 'v1.0.0', // 版本号
    showCategoryPicker: false, // 是否显示分类选择器
    showConditionPicker: false, // 是否显示品相选择器
    isUploading: false, // 是否正在上传图片
    showSuccessModal: false, // 是否显示发布成功的模态框
    publishedBookId: '', // 存储刚发布的书籍ID，用于跳转到详情页
    isReturningFromImagePicker: false, // 标记是否从图片选择器返回
    compressedImages: [], // 存储压缩图片信息的数组
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查云环境并打印信息
    console.log('当前云环境:', wx.cloud.DYNAMIC_CURRENT_ENV);
    
    // 确保每次打开页面时表单都被重置为初始状态
    this.resetForm(); 
  },

  /**
   * 重置表单到初始状态
   */
  resetForm: function() {
    this.setData({
      bookImages: [],
      compressedImages: [], 
      cloudFileIDs: [],
      title: '',
      categoryIndex: -1,
      conditionIndex: -1,
      transactionMethod: '买家自取',
      price: '',
      description: '',
      publishedBookId: ''
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log("页面显示 - 状态:", {
      showSuccessModal: this.data.showSuccessModal,
      isReturningFromImagePicker: this.data.isReturningFromImagePicker
    });

    // 优先处理从图片选择器返回的情况
    if (this.data.isReturningFromImagePicker) {
       console.log("从图片选择器返回，保留当前表单数据");
       // 只重置标志，不做其他操作
       this.setData({ isReturningFromImagePicker: false });
    }
    // 其次处理发布成功的情况
    else if (this.data.showSuccessModal) {
       // 如果成功模态框正在显示（或刚处理完），表单的重置由模态框按钮控制
       console.log("发布成功流程中，表单由按钮处理");
    }
    // 其他所有情况（从其他页面返回、应用切换回来等）都重置表单
    else {
      console.log("非图片选择返回且非成功流程，重置为初始状态");
      this.resetForm();
    }
  },

  /**
   * 返回上一页
   */
  navigateBack: function () {
    wx.navigateBack();
  },

  /**
   * 二级压缩图片函数
   * @param {string} tempFilePath - 图片临时路径
   * @returns {Promise} - 返回包含两种压缩级别的对象
   */
  compressImage: function(tempFilePath) {
    return new Promise((resolve, reject) => {
      // 高质量压缩 - 用于详情页展示
      wx.compressImage({
        src: tempFilePath,
        quality: 90, // 高质量压缩，只压缩一点点
        success: (highQualityResult) => {
          // 低质量压缩 - 用于列表页展示和缩略图
          wx.compressImage({
            src: tempFilePath,
            quality: 60, // 更高压缩率
            success: (lowQualityResult) => {
              resolve({
                original: tempFilePath,
                highQuality: highQualityResult.tempFilePath,
                lowQuality: lowQualityResult.tempFilePath
              });
            },
            fail: (err) => {
              console.error('低质量压缩失败:', err);
              // 如果第二次压缩失败，使用第一次的结果
              resolve({
                original: tempFilePath,
                highQuality: highQualityResult.tempFilePath,
                lowQuality: highQualityResult.tempFilePath
              });
            }
          });
        },
        fail: (err) => {
          console.error('高质量压缩失败:', err);
          // 如果压缩失败，则使用原图
          resolve({
            original: tempFilePath,
            highQuality: tempFilePath,
            lowQuality: tempFilePath
          });
        }
      });
    });
  },

  /**
   * 选择图片
   */
  chooseImage: function () {
    const that = this;
    if (that.data.bookImages.length >= 6) {
      wx.showToast({
        title: '最多上传6张图片',
        icon: 'none'
      });
      return;
    }

    // 设置标志，标记即将从图片选择器返回
    that.setData({
      isReturningFromImagePicker: true
    });

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        const tempFilePath = res.tempFilePaths[0];
        wx.showLoading({ title: '处理图片中...', mask: true });
        
        that.compressImage(tempFilePath).then(compressedImageObj => {
          const bookImages = [...that.data.bookImages, tempFilePath];
          const compressedImages = [...that.data.compressedImages, compressedImageObj];
          that.setData({
            bookImages: bookImages,
            compressedImages: compressedImages
          });
          wx.hideLoading();
        }).catch(err => {
          console.error('处理图片失败:', err);
          wx.hideLoading();
          wx.showToast({ title: '图片处理失败', icon: 'none' });
        });
      },
      fail: function() {
        console.log('用户取消选择图片');
        // 取消选择时，也需要重置标志，否则onShow会误判
        that.setData({ isReturningFromImagePicker: false }); 
      },
      complete: function() {
        console.log('选择图片API调用完成');
        // complete 在 fail/success 之后执行，此时 isReturningFromImagePicker 可能已被 fail 重置
        // 所以不需要在这里再次设置
      }
    });
  },

  /**
   * 移除图片
   */
  removeImage: function (e) {
    const index = e.currentTarget.dataset.index;
    const bookImages = this.data.bookImages;
    const compressedImages = this.data.compressedImages;
    const cloudFileIDs = this.data.cloudFileIDs;
    
    bookImages.splice(index, 1);
    compressedImages.splice(index, 1);
    if (cloudFileIDs.length > index) {
      cloudFileIDs.splice(index, 1);
    }
    
    this.setData({
      bookImages: bookImages,
      compressedImages: compressedImages,
      cloudFileIDs: cloudFileIDs
    });
  },

  /**
   * 书名输入
   */
  onTitleInput: function (e) { this.setData({ title: e.detail.value }); },

  /**
   * 显示分类选择器
   */
  showCategorySelector: function () { this.setData({ showCategoryPicker: true, showConditionPicker: false }); },

  /**
   * 隐藏分类选择器
   */
  hideCategorySelector: function () { this.setData({ showCategoryPicker: false }); },

  /**
   * 分类选择
   */
  onCategoryChange: function (e) { this.setData({ categoryIndex: e.detail.value }); },

  /**
   * 选择分类项
   */
  selectCategory: function (e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ categoryIndex: index, showCategoryPicker: false });
  },

  /**
   * 显示品相选择器
   */
  showConditionSelector: function () { this.setData({ showConditionPicker: true, showCategoryPicker: false }); },

  /**
   * 隐藏品相选择器
   */
  hideConditionSelector: function () { this.setData({ showConditionPicker: false }); },

  /**
   * 品相选择
   */
  onConditionChange: function (e) { this.setData({ conditionIndex: e.detail.value }); },

  /**
   * 选择品相项
   */
  selectCondition: function (e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ conditionIndex: index, showConditionPicker: false });
  },

  /**
   * 交易方式选择
   */
  selectTransactionMethod: function (e) {
    this.setData({ transactionMethod: e.currentTarget.dataset.method });
  },

  /**
   * 价格输入
   */
  onPriceInput: function (e) { this.setData({ price: e.detail.value }); },

  /**
   * 描述输入
   */
  onDescriptionInput: function (e) { this.setData({ description: e.detail.value }); },

  /**
   * 上传图片到云存储
   */
  uploadImagesToCloud: function () {
    const that = this;
    const { bookImages, compressedImages, title } = that.data;
    
    return new Promise((resolve, reject) => {
      if (bookImages.length === 0) {
        resolve([]);
        return;
      }
      
      that.setData({ isUploading: true });
      
      if (compressedImages.length !== bookImages.length) {
        that.setData({ isUploading: false });
        reject(new Error('图片处理未完成，请稍后再试'));
        return;
      }
      
      const uploadPromisesArray = compressedImages.map((image, index) => {
        const timestamp = new Date().getTime();
        
        const highQualityPromise = wx.cloud.uploadFile({
          cloudPath: `user-uploads/${timestamp}_${title}_high_${index}.jpg`,
          filePath: image.highQuality
        });
        const lowQualityPromise = wx.cloud.uploadFile({
          cloudPath: `user-uploads/${timestamp}_${title}_low_${index}.jpg`,
          filePath: image.lowQuality
        });
        
        return Promise.all([highQualityPromise, lowQualityPromise])
          .then(([highResult, lowResult]) => {
            return {
              highQuality: highResult.fileID,
              lowQuality: lowResult.fileID
            };
          });
      });
      
      Promise.all(uploadPromisesArray)
        .then(results => {
          that.setData({ cloudFileIDs: results, isUploading: false });
          resolve(results);
        })
        .catch(err => {
          console.error('至少一张图片上传失败:', err);
          that.setData({ isUploading: false });
          reject(new Error('图片上传失败: ' + (err.errMsg || JSON.stringify(err)))); 
        });
    });
  },

  /**
   * 提交表单
   */
  submitForm: function () {
    const that = this;
    const { bookImages, title, categoryIndex, conditionIndex, transactionMethod, price, description, categories, conditions } = that.data;

    // 表单验证
    if (bookImages.length === 0) {
      wx.showToast({
        title: '请上传书籍照片',
        icon: 'none'
      });
      return;
    }

    if (!title) {
      wx.showToast({
        title: '请输入书名',
        icon: 'none'
      });
      return;
    }

    if (categoryIndex === -1) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none'
      });
      return;
    }

    if (conditionIndex === -1) {
      wx.showToast({
        title: '请选择品相',
        icon: 'none'
      });
      return;
    }

    if (!price) {
      wx.showToast({
        title: '请输入价格',
        icon: 'none'
      });
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: '发布中...',
    });

    // 先上传图片到云存储
    that.uploadImagesToCloud()
      .then(cloudFileIDs => {
        // 构建书籍数据，包含高低两种质量的图片URL
        const bookData = {
          title: title,
          category: categories[categoryIndex],
          condition: conditions[conditionIndex],
          price: parseFloat(price),
          description: description || '',
          transactionMethod: transactionMethod,
          // 第一张图作为封面，高低质量都保存
          coverUrl: cloudFileIDs[0].highQuality,
          coverUrlLow: cloudFileIDs[0].lowQuality,
          // 所有图片，高低质量都保存
          images: cloudFileIDs.map(id => id.highQuality),
          imagesLow: cloudFileIDs.map(id => id.lowQuality),
          createdAt: new Date(),
          college: '计算机学院', // 暂时使用固定值，实际应该从用户信息获取
          campus: '江宁', // 暂时使用固定值
          status: 'active' // 书籍状态：active-在售，sold-已售出
        };
        
        console.log('准备保存书籍数据:', bookData);
        
        // 调用云函数，将书籍信息存入数据库
        wx.cloud.callFunction({
          name: 'addBook',
          data: {
            bookData: bookData
          },
          env: 'YOUR_ENV_ID', // 显式指定云环境ID
        })
        .then(res => {
          console.log('云函数调用成功:', res);
          wx.hideLoading();
          
          // 保存已发布书籍的ID
          let bookId = '';
          if (res.result && res.result.data && res.result.data._id) {
            bookId = res.result.data._id;
          }
          
          // 显示发布成功的模态框，而不是直接返回
          that.setData({
            showSuccessModal: true,
            publishedBookId: bookId
          });
        })
        .catch(err => {
          console.error('调用 addBook 云函数失败:', err);
          wx.hideLoading();
          // Try to get error message from backend result if possible
          const errMsg = err.result?.error?.message || err.errMsg || '发布失败，数据库错误';
          wx.showToast({
            title: errMsg,
            icon: 'none'
          });
          
          // 如果云函数调用失败，尝试保存到本地作为备份
          try {
            // 获取现有的书籍数据
            let books = wx.getStorageSync('localBooks') || [];
            // 添加新书籍
            bookData.id = new Date().getTime();
            books.push(bookData);
            // 保存到本地
            wx.setStorageSync('localBooks', books);
            console.log('已保存到本地存储:', bookData);
          } catch (e) {
            console.error('保存到本地存储失败:', e);
          }
        });
      })
      .catch(err => {
        console.error('图片上传步骤失败:', err);
        wx.hideLoading();
        wx.showToast({
          // Use the error message from the rejection if available
          title: err.message || '图片上传失败，请重试', 
          icon: 'none'
        });
      });
  },

  /**
   * 处理"查看我的发布"按钮点击
   */
  handleViewMyPosts: function() {
    const { publishedBookId } = this.data;
    this.setData({
      showSuccessModal: false,
      // 重置表单数据
      bookImages: [],
      cloudFileIDs: [],
      title: '',
      categoryIndex: -1,
      conditionIndex: -1,
      transactionMethod: '买家自取',
      price: '',
      description: '',
      publishedBookId: ''
    });

    // 跳转到用户中心页面，并传递tab参数以显示"我的发布"选项卡
    wx.switchTab({
      url: '/pages/user-center/index',
      success: () => {
        // 发送消息通知user-center页面切换到"我的发布"选项卡
        const eventChannel = this.getOpenerEventChannel();
        if (eventChannel && eventChannel.emit) {
          eventChannel.emit('switchToMyPosts');
        }
      }
    });
  },

  /**
   * 处理"再发一本"按钮点击
   */
  handlePublishAgain: function() {
    this.setData({ showSuccessModal: false });
    this.resetForm(); // 使用重置函数
  },
});
