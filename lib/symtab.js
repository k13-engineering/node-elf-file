/* eslint-disable camelcase */

import parser from "./parser.js";
import constants from "./constants.js";

const parse = ({ header, chunk, structure }) => {
  const p = parser.table.create({
    "entryParser": structure.SymbolTableEntry,
    "entrySize": BigInt(structure.SymbolTableEntry.length)
  });

  const buf = chunk.data.slice(Number(header.chunk_offset), Number(header.chunk_offset + header.sh_size));

  return p.parse(buf).map((sym) => {
    const st_bind = sym.st_info >> BigInt(4);
    const st_type = sym.st_info & BigInt(0x0F);
    const st_visibility = sym.st_other & BigInt(0x03);

    return {
      "st_name": sym.st_name,
      "st_value": sym.st_value,
      "st_size": sym.st_size,
      "st_bind": constants.SymbolBinding.decode(st_bind),
      "st_type": constants.SymbolType.decode(st_type),
      "st_visibility": constants.SymbolVisibility.decode(st_visibility),
      "st_shndx": sym.st_shndx
    };
  });
};

const format = ({ data, structure }) => {
  const p = parser.table.create({
    "entryParser": structure.SymbolTableEntry,
    "entrySize": BigInt(structure.SymbolTableEntry.length)
  });

  const raw = p.format(data.map((sym) => {
    const st_bind = constants.SymbolBinding.encode(sym.st_bind);
    const st_type = constants.SymbolType.encode(sym.st_type);
    const st_visibility = constants.SymbolVisibility.encode(sym.st_visibility);

    return {
      "st_name": sym.st_name,
      "st_value": sym.st_value,
      "st_size": sym.st_size,
      "st_info": st_bind << BigInt(4) | st_type,
      "st_other": st_visibility,
      "st_shndx": sym.st_shndx
    };
  }));

  const chunk = {
    "size": BigInt(raw.length),
    "data": raw
  };

  const header = {
    "sh_type": "SHT_SYMTAB",
    "sh_flags": [],
    "sh_addr": BigInt(0),
    "sh_size": chunk.size,
    "sh_entsize": BigInt(structure.SymbolTableEntry.length),
  };

  return {
    header,
    chunk
  };
};

const symtab = {
  parse,
  format
};

export default symtab;
