import assert from "assert";
import strucureFactory from "./structures.js";
import parser from "./parser.js";
import junksFinder from "./junks.js";

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

const checkProgramHeader = ({ file, structure }) => {
  assert.equal(typeof file.e_phoff, "bigint", "e_phoff must be present and of type bigint");
  assert.equal(typeof file.e_phentsize, "bigint", "e_phentsize must be present and of type bigint");
  assert.equal(typeof file.e_phnum, "bigint", "e_phnum must be present and of type bigint");

  if (file.e_phnum > BigInt(0)) {
    assert(file.e_phentsize >= BigInt(structure.ProgramHeaderEntry.length), "e_phentsize may not be smaller than minimal structure");
    assert(file.e_phoff >= BigInt(structure.FileHeader.length), "program header must start after file header");
  }
};

const checkAndParseProgramHeader = ({ raw, file, structure }) => {
  checkProgramHeader({ file, structure });

  if (file.e_phnum > BigInt(0)) {
    assert(file.e_phoff + file.e_phentsize * file.e_phnum <= BigInt(raw.length), "program header needs to be contained inside of file");
  }

  const pht = raw.slice(Number(file.e_phoff), Number(file.e_phoff + file.e_phentsize * file.e_phnum));
  const entries = parser.table.create({
    "entryParser": structure.ProgramHeaderEntry,
    "entrySize": file.e_phentsize
  }).parse(pht);

  entries.forEach((entry) => {
    assert(entry.p_offset + entry.p_filesz <= BigInt(raw.length), "segement data needs to be contained inside of file");
  });

  return entries;
};

const checkSectionHeader = ({ file, structure }) => {
  assert.equal(typeof file.e_shoff, "bigint", "e_shoff must be present and of type bigint");
  assert.equal(typeof file.e_shentsize, "bigint", "e_shentsize must be present and of type bigint");
  assert.equal(typeof file.e_shnum, "bigint", "e_shnum must be present and of type bigint");

  if (file.e_shnum > BigInt(0)) {
    assert(file.e_shentsize >= BigInt(structure.SectionHeaderEntry.length), "e_shentsize may not be smaller than minimal structure");
    assert(file.e_shoff >= BigInt(structure.FileHeader.length), "section header must start after file header");
  }
};

const checkAndParseSectionHeader = ({ raw, file, structure }) => {
  checkSectionHeader({ file, structure });

  if (file.e_shnum > BigInt(0)) {
    assert(file.e_shoff + file.e_shentsize * file.e_shnum <= BigInt(raw.length), "section header needs to be contained inside of file");
  }

  const sht = raw.slice(Number(file.e_shoff), Number(file.e_shoff + file.e_shentsize * file.e_shnum));
  const entries = parser.table.create({
    "entryParser": structure.SectionHeaderEntry,
    "entrySize": file.e_shentsize
  }).parse(sht);

  entries.forEach((entry) => {
    assert(entry.sh_offset + entry.sh_size <= BigInt(raw.length), "section data needs to be contained inside of file");
  });

  return entries;
};

const parse = (raw) => {
  /* eslint-disable camelcase */
  const { ei_class, ei_data } = identify(raw);

  const structure = strucureFactory.create({ ei_class, ei_data });
  const file = structure.FileHeader.parse(raw);

  const programHeader = checkAndParseProgramHeader({ raw, file, structure });
  const sectionHeader = checkAndParseSectionHeader({ raw, file, structure });

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

const checkAndFormatFileHeader = ({ data, structure }) => {
  const fileHeader = structure.FileHeader.format(data.file);
  assert.equal(fileHeader.length, data.file.e_ehsize, "unexpected file header size");
  return fileHeader;
};

const checkAndFormatProgramHeader = ({ data, structure }) => {
  checkProgramHeader({ "file": data.file, structure });

  assert.equal(Number(data.file.e_phnum), data.segments.length, "e_phnum must correspond to segemnts array length");

  const programHeaderBin = parser.table.create({
    "entryParser": structure.ProgramHeaderEntry,
    "entrySize": data.file.e_phentsize
  }).format(data.segments);
  assert.equal(programHeaderBin.length, data.file.e_phentsize * data.file.e_phnum, "unexpected program header size");

  return programHeaderBin;
};

const checkAndFormatSectionHeader = ({ data, structure }) => {
  checkSectionHeader({ "file": data.file, structure });

  assert.equal(Number(data.file.e_shnum), data.sections.length, "e_shnum must correspond to sections array length");

  const sectionHeaderBin = parser.table.create({
    "entryParser": structure.SectionHeaderEntry,
    "entrySize": data.file.e_shentsize
  }).format(data.sections);
  assert.equal(sectionHeaderBin.length, data.file.e_shentsize * data.file.e_shnum, "unexpected section header size");

  return sectionHeaderBin;
};

const arrangeJunksAndHeaders = ({ data, fileHeader, programHeader, sectionHeader }) => {
  let total = 0;
  total = Math.max(fileHeader.length, Number(data.file.e_phoff) + programHeader.length, Number(data.file.e_shoff) + sectionHeader.length);
  data.junks.forEach((junk) => {
    total = Math.max(total, Number(junk.address + junk.size));
  });

  const result = Buffer.alloc(total);
  data.junks.forEach((junk) => {
    junk.data.copy(result, Number(junk.address));
  });
  fileHeader.copy(result, 0);
  programHeader.copy(result, Number(data.file.e_phoff));
  sectionHeader.copy(result, Number(data.file.e_shoff));

  return result;
};

const format = (data) => {
  const structure = strucureFactory.create({ "ei_class": data.file.ei_class, "ei_data": data.file.ei_data });

  const fileHeader = checkAndFormatFileHeader({ data, structure });
  const programHeader = checkAndFormatProgramHeader({ data, structure });
  const sectionHeader = checkAndFormatSectionHeader({ data, structure });

  return arrangeJunksAndHeaders({ data, fileHeader, programHeader, sectionHeader });
};

const elf = {
  parse,
  format
};

export default elf;
