import elf from "../index.js";
import fs from "fs";

const padRight = (str, char, len) => {
  let result = str.toString();
  while (result.length < len) {
    result = char + result;
  }
  return result;
};

const padLeft = (str, char, len) => {
  let result = str.toString();
  while (result.length < len) {
    result = result + char;
  }
  return result;
};

const columnLeft = (str, len) => {
  return padLeft(str, " ", len);
};

const column = (str, len) => {
  return padRight(str, " ", len);
};

const address = (a) => {
  return padRight(a.toString(16), "0", 16);
};

const resolveType = (symType) => {
  if (typeof symType === "string" && symType.startsWith("STT_")) {
    return symType.substr("STT_".length);
  } else {
    return symType;
  }
};

const resolveBind = (symBind) => {
  if (typeof symBind === "string" && symBind.startsWith("STB_")) {
    return symBind.substr("STB_".length);
  } else {
    return symBind;
  }
};

const resolveVisibility = (symVisibility) => {
  if (typeof symVisibility === "string" && symVisibility.startsWith("STV_")) {
    return symVisibility.substr("STV_".length);
  } else {
    return symVisibility;
  }
};

const printSymbolTable = (table) => {
  table.symbols.forEach((sym, idx) => {
    console.log(`${column(idx, 6)}: ${address(sym.value)} ${column(sym.size, 5)} ${columnLeft(resolveType(sym.type), 7)} ${columnLeft(resolveBind(sym.bind), 6)} ${columnLeft(resolveVisibility(sym.visibility), 8)} ${column(sym.shndx, 3)} ${sym.name}`);
  });
};

process.nextTick(async () => {
  try {
    const raw = await fs.promises.readFile("./test/assets/elf64-le-x86_64/static.elf");
    const data = elf.parse(raw);
    const analyzed = elf.analyze(data);

    printSymbolTable(analyzed.sections[".symtab"]);
  } catch (ex) {
    console.error(ex);
  }
});
