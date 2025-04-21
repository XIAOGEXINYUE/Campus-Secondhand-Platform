// components/filter-bar/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    filters: {
      type: Array,
      value: []
    },
    activeFilters: {
      type: Object,
      value: {}
    },
    sortOptions: {
      type: Array,
      value: [
        { id: 'time_desc', name: '最新发布' },
        { id: 'price_asc', name: '价格升序' },
        { id: 'price_desc', name: '价格降序' }
      ]
    },
    activeSort: {
      type: String,
      value: 'time_desc'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    showFilterPanel: false,
    showSortPanel: false,
    tempFilters: {},
    currentSortId: 'time_desc'
  },

  /**
   * 数据监听器
   */
  observers: {
    'activeFilters': function(activeFilters) {
      this.setData({
        tempFilters: JSON.parse(JSON.stringify(activeFilters))
      });
    },
    'activeSort': function(activeSort) {
      this.setData({
        currentSortId: activeSort
      });
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 切换筛选面板
    toggleFilterPanel: function() {
      const showFilterPanel = !this.data.showFilterPanel;
      
      this.setData({
        showFilterPanel,
        showSortPanel: false,
        tempFilters: JSON.parse(JSON.stringify(this.properties.activeFilters))
      });
    },
    
    // 切换排序面板
    toggleSortPanel: function() {
      const showSortPanel = !this.data.showSortPanel;
      
      this.setData({
        showSortPanel,
        showFilterPanel: false
      });
    },
    
    // 选择筛选选项
    selectFilterOption: function(e) {
      const { filterId, optionId } = e.currentTarget.dataset;
      const tempFilters = this.data.tempFilters;
      
      // 如果已经选中，则取消选中
      if (tempFilters[filterId] === optionId) {
        delete tempFilters[filterId];
      } else {
        tempFilters[filterId] = optionId;
      }
      
      this.setData({
        tempFilters
      });
    },
    
    // 重置筛选
    resetFilters: function() {
      this.setData({
        tempFilters: {}
      });
    },
    
    // 应用筛选
    applyFilters: function() {
      this.triggerEvent('filter', {
        filters: this.data.tempFilters
      });
      
      this.setData({
        showFilterPanel: false
      });
    },
    
    // 选择排序方式
    selectSort: function(e) {
      const sortId = e.currentTarget.dataset.id;
      
      this.setData({
        currentSortId: sortId,
        showSortPanel: false
      });
      
      this.triggerEvent('sort', { sortId });
    },
    
    // 关闭面板
    closePanel: function() {
      this.setData({
        showFilterPanel: false,
        showSortPanel: false
      });
    }
  }
})
