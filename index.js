/* eslint-disable no-global-assign */
require = require("esm")(module);
const elf = require("./lib/elf.js").default;

const elfFile = {
  "parse": elf.parse,
  "format": elf.format,
  "validate": elf.validate
};

module.exports = elfFile;
