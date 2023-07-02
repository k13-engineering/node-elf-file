import elf from "./elf.js";
import layouter from "./layout.js";
import analyzer from "./analyze/index.js";

const elfFile = {
  "parse": elf.parse,
  "format": elf.format,
  "validate": elf.validate,

  "layout": layouter.layout,
  "delayout": layouter.delayout,

  "analyze": analyzer.analyze,
  "generate": analyzer.generate
};

export default elfFile;
