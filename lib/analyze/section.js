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
    "info": section.sh_info
  };

  return {
    name,
    header
  };
};

const analyzeSectionStringTable = ({ data }) => {
  assert(data.file.e_shstrndx >= BigInt(0) && data.file.e_shstrndx <= BigInt(data.sections.length), `e_shstrndx ${data.file.e_shstrndx} in range`);
  const shstr = data.sections[data.file.e_shstrndx];
  const sectionStrings = strtab.parse({ "header": shstr, "junk": data.junks[shstr.junk_idx] });

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

    const symbolStrings = strtab.parse({ "header": symbolStringSection, "junk": data.junks[symbolStringSection.junk_idx] });

    const symbols = symtab.parse({ "header": section, "junk": data.junks[section.junk_idx], structure }).map((sym) => {
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
    const strings = strtab.parse({ "header": section, "junk": data.junks[section.junk_idx] });

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

const analyzeGenericSections = ({ sections, sectionStrings, data, findOrAddJunk }) => {
  let genericSections = {};
  sections.forEach((section) => {
    const { name, header } = analyzeSection({ section, sectionStrings, data });

    if (typeof section.junk_idx !== "undefined") {
      header.junk_idx = findOrAddJunk(data.junks[section.junk_idx]);
      header.junk_offset = section.junk_offset;
    }
    genericSections = util.assign(genericSections, {
      [name]: header
    });
  });

  return {
    genericSections
  };
};

const analyze = ({ data, findOrAddJunk, structure }) => {
  let sectionStrings;
  let symbolTables;
  let stringTables;
  let genericSections;
  let remaining;

  ({ sectionStrings, remaining } = analyzeSectionStringTable({ data }));
  ({ symbolTables, remaining } = analyzeSymbolTables({ "sections": remaining, sectionStrings, data, structure }));
  ({ stringTables, remaining } = analyzeStringTables({ "sections": remaining, sectionStrings, data }));
  ({ genericSections } = analyzeGenericSections({ "sections": remaining, sectionStrings, data, findOrAddJunk }));

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

    "junk_idx": section.junk_idx,
    "junk_offset": section.junk_offset,

    // sh_link will be generated later, when section indices are fixed
    "link": section.link || ""
  };

  return {
    header,
    sectionStrings
  };
};

const attachJunk = ({ header, junks, junk }) => {
  junks = [].concat(junks, [ junk ]);
  header = util.assign(header, {
    "junk_idx": BigInt(junks.length - 1),
    "junk_offset": BigInt(0)
  });

  return {
    header,
    junks
  };
};

const generateStringTables = ({ sections, sectionStrings, junks }) => {
  let remaining = {};

  let table = [];
  Object.keys(sections).forEach((name) => {
    const section = sections[name];

    if (section.type === "SHT_STRTAB") {
      let header;
      ({ header, sectionStrings } = generateSection({ name, section, sectionStrings }));

      const { header: strtabHeader, junk } = strtab.format(section.strings);
      header = util.assign({
        "sh_flags": [],
        "sh_addr": BigInt(0),
        "sh_info": BigInt(0)
      }, header, strtabHeader);
      ({ header, junks } = attachJunk({ header, junks, junk }));

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
    junks,
    remaining
  };
};

const generateSymbolTables = ({ sections, sectionStrings, junks, structure }) => {
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
      ({ table: symbolTables, sectionStrings, junks } = generateStringTables({
        "sections": {
          [".strtab" + name]: {
            "name": ".strtab" + name,
            "type": "SHT_STRTAB",
            "strings": symbolStrings
          }
        },
        sectionStrings,
        junks
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
      ({ header, junks } = attachJunk({ header, junks, "junk": syms.junk }));

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
    junks,
    remaining
  };
};

const generateGenericSections = ({ sections, sectionStrings, junks, data }) => {
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
    junks
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

const createSectionStringTable = ({ sectionStrings, junks }) => {
  sectionStrings = [].concat(sectionStrings, ".shstrtab");
  const { header, junk } = strtab.format(sectionStrings);
  junks = [].concat(junks, [ junk ]);
  const shstrtab = util.assign(header, {
    "sh_name": strtab.index(sectionStrings, ".shstrtab"),
    "junk_idx": BigInt(junks.length - 1),
    "junk_offset": BigInt(0),
    "link": ""
  });

  return {
    shstrtab,
    sectionStrings,
    junks
  };
};

const generate = ({ data, structure }) => {
  let sectionStrings = [ "" ];
  let junks = data.junks;
  let remaining = data.sections;

  let symbolTables;
  let stringTables;
  let genericSections;

  ({ table: stringTables, sectionStrings, junks, remaining } = generateStringTables({ "sections": remaining, sectionStrings, junks }));
  ({ table: symbolTables, sectionStrings, junks, remaining } = generateSymbolTables({ "sections": remaining, sectionStrings, junks, structure }));
  ({ table: genericSections, sectionStrings, junks } = generateGenericSections({ "sections": remaining, sectionStrings, junks }));

  let shstrtab;
  ({ shstrtab, sectionStrings, junks } = createSectionStringTable({ sectionStrings, junks }));

  const sections = [
    ...genericSections,
    ...stringTables,
    ...symbolTables,
    shstrtab
  ];
  const e_shstrndx = BigInt(sections.length - 1);

  return {
    e_shstrndx,
    "sections": resolveLinks({ sections, sectionStrings }),
    junks
  };
};

const sectionAnalyzer = {
  analyze,
  generate
};

export default sectionAnalyzer;
