var encouragementUtils = require('../../utils/encouragement.js');

Component({
  properties: {
    visible: { type: Boolean, value: false },
    message: { type: String, value: '' },
    level: { type: Number, value: 1 }
  },

  data: {
    _levelClass: ''
  },

  observers: {
    'level': function(val) {
      var cls = encouragementUtils.getEncouragementLevelClass(val);
      this.setData({ _levelClass: cls });
    }
  },

  methods: {
    onConfirm: function() {
      this.triggerEvent('confirm');
    },

    onCancel: function() {
      this.triggerEvent('cancel');
    },

    onMaskTap: function() {
      this.triggerEvent('cancel');
    },

    preventBubble: function() {}
  }
});
