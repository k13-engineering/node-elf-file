const converter = {
  "create": (name, types) => {
    let encoded = {};
    let decoded = types;

    Object.keys(types).forEach((key) => {
      encoded[decoded[key]] = key;
    });

    const assure = (val, msg, def) => {
      if (val === undefined) {
        if (def !== undefined) {
          // console.warn(msg, `falling back to ${def}`);
          return def;
        }

        throw new Error(msg);
      }
      return val;
    };

    return {
      "decode": (num, def) => assure(encoded[num], `could not decode ${name} ${num}`, def),
      "encode": (type, def) => parseInt(assure(decoded[type], `could not encode ${name} ${type}`, def), 10)
    };
  }
};

const Endianness = converter.create("endianness", {
  "little": 1,
  "big": 2
});

const FileType = converter.create("file type", {
  "ET_NONE": 0x00,
  "ET_REL": 0x01,
  "ET_EXEC": 0x02,
  "ET_DYN": 0x03,
  "ET_CORE": 0x04,
  "ET_LOOS": 0xFE00,
  "ET_HIOS": 0xFEFF,
  "ET_LOPROC": 0xFF00,
  "ET_HIPROC": 0xFFFF
});

const MachineType = converter.create("machine type", {
  "N/A": 0x00,
  "SPARC": 0x02,
  "x86": 0x03,
  "MIPS": 0x08,
  "PowerPC": 0x14,
  "S390": 0x16,
  "ARM": 0x28,
  "SuperH": 0x2A,
  "IA-64": 0x32,
  "x86-64": 0x3E,
  "AArch64": 0xB7,
  "RISC-V": 0xF3
});

const SectionType = converter.create("section type", {
  "SHT_NULL": 0x00,
  "SHT_PROGBITS": 0x01,
  "SHT_SYMTAB": 0x02,
  "SHT_STRTAB": 0x03,
  "SHT_RELA": 0x04,
  "SHT_HASH": 0x05,
  "SHT_DYNAMIC": 0x06,
  "SHT_NOTE": 0x07,
  "SHT_NOBITS": 0x08,
  "SHT_REL": 0x09,
  "SHT_SHLIB": 0x0A,
  "SHT_DYNSYM": 0x0B,
  "SHT_INIT_ARRAY": 0x0E,
  "SHT_FINI_ARRAY": 0x0F,
  "SHT_PREINIT_ARRAY ": 0x10,
  "SHT_GROUP": 0x11,
  "SHT_SYMTAB_SHNDX": 0x12,
  "SHT_NUM": 0x13,
  "SHT_LOOS": 0x60000000
});

const SectionFlag = converter.create("section flag", {
  "SHF_WRITE": 0x01,
  "SHF_ALLOC": 0x02,
  "SHF_EXECINSTR": 0x04,
  "SHF_MERGE": 0x10,
  "SHF_STRINGS": 0x20,
  "SHF_INFO_LINK": 0x40,
  "SHF_LINK_ORDER": 0x80,
  "SHF_OS_NONCONFORMING": 0x100,
  "SHF_GROUP": 0x200,
  "SHF_TLS": 0x400,
  "SHF_MASKOS": 0x0ff00000,
  "SHF_MASKPROC": 0xf0000000,
  "SHF_ORDERED": 0x4000000,
  "SHF_EXCLUDE": 0x8000000
});

const SegmentType = converter.create("segment type", {
  "PT_NULL": 0x00,
  "PT_LOAD": 0x01,
  "PT_DYNAMIC": 0x02,
  "PT_INTERP": 0x03,
  "PT_NOTE": 0x04,
  "PT_SHLIB": 0x05,
  "PT_PHDR": 0x06,
  "PT_LOOS": 0x60000000,
  "PT_HIOS": 0x6FFFFFFF,
  "PT_LOPROC": 0x70000000,
  "PT_HIPROC": 0x7FFFFFFF
});

const constants = {
  Endianness,
  FileType,
  MachineType,
  SectionType,
  SectionFlag,
  SegmentType
};

export default constants;
