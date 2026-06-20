// tip-card 组件逻辑
Component({
  properties: {
    type: { type: String, value: 'action' },
    title: { type: String, value: '' },
    text: { type: String, value: '' },
    rationale: { type: String, value: '' },
    sourceType: { type: String, value: 'article' },
    sourceId: { type: Number, value: 0 },
    sourceTitle: { type: String, value: '' }
  },

  data: {
    whyExpanded: false
  },

  methods: {
    onToggleWhy() {
      this.setData({ whyExpanded: !this.data.whyExpanded });
    },

    onTapSource() {
      const { sourceType, sourceId, sourceTitle } = this.data;
      if (!sourceId) return;
      if (sourceType === 'article') {
        wx.navigateTo({
          url: `/pages/parenting/article-detail/article-detail?id=${sourceId}&title=${encodeURIComponent(sourceTitle || '')}`
        });
      }
    }
  }
});
