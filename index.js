/* eslint-disable no-global-assign */
require = require("esm")(module);
const elf = require("./lib/elf.js").default;
const layouter = require("./lib/layout.js").default;
const analyzer = require("./lib/analyze/index.js").default;

const elfFile = {
  "parse": elf.parse,
  "format": elf.format,
  "validate": elf.validate,

  "layout": layouter.layout,
  "delayout": layouter.delayout,

  "analyze": analyzer.analyze,
  "generate": analyzer.generate
};

module.exports = elfFile;
