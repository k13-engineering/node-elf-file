/* eslint-disable camelcase */

import assert from "assert";
import util from "../util.js";
import strtab from "../strtab.js";
import symtab from "../symtab.js";

const analyzeSection = ({ section, sectionStrings, data }) => {
  const name = strtab.string(sectionStrings, section.sh_name);

  assert(section.sh_link >= BigInt(0) && section.sh_link < BigInt(data.sections.length), `linked section sh_link ${section.sh_link} in range`);
  const linkedSection = data.sections[section.sh_link];

  const header = {
    "type": section.sh_type,
    "flags": section.sh_flags,
    "address": section.sh_addr,
    "size": section.sh_size,
    "link": strtab.string(sectionStrings, linkedSection.sh_name),
    "info": section.sh_info,
    "align": section.sh_addralign,
    "entsize": section.sh_entsize
  };

  return {
    name,
    header
  };
};

const analyzeSectionStringTable = ({ data }) => {
  assert(data.file.e_shstrndx >= BigInt(0) && data.file.e_shstrndx <= BigInt(data.sections.length), `e_shstrndx ${data.file.e_shstrndx} in range`);
  const shstr = data.sections[data.file.e_shstrndx];
  const sectionStrings = strtab.parse({ "header": shstr, "chunk": data.chunks[shstr.chunk_idx] });

  const remaining = data.sections.filter((section) => section !== shstr);

  return {
    sectionStrings,
    remaining
  };
};

const match = (arr, fn) => {
  let matched = [];
  let remaining = [];

  arr.forEach((entry) => {
    if (fn(entry)) {
      matched = [].concat(matched, [ entry ]);
    } else {
      remaining = [].concat(remaining, [ entry ]);
    }
  });

  return {
    matched,
    remaining
  };
};

const analyzeSymbolTables = ({ sections, sectionStrings, data, structure }) => {
  const { matched, remaining } = match(sections, (section) => section.sh_type === "SHT_SYMTAB");

  let slaveSections = [];

  let symbolTables = {};
  matched.forEach((section) => {
    const { name, header } = analyzeSection({ section, sectionStrings, data });

    const symbolStringSection = data.sections[section.sh_link];
    slaveSections = [].concat(slaveSections, [ symbolStringSection ]);

    const symbolStrings = strtab.parse({ "header": symbolStringSection, "chunk": data.chunks[symbolStringSection.chunk_idx] });

    const symbols = symtab.parse({ "header": section, "chunk": data.chunks[section.chunk_idx], structure }).map((sym) => {
      return {
        "name": strtab.string(symbolStrings, sym.st_name),
        "value": sym.st_value,
        "size": sym.st_size,
        "bind": sym.st_bind,
        "type": sym.st_type,
        "visibility": sym.st_visibility,
        "shndx": sym.st_shndx
      };
    });

    const analyzed = {
      "type": header.type,
      "flags": header.flags,
      "address": header.address,
      "size": header.size,
      "info": header.info,
      symbols
    };

    symbolTables = util.assign(symbolTables, {
      [name]: analyzed
    });
  });

  return {
    symbolTables,
    "remaining": remaining.filter((r) => slaveSections.indexOf(r) < 0)
  };
};

const analyzeStringTables = ({ sections, sectionStrings, data }) => {
  const { matched, remaining } = match(sections, (section) => section.sh_type === "SHT_STRTAB");

  let stringTables = {};
  matched.forEach((section) => {
    const { name, header } = analyzeSection({ section, sectionStrings, data });
    const strings = strtab.parse({ "header": section, "chunk": data.chunks[section.chunk_idx] });

    const analyzed = util.assign(header, {
      strings
    });

    stringTables = util.assign(stringTables, {
      [name]: analyzed
    });
  });

  return {
    stringTables,
    remaining
  };
};

const analyzeGenericSections = ({ sections, sectionStrings, data, findOrAddChunk }) => {
  let genericSections = {};
  sections.forEach((section, idx) => {
    const { name, header } = analyzeSection({ section, sectionStrings, data });

    if (idx === 0) {
      if (header.type !== "SHT_NULL") {
        throw new Error(`first section is not SHT_NULL, but ${header.type}`);
      }
    }

    if (typeof section.chunk_idx !== "undefined") {
      header.chunk_idx = findOrAddChunk(data.chunks[section.chunk_idx]);
      header.chunk_offset = section.chunk_offset;
    }
    genericSections = util.assign(genericSections, {
      [name]: header
    });
  });

  return {
    genericSections
  };
};

