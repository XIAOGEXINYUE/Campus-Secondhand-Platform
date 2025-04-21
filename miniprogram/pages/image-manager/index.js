// pages/image-manager/index.js
const cloudStorage = require('../../utils/cloudStorage');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    selectedImages: [], // 选中待上传的图片
    uploadedImages: [], // 已上传的图片
    isUploading: false, // 是否正在上传
    uploadProgress: 0, // 上传进度
    currentUploadIndex: 0 // 当前上传的图片索引
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 获取已上传的图片列表
    this.fetchUploadedImages();
  },

  /**
   * 获取已上传的图片列表
   */
  fetchUploadedImages: function() {
    wx.cloud.callFunction({
      name: 'getCloudStorageFiles',
      data: {
        folder: 'book-covers/'
      },
      success: res => {
        if (res.result && res.result.fileList) {
          const fileList = res.result.fileList;
          // 获取每个文件的临时URL
          const promises = fileList.map(file => {
            return cloudStorage.getImageUrl(file.fileID).then(url => {
              return {
                fileID: file.fileID,
                name: file.fileID.split('/').pop(),
                url: url
              };
            });
          });
          
          Promise.all(promises).then(uploadedImages => {
            this.setData({
              uploadedImages: uploadedImages
            });
          });
        }
      },
      fail: err => {
        console.error('获取云存储文件列表失败', err);
        wx.showToast({
          title: '获取图片列表失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 选择图片
   */
  chooseImage: function() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album'],
      success: res => {
        const tempFiles = res.tempFiles;
        const selectedImages = tempFiles.map(file => {
          // 从文件路径中提取文件名
          const name = file.tempFilePath.split('/').pop();
          return {
            path: file.tempFilePath,
            size: file.size,
            name: name
          };
        });
        
        this.setData({
          selectedImages: [...this.data.selectedImages, ...selectedImages]
        });
      }
    });
  },

  /**
   * 移除选中的图片
   */
  removeSelectedImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const selectedImages = this.data.selectedImages;
    selectedImages.splice(index, 1);
    this.setData({
      selectedImages: selectedImages
    });
  },

  /**
   * 上传选中的图片
   */
  uploadSelectedImages: function() {
    const { selectedImages } = this.data;
    if (selectedImages.length === 0) {
      return;
    }
    
    this.setData({
      isUploading: true,
      uploadProgress: 0,
      currentUploadIndex: 0
    });
    
    this.uploadNextImage();
  },

  /**
   * 上传下一张图片
   */
  uploadNextImage: function() {
    const { selectedImages, currentUploadIndex } = this.data;
    
    if (currentUploadIndex >= selectedImages.length) {
      // 所有图片上传完成
      this.setData({
        isUploading: false,
        selectedImages: []
      });
      wx.showToast({
        title: '上传完成',
        icon: 'success'
      });
      // 刷新已上传图片列表
      this.fetchUploadedImages();
      return;
    }
    
    const image = selectedImages[currentUploadIndex];
    const cloudPath = `book-covers/${image.name}`;
    
    cloudStorage.uploadImage(image.path, cloudPath)
      .then(res => {
        // 更新上传进度
        const progress = ((currentUploadIndex + 1) / selectedImages.length) * 100;
        this.setData({
          uploadProgress: progress,
          currentUploadIndex: currentUploadIndex + 1
        });
        
        // 上传下一张图片
        this.uploadNextImage();
      })
      .catch(err => {
        console.error('上传图片失败', err);
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
        this.setData({
          isUploading: false
        });
      });
  },

  /**
   * 复制图片链接
   */
  copyImageUrl: function(e) {
    const url = e.currentTarget.dataset.url;
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 删除图片
   */
  deleteImage: function(e) {
    const fileID = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      success: res => {
        if (res.confirm) {
          wx.cloud.deleteFile({
            fileList: [fileID],
            success: res => {
              // 更新已上传图片列表
              const uploadedImages = this.data.uploadedImages.filter(image => image.fileID !== fileID);
              this.setData({
                uploadedImages: uploadedImages
              });
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            },
            fail: err => {
              console.error('删除文件失败', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  }
});
