"use strict";

// This is a custom Jest transformer turning style imports into empty objects.
// http://facebook.github.io/jest/docs/en/webpack.html

module.exports = {
  process: function (src, filename) {
    const processedCode = "module.exports = {};"; // Your transformation logic
    return { code: processedCode };
  },
  /*process() {
    return 'module.exports = {};';
  },*/
  getCacheKey() {
    // The output is always the same.
    return "cssTransform";
  },
};
