import constants from "./constants.js";
import parser from "./parser.js";

const elf64 = ({ endianness }) => {
  const FileHeader = parser.structure.create({
    "ei_magic": { "offset": 0x00, "size": 4, "endianness": "big" },
    "ei_class": { "offset": 0x04, "size": 1 },
    "ei_data": { "offset": 0x05, "size": 1 },
    "ei_version": { "offset": 0x06, "size": 1 },
    "ei_osabi": { "offset": 0x07, "size": 1 },
    "ei_abiversion": { "offset": 0x08, "size": 1 },

    "e_type": { "offset": 0x10, "size": 2, "codec": constants.FileType },
    "e_machine": { "offset": 0x12, "size": 2, "codec": constants.MachineType },
    "e_version": { "offset": 0x14, "size": 4 },
    "e_entry": { "offset": 0x18, "size": 8 },
    "e_phoff": { "offset": 0x20, "size": 8 },
    "e_shoff": { "offset": 0x28, "size": 8 },
    "e_flags": { "offset": 0x30, "size": 4 },
    "e_ehsize": { "offset": 0x34, "size": 2 },
    "e_phentsize": { "offset": 0x36, "size": 2 },
    "e_phnum": { "offset": 0x38, "size": 2 },
    "e_shentsize": { "offset": 0x3A, "size": 2 },
    "e_shnum": { "offset": 0x3C, "size": 2 },
    "e_shstrndx": { "offset": 0x3E, "size": 2 }
  }, { endianness });

  const ProgramHeaderEntry = parser.structure.create({
    "p_type": { "offset": 0x00, "size": 4, "codec": constants.SegmentType },
    "p_flags": { "offset": 0x04, "size": 4, "codec": constants.BitfieldCodec({}) },
    "p_offset": { "offset": 0x08, "size": 8 },
    "p_vaddr": { "offset": 0x10, "size": 8 },
    "p_paddr": { "offset": 0x18, "size": 8 },
    "p_filesz": { "offset": 0x20, "size": 8 },
    "p_memsz": { "offset": 0x28, "size": 8 },
    "p_align": { "offset": 0x30, "size": 8 }
  }, { endianness });

  const SectionHeaderEntry = parser.structure.create({
    "sh_name": { "offset": 0x00, "size": 4 },
    "sh_type": { "offset": 0x04, "size": 4, "codec": constants.SectionType },
    "sh_flags": { "offset": 0x08, "size": 8, "codec": constants.BitfieldCodec({ "entryCodec": constants.SectionFlag }) },
    "sh_addr": { "offset": 0x10, "size": 8 },
    "sh_offset": { "offset": 0x18, "size": 8 },
    "sh_size": { "offset": 0x20, "size": 8 },
    "sh_link": { "offset": 0x28, "size": 4 },
    "sh_info": { "offset": 0x2C, "size": 4 },
    "sh_addralign": { "offset": 0x30, "size": 8 },
    "sh_entsize": { "offset": 0x38, "size": 8 }
  }, { endianness });

  const SymbolTableEntry = parser.structure.create({
    "st_name": { "offset": 0x00, "size": 4 },
    "st_info": { "offset": 0x04, "size": 1 },
    "st_other": { "offset": 0x05, "size": 1 },
    "st_shndx": { "offset": 0x06, "size": 2 },
    "st_value": { "offset": 0x08, "size": 8 },
    "st_size": { "offset": 0x10, "size": 8 }
  }, { endianness });

  return {
    FileHeader,
    ProgramHeaderEntry,
    SectionHeaderEntry,
    SymbolTableEntry
  };
};

