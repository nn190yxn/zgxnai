Component({
  properties: { items: { type: Array, value: [] } },
  data: { failed: {} },
  methods: {
    onError: function(e) {
      var index = e.currentTarget.dataset.index;
      var failed = Object.assign({}, this.data.failed);
      failed[index] = true;
      this.setData({ failed: failed });
    },
    preview: function(e) {
      var index = Number(e.currentTarget.dataset.index || 0);
      var urls = (this.data.items || []).map(function(item) { return item.url || item.image || ''; }).filter(Boolean);
      if (!urls.length || !wx.previewImage) return;
      wx.previewImage({ current: urls[index] || urls[0], urls: urls });
    }
  }
});
