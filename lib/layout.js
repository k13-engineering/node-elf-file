/* eslint-disable camelcase */
import assert from "assert";
import structureFactory from "./structures.js";

const prepareFileHeader = ({ data, structure }) => {
  let e_ehsize = data.file.e_ehsize || BigInt(structure.FileHeader.length);
  assert(e_ehsize >= BigInt(structure.FileHeader.length), "e_ehsize must not be smaller than minimal header size");

  return {
    e_ehsize
  };
};

const prepareProgramHeader = ({ data, structure }) => {
  let e_phentsize = data.file.e_phentsize || BigInt(structure.ProgramHeaderEntry.length);
  let e_phnum = data.file.e_phnum || BigInt(data.segments.length);

  assert(e_phentsize >= BigInt(structure.ProgramHeaderEntry.length), "e_phentsize must no be smaller than minimal entry size");
  assert(e_phnum === BigInt(data.segments.length), "e_phnum if given must match segments array length");

  return {
    e_phentsize,
    e_phnum
  };
};

const prepareSectionHeader = ({ data, structure }) => {
  let e_shentsize = data.file.e_shentsize || BigInt(structure.SectionHeaderEntry.length);
  let e_shnum = data.file.e_shnum || BigInt(data.sections.length);

  assert(e_shentsize >= BigInt(structure.ProgramHeaderEntry.length), "e_shentsize must no be smaller than minimal entry size");
  assert(e_shnum === BigInt(data.sections.length), "e_shnum if given must match sections array length");

  return {
    e_shentsize,
    e_shnum
  };
};

const copyExcluding = (data, excludes) => {
  let result = {};
  Object.keys(data).filter((key) => excludes.indexOf(key) < 0).forEach((key) => {
    result = Object.assign(result, {
      [key]: data[key]
    });
  });
  return result;
};

const delayout = (data) => {
  const file = copyExcluding(data.file, [
    "e_ehsize",

    "e_phoff",
    "e_phentsize",
    "e_phnum",

    "e_shoff",
    "e_shentsize",
    "e_shnum"
  ]);

  const segments = data.segments.map((segment) => copyExcluding(segment, [
    "p_offset"
  ]));

  const sections = data.sections.map((section) => copyExcluding(section, [
    "sh_offset"
  ]));

  const junks = data.junks.map((junk) => copyExcluding(junk, [
    "address"
  ]));

  return {
    file,
    segments,
    sections,
    junks
  };
};

// phentsize may be set! phnum may not contradict
const layout = (data) => {
  const structure = structureFactory.create({ "ei_class": data.file.ei_class, "ei_data": data.file.ei_data });

  const { e_ehsize } = prepareFileHeader({ data, structure });
  const { e_phentsize, e_phnum } = prepareProgramHeader({ data, structure });
  const { e_shentsize, e_shnum } = prepareSectionHeader({ data, structure });

  const e_phoff = e_ehsize;
  const e_shoff = e_ehsize + e_phentsize * e_phnum;

  const file = Object.assign({}, data.file, {
    e_ehsize,
    e_phoff,
    e_phentsize,
    e_phnum,
    e_shoff,
    e_shentsize,
    e_shnum
  });

  let offset = e_shoff + e_shentsize * e_shnum;

  const junks = data.junks.map((junk) => {
    const result = {
      "address": offset,
      "size": junk.size,
      "data": junk.data.slice(0)
    };

    offset += BigInt(junk.data.length);

    return result;
  });

  const resolveOffset = (s) => {
    if (s.junk_idx !== undefined) {
      const junk = junks[s.junk_idx];
      assert(!!junk, "referenced junk not available");
      return junk.address + s.junk_offset;
    } else {
      return BigInt(0);
    }
  };

  const segments = data.segments.map((segment) => {
    return Object.assign({}, segment, {
      "p_offset": resolveOffset(segment)
    });
  });

  const sections = data.sections.map((section) => {
    return Object.assign({}, section, {
      "sh_offset": resolveOffset(section)
    });
  });

  return {
    file,
    segments,
    sections,
    junks
  };
};

const xy = {
  layout,
  delayout
};

export default xy;
