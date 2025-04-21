// components/empty-state/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    text: {
      type: String,
      value: '暂无数据'
    },
    image: {
      type: String,
      value: '../../images/default-goods-image.png'
    },
    buttonText: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onTapButton() {
      this.triggerEvent('buttonTap');
    }
  }
})
