const path = require("path");
const fs = require("fs");

const readFileData = (name) => {
  const data = fs.readFileSync(path.resolve(__dirname, "assets", name));
  return { name, data };
};

const x86_64 = [
  "elf64-le-x86_64/compiled-pic.o",
  "elf64-le-x86_64/compiled.o",
  "elf64-le-x86_64/dynamic.elf",
  "elf64-le-x86_64/shared.so",
  "elf64-le-x86_64/static.elf"
].map((name) => readFileData(name));

const ppc = [
  "elf32-be-ppc/compiled-pic.o",
  "elf32-be-ppc/compiled.o",
  "elf32-be-ppc/dynamic.elf",
  "elf32-be-ppc/shared.so",
  "elf32-be-ppc/static.elf"
].map((name) => readFileData(name));

const x86 = [
  "elf32-le-x86/compiled-pic.o",
  "elf32-le-x86/compiled.o",
  "elf32-le-x86/dynamic.elf",
  "elf32-le-x86/shared.so",
  "elf32-le-x86/static.elf"
].map((name) => readFileData(name));

const arm = [
  "elf32-le-arm/compiled-pic.o",
  "elf32-le-arm/compiled.o",
  "elf32-le-arm/dynamic.elf",
  "elf32-le-arm/shared.so",
  "elf32-le-arm/static.elf"
].map((name) => readFileData(name));

const elf32 = [
  ...ppc,
  ...x86,
  ...arm
];

const elf64 = [
  ...x86_64
];

const littleEndian = [
  ...x86_64,
  ...x86,
  ...arm
];

const bigEndian = [
  ...ppc
];

const all = [
  ...elf32,
  ...elf64
];

const load = (name) => readFileData(name);

module.exports = {
  elf32,
  elf64,
  littleEndian,
  bigEndian,
  all,
  load
};
