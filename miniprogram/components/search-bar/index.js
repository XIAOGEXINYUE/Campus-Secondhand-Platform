// components/search-bar/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    placeholder: {
      type: String,
      value: '搜索二手教材'
    },
    value: {
      type: String,
      value: ''
    },
    focus: {
      type: Boolean,
      value: false
    },
    showCancel: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    inputValue: ''
  },

  /**
   * 数据监听器
   */
  observers: {
    'value': function(value) {
      this.setData({
        inputValue: value
      });
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 输入框内容变化
    onInput: function(e) {
      const value = e.detail.value;
      this.setData({
        inputValue: value
      });
      
      // 触发输入事件
      this.triggerEvent('input', { value });
    },
    
    // 点击搜索按钮
    onSearch: function() {
      const value = this.data.inputValue;
      
      // 触发搜索事件
      this.triggerEvent('search', { value });
    },
    
    // 点击取消按钮
    onCancel: function() {
      this.setData({
        inputValue: ''
      });
      
      // 触发取消事件
      this.triggerEvent('cancel');
    },
    
    // 点击搜索框
    onTap: function() {
      // 触发点击事件
      this.triggerEvent('tap');
    },
    
    // 清除输入
    onClear: function() {
      this.setData({
        inputValue: ''
      });
      
      // 触发清除事件
      this.triggerEvent('clear');
    }
  }
})