const analyze = ({ data, findOrAddChunk, structure }) => {
  let sectionStrings;
  let symbolTables;
  let stringTables;
  let genericSections;
  let remaining;

  ({ sectionStrings, remaining } = analyzeSectionStringTable({ data }));
  ({ symbolTables, remaining } = analyzeSymbolTables({ "sections": remaining, sectionStrings, data, structure }));
  ({ stringTables, remaining } = analyzeStringTables({ "sections": remaining, sectionStrings, data }));
  ({ genericSections } = analyzeGenericSections({ "sections": remaining, sectionStrings, data, findOrAddChunk }));

  return util.assign(symbolTables, stringTables, genericSections);
};

const generateSection = ({ name, section, sectionStrings }) => {
  sectionStrings = [].concat(sectionStrings, [ name ]);

  let header = {
    "sh_name": strtab.index(sectionStrings, name),
    "sh_type": section.type,
    "sh_flags": section.flags,
    "sh_addr": section.address,
    "sh_size": section.size,
    "sh_info": section.info,
    "sh_addralign": section.align,
    "sh_entsize": section.entsize,

    "chunk_idx": section.chunk_idx,
    "chunk_offset": section.chunk_offset,

    // sh_link will be generated later, when section indices are fixed
    "link": section.link || ""
  };

  return {
    header,
    sectionStrings
  };
};

const attachchunk = ({ header, chunks, chunk }) => {
  chunks = [].concat(chunks, [ chunk ]);
  header = util.assign(header, {
    "chunk_idx": BigInt(chunks.length - 1),
    "chunk_offset": BigInt(0)
  });

  return {
    header,
    chunks
  };
};

const generateStringTables = ({ sections, sectionStrings, chunks }) => {
  let remaining = {};

  let table = [];
  Object.keys(sections).forEach((name) => {
    const section = sections[name];

    if (section.type === "SHT_STRTAB") {
      let header;
      ({ header, sectionStrings } = generateSection({ name, section, sectionStrings }));

      const { header: strtabHeader, chunk } = strtab.format(section.strings);
      header = util.assign({
        "sh_flags": [],
        "sh_addr": BigInt(0),
        "sh_info": BigInt(0),
        "sh_addralign": BigInt(1),
        "sh_entsize": BigInt(0)
      }, header, strtabHeader);
      ({ header, chunks } = attachchunk({ header, chunks, chunk }));

      table = [].concat(table, [ header ]);
    } else {
      remaining = util.assign(remaining, {
        [name]: section
      });
    }
  });

  return {
    table,
    sectionStrings,
    chunks,
    remaining
  };
};

const generateSymbolTables = ({ sections, sectionStrings, chunks, structure }) => {
  let remaining = {};

  let table = [];
  Object.keys(sections).forEach((name) => {
    const section = sections[name];

    if (section.type === "SHT_SYMTAB") {
      let symbolStrings = [];
      const rawSymbols = section.symbols.map((sym) => {
        symbolStrings = [].concat(symbolStrings, [ sym.name ]);
        return {
          "st_name": strtab.index(symbolStrings, sym.name),
          "st_value": sym.value,
          "st_size": sym.size,
          "st_bind": sym.bind,
          "st_type": sym.type,
          "st_visibility": sym.visibility,
          "st_shndx": sym.shndx
        };
      });

      let symbolTables;
      ({ table: symbolTables, sectionStrings, chunks } = generateStringTables({
        "sections": {
          [".strtab" + name]: {
            "name": ".strtab" + name,
            "type": "SHT_STRTAB",
            "strings": symbolStrings
          }
        },
        sectionStrings,
        chunks
      }));

      table = [].concat(table, symbolTables);

      let header;
      ({ header, sectionStrings } = generateSection({
        name,
        "section": util.assign(section, {
          "link": ".strtab" + name
        }),
        sectionStrings
      }));

      const syms = symtab.format({ "data": rawSymbols, structure });
      ({ header, chunks } = attachchunk({ header, chunks, "chunk": syms.chunk }));

      header = {
        ...header,
        "sh_addralign": BigInt(0),
        "sh_entsize": syms.header.sh_entsize
      };

      table = [].concat(table, [ header ]);
    } else {
      remaining = util.assign(remaining, {
        [name]: section
      });
    }
  });

  return {
    table,
    sectionStrings,
    chunks,
    remaining
  };
};

