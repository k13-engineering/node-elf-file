require = require("esm")(module);
const elf = require("./lib/elf.js").default;

const elfFile = {
  "parse": elf.parse,
  "format": elf.format
};

module.exports = elfFile;
