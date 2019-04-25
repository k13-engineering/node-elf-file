import constants from "./constants.mjs";
import assert from "assert";
import parser from "./parser.mjs";

const SegmentFlagsArray = {
  "decode": (val) => {
    return val;
  }
};

const SectionFlagsArray = {
  "decode": (val) => {
    let flags = [];
    Array.from({ "length": 32 }, (_, bit) => {
      if ((val & (1 << bit)) > 0) {
        flags = flags.concat([SectionFlag.decode(1 << bit)]);
      }
    });
    return flags;
  }
};

const elf64 = ({ endianness }) => {
  const FileHeader = parser.structure.create({
    "ei_magic": { "offset": 0x00, "size": 4, "endianness": "big" },
    "ei_class": { "offset": 0x04, "size": 1 },
    "ei_data": { "offset": 0x05, "size": 1 },
    "ei_osabi": { "offset": 0x06, "size": 1 },
    "ei_abiversion": { "offset": 0x06, "size": 1 },

    "e_osabi": { "offset": 0x07, "size": 1 },
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
    "p_flags": { "offset": 0x04, "size": 4, "codec": constants.SegmentFlagsArray },
    "p_offset": { "offset": 0x08, "size": 8 },
    "p_vaddr": { "offset": 0x10, "size": 8 },
    "p_paddr": { "offset": 0x18, "size": 8 },
    "p_filesz": { "offset": 0x20, "size": 8 },
    "p_memsz": { "offset": 0x28, "size": 8 },
    "p_align": { "offset": 0x30, "size": 8 },
  }, { endianness });

  const SectionHeaderEntry = parser.structure.create({
    "sh_name": { "offset": 0x00, "size": 4 },
    "sh_type": { "offset": 0x04, "size": 4, "codec": constants.SectionType },
    "sh_flags": { "offset": 0x08, "size": 8, "codec": constants.SectionFlagsArray },
    "sh_addr": { "offset": 0x10, "size": 8 },
    "sh_offset": { "offset": 0x18, "size": 8 },
    "sh_size": { "offset": 0x20, "size": 8 },
    "sh_link": { "offset": 0x28, "size": 4 },
    "sh_info": { "offset": 0x2C, "size": 4 },
    "sh_addralign": { "offset": 0x30, "size": 8 },
    "sh_entsize": { "offset": 0x38, "size": 8 }
  }, { endianness });

  return {
    FileHeader,
    ProgramHeaderEntry,
    SectionHeaderEntry
  };
};

const elf32 = ({ endianness }) => {
  const FileHeader = parser.structure.create({
    "ei_magic": { "offset": 0x00, "size": 4, "endianness": "big" },
    "ei_class": { "offset": 0x04, "size": 1 },
    "ei_data": { "offset": 0x05, "size": 1 },
    "ei_osabi": { "offset": 0x06, "size": 1 },
    "ei_abiversion": { "offset": 0x06, "size": 1 },

    "e_osabi": { "offset": 0x07, "size": 1 },
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
    "p_flags": { "offset": 0x18, "size": 4, "codec": constants.SegmentFlagsArray },
    "p_align": { "offset": 0x1C, "size": 4 },
  }, { endianness });

  const SectionHeaderEntry = parser.structure.create({
    "sh_name": { "offset": 0x00, "size": 4 },
    "sh_type": { "offset": 0x04, "size": 4, "codec": constants.SectionType },
    "sh_flags": { "offset": 0x08, "size": 4, "codec": constants.SectionFlagsArray },
    "sh_addr": { "offset": 0x0C, "size": 4 },
    "sh_offset": { "offset": 0x10, "size": 4 },
    "sh_size": { "offset": 0x14, "size": 4 },
    "sh_link": { "offset": 0x18, "size": 4 },
    "sh_info": { "offset": 0x1C, "size": 4 },
    "sh_addralign": { "offset": 0x20, "size": 4 },
    "sh_entsize": { "offset": 0x24, "size": 4 }
  }, { endianness });

  return {
    FileHeader,
    ProgramHeaderEntry,
    SectionHeaderEntry
  };
};

const create = ({ ei_class, ei_data }) => {
  let endianness = "unknown";
  if(ei_data === 1n) {
    endianness = "little";
  } else if(ei_data === 2n) {
    endianness = "big";
  } else {
    throw new Error("unsupported value for ei_data " + ei_data);
  }

  if([1n, 2n].indexOf(ei_class) < 0) {
    throw new Error("unsupported value for ei_class " + ei_class);
  }

  const {
    FileHeader,
    ProgramHeaderEntry,
    SectionHeaderEntry
  } = ei_class === 1n ? elf32({ endianness }) : elf64({ endianness });

  return {
    FileHeader,
    ProgramHeaderEntry,
    SectionHeaderEntry
  };
};

const structures = {
  create
};

export default structures;