const generateGenericSections = ({ sections, sectionStrings, chunks, data }) => {
  let table = [];

  Object.keys(sections).forEach((name) => {
    const section = sections[name];
    let header;
    ({ header, sectionStrings } = generateSection({ name, section, sectionStrings }));
    table = [].concat(table, [ header ]);
  });

  return {
    table,
    sectionStrings,
    chunks
  };
};

const generateNullSection = ({ sections }) => {
  let nullSection = undefined;
  let remaining = {};

  Object.keys(sections).forEach((name) => {
    const section = sections[name];

    if (section.type === "SHT_NULL") {
      if (nullSection !== undefined) {
        throw Error("currently only one null section is supported");
      }

      let header;
      ({ header } = generateSection({ name, section, sectionStrings: [ "" ] }));
      nullSection = header;
    } else {
      remaining = util.assign(remaining, {
        [name]: section
      });
    }
  });

  if (nullSection === undefined) {
    throw Error("one section with type SHT_NULL is required");
  }

  return {
    nullSection,
    remaining
  };
};

const resolveLinks = ({ sections, sectionStrings }) => {
  return sections.map((section) => {
    const linkedSectionIndex = sections.findIndex((s2) => {
      const s2Name = strtab.string(sectionStrings, s2.sh_name);
      return s2Name === section.link;
    });

    assert(linkedSectionIndex >= 0 && linkedSectionIndex < sections.length, "linked section found and in range");

    const { link, ...sect } = section;

    return util.assign(sect, {
      "sh_link": BigInt(linkedSectionIndex)
    });
  });
};

const createSectionStringTable = ({ sectionStrings, chunks }) => {
  sectionStrings = [].concat(sectionStrings, ".shstrtab");
  const { header, chunk } = strtab.format(sectionStrings);
  chunks = [].concat(chunks, [ chunk ]);
  const shstrtab = util.assign(header, {
    "sh_name": strtab.index(sectionStrings, ".shstrtab"),
    "chunk_idx": BigInt(chunks.length - 1),
    "chunk_offset": BigInt(0),
    "sh_flags": [],
    "sh_addr": BigInt(0),
    "sh_info": BigInt(0),
    "sh_addralign": BigInt(1),
    "sh_entsize": BigInt(0),
    "link": ""
  });

  return {
    shstrtab,
    sectionStrings,
    chunks
  };
};

const generate = ({ data, structure }) => {
  let sectionStrings = [ "" ];
  let chunks = data.chunks;
  let remaining = data.sections;

  let symbolTables;
  let stringTables;
  let genericSections;
  let nullSection;

  ({ nullSection, remaining } = generateNullSection({ "sections": remaining }));
  ({ table: stringTables, sectionStrings, chunks, remaining } = generateStringTables({ "sections": remaining, sectionStrings, chunks }));
  ({ table: symbolTables, sectionStrings, chunks, remaining } = generateSymbolTables({ "sections": remaining, sectionStrings, chunks, structure }));
  ({ table: genericSections, sectionStrings, chunks } = generateGenericSections({ "sections": remaining, sectionStrings, chunks }));

  let shstrtab;
  ({ shstrtab, sectionStrings, chunks } = createSectionStringTable({ sectionStrings, chunks }));

  const sections = [
    nullSection,
    ...genericSections,
    ...stringTables,
    ...symbolTables,
    shstrtab
  ];
  const e_shstrndx = BigInt(sections.length - 1);

  return {
    e_shstrndx,
    "sections": resolveLinks({ sections, sectionStrings }),
    chunks
  };
};

const sectionAnalyzer = {
  analyze,
  generate
};

export default sectionAnalyzer;