const elf32 = ({ endianness }) => {
  const FileHeader = parser.structure.create({
    "ei_magic": { "offset": 0x00, "size": 4, "endianness": "big" },
    "ei_class": { "offset": 0x04, "size": 1 },
    "ei_data": { "offset": 0x05, "size": 1 },
    "ei_version": { "offset": 0x06, "size": 1 },
    "ei_osabi": { "offset": 0x07, "size": 1 },
    "ei_abiversion": { "offset": 0x08, "size": 1 },

    "e_type": { "offset": 0x10, "size": 2, "codec": constants.FileType },
    "e_machine": { "offset": 0x12, "size": 2, "codec": constants.MachineType },
    "e_version": { "offset": 0x14, "size": 4 },
    "e_entry": { "offset": 0x18, "size": 4 },
    "e_phoff": { "offset": 0x1C, "size": 4 },
    "e_shoff": { "offset": 0x20, "size": 4 },
    "e_flags": { "offset": 0x24, "size": 4 },
    "e_ehsize": { "offset": 0x28, "size": 2 },
    "e_phentsize": { "offset": 0x2A, "size": 2 },
    "e_phnum": { "offset": 0x2C, "size": 2 },
    "e_shentsize": { "offset": 0x2E, "size": 2 },
    "e_shnum": { "offset": 0x30, "size": 2 },
    "e_shstrndx": { "offset": 0x32, "size": 2 }
  }, { endianness });

  const ProgramHeaderEntry = parser.structure.create({
    "p_type": { "offset": 0x00, "size": 4, "codec": constants.SegmentType },
    "p_offset": { "offset": 0x04, "size": 4 },
    "p_vaddr": { "offset": 0x08, "size": 4 },
    "p_paddr": { "offset": 0x0C, "size": 4 },
    "p_filesz": { "offset": 0x10, "size": 4 },
    "p_memsz": { "offset": 0x14, "size": 4 },
    "p_flags": { "offset": 0x18, "size": 4, "codec": constants.BitfieldCodec({}) },
    "p_align": { "offset": 0x1C, "size": 4 }
  }, { endianness });

  const SectionHeaderEntry = parser.structure.create({
    "sh_name": { "offset": 0x00, "size": 4 },
    "sh_type": { "offset": 0x04, "size": 4, "codec": constants.SectionType },
    "sh_flags": { "offset": 0x08, "size": 4, "codec": constants.BitfieldCodec({ "entryCodec": constants.SectionFlag }) },
    "sh_addr": { "offset": 0x0C, "size": 4 },
    "sh_offset": { "offset": 0x10, "size": 4 },
    "sh_size": { "offset": 0x14, "size": 4 },
    "sh_link": { "offset": 0x18, "size": 4 },
    "sh_info": { "offset": 0x1C, "size": 4 },
    "sh_addralign": { "offset": 0x20, "size": 4 },
    "sh_entsize": { "offset": 0x24, "size": 4 }
  }, { endianness });

  const SymbolTableEntry = parser.structure.create({
    "st_name": { "offset": 0x00, "size": 4 },
    "st_value": { "offset": 0x04, "size": 4 },
    "st_size": { "offset": 0x08, "size": 4 },
    "st_info": { "offset": 0x0C, "size": 1 },
    "st_other": { "offset": 0x0D, "size": 1 },
    "st_shndx": { "offset": 0x0E, "size": 2 }
  }, { endianness });

  return {
    FileHeader,
    ProgramHeaderEntry,
    SectionHeaderEntry,
    SymbolTableEntry
  };
};

/* eslint-disable camelcase */
const create = ({ ei_class, ei_data }) => {
  let endianness = "unknown";
  if (ei_data === BigInt(1)) {
    endianness = "little";
  } else if (ei_data === BigInt(2)) {
    endianness = "big";
  } else {
    throw new Error("unsupported value for ei_data " + ei_data);
  }

  if ([BigInt(1), BigInt(2)].indexOf(ei_class) < 0) {
    throw new Error("unsupported value for ei_class " + ei_class);
  }

  const {
    FileHeader,
    ProgramHeaderEntry,
    SectionHeaderEntry,
    SymbolTableEntry
  } = ei_class === BigInt(1) ? elf32({ endianness }) : elf64({ endianness });

  return {
    FileHeader,
    ProgramHeaderEntry,
    SectionHeaderEntry,
    SymbolTableEntry
  };
};

const structures = {
  create
};

export default structures;
