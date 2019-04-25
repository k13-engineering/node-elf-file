import elf from "./lib/elf.mjs";

const elfFile = {
  "parse": elf.parse,
  "format": elf.format
};

export default elfFile;
