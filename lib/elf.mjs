import assert from "assert";
import strucureFactory from "./structures.mjs";
import parser from "./parser.mjs";
import junksFinder from "./junks.mjs";

const identify = (raw) => {
  const magic = raw.readUInt32BE(0x00);
  if (magic !== 0x7F454C46) {
    throw new Error("invalid ELF magic, not an ELF file");
  }

  return {
    "ei_class": BigInt(raw.readUInt8(0x04)),
    "ei_data": BigInt(raw.readUInt8(0x05))
  };
};

const parse = (raw) => {
  /* eslint-disable camelcase */
  const { ei_class, ei_data } = identify(raw);

  const structure = strucureFactory.create({ ei_class, ei_data });
  const file = structure.FileHeader.parse(raw);

  const pht = raw.slice(Number(file.e_phoff), Number(file.e_phoff + file.e_phentsize * file.e_phnum));
  const programHeader = parser.table.create({
    "entryParser": structure.ProgramHeaderEntry,
    "entrySize": file.e_phentsize
  }).parse(pht);

  const sht = raw.slice(Number(file.e_shoff), Number(file.e_shoff + file.e_shentsize * file.e_shnum));
  const sectionHeader = parser.table.create({
    "entryParser": structure.SectionHeaderEntry,
    "entrySize": file.e_shentsize
  }).parse(sht);

  const finder = junksFinder.finder({ "data": raw });

  [].concat(
    programHeader.filter((segment) => segment.p_filesz > 0).map((segment) => {
      return { "offset": segment.p_offset, "size": segment.p_filesz };
    }),
    sectionHeader.filter((section) => section.sh_size > 0 && section.sh_type !== "SHT_NOBITS").map((section) => {
      return { "offset": section.sh_offset, "size": section.sh_size };
    })
  ).forEach((j) => finder.process(j.offset, j.size));

  const junks = finder.junks();

  const segments = programHeader.map((segment) => {
    const junkIdx = junks.findIndex((junk) => {
      return junk.address <= segment.p_offset && (junk.address + junk.size) > segment.p_offset;
    });

    let result = segment;

    if (junkIdx >= 0) {
      result = Object.assign({}, segment, {
        "junk_idx": BigInt(junkIdx),
        "junk_offset": segment.p_offset - junks[junkIdx].address
      });
    }

    return result;
  });

  const sections = sectionHeader.map((section) => {
    const junkIdx = junks.findIndex((junk) => {
      return junk.address <= section.sh_offset && (junk.address + junk.size) > section.sh_offset;
    });

    let result = section;

    if (junkIdx >= 0) {
      result = Object.assign({}, section, {
        "junk_idx": BigInt(junkIdx),
        "junk_offset": section.sh_offset - junks[junkIdx].address
      });
    }

    return result;
  });

  return {
    file,
    segments,
    sections,
    junks
  };
};

const format = (data) => {
  const structure = strucureFactory.create(data.file);

  const fileHeaderBin = structure.FileHeader.format(data.file);
  assert.equal(fileHeaderBin.length, data.file.e_ehsize, "unexpected file header size");

  const programHeaderBin = parser.table.create({
    "entryParser": structure.ProgramHeaderEntry,
    "entrySize": data.file.e_phentsize
  }).format(data.segments);
  assert.equal(programHeaderBin.length, data.file.e_phentsize * data.file.e_phnum, "unexpected program header size");

  const sectionHeaderBin = parser.table.create({
    "entryParser": structure.SectionHeaderEntry,
    "entrySize": data.file.e_shentsize
  }).format(data.sections);
  assert.equal(sectionHeaderBin.length, data.file.e_shentsize * data.file.e_shnum, "unexpected section header size");

  let total = 0;
  total = Math.max(fileHeaderBin.length, Number(data.file.e_phoff) + programHeaderBin.length, Number(data.file.e_shoff) + sectionHeaderBin.length);
  data.junks.forEach((junk) => {
    total = Math.max(total, Number(junk.address + junk.size));
  });

  const result = Buffer.alloc(total);
  data.junks.forEach((junk) => {
    junk.data.copy(result, Number(junk.address));
  });
  fileHeaderBin.copy(result, 0);
  programHeaderBin.copy(result, Number(data.file.e_phoff));
  sectionHeaderBin.copy(result, Number(data.file.e_shoff));

  return result;
};

const elf64 = {
  parse,
  format
};

export default elf64;
