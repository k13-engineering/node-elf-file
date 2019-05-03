/* eslint-disable camelcase */

import layouter from "../layout.js";
import strucureFactory from "../structures.js";

import fileAnalyzer from "./file.js";
import segmentAnalyzer from "./segment.js";
import sectionAnalyzer from "./section.js";

const analyze = (data) => {
  const structure = strucureFactory.create({ "ei_class": data.file.ei_class, "ei_data": data.file.ei_data });

  const file = fileAnalyzer.analyze({ data });

  let junks = [];

  const findOrAddJunk = (source) => {
    let idx = junks.findIndex((junk) => Buffer.compare(junk.data, source.data) === 0);
    if (idx < 0) {
      junks = [].concat(junks, [{
        "size": source.size,
        "data": source.data.slice(0)
      }]);
      idx = junks.length - 1;
    }

    return BigInt(idx);
  };

  const segments = segmentAnalyzer.analyze({ data, findOrAddJunk });
  const sections = sectionAnalyzer.analyze({ data, findOrAddJunk, structure });

  return {
    file,
    segments,
    sections,
    junks
  };
};

const generate = (data) => {
  let file = fileAnalyzer.generate({ data });

  const structure = strucureFactory.create({ "ei_class": file.ei_class, "ei_data": file.ei_data });

  const segments = segmentAnalyzer.generate({ data });
  const { e_shstrndx, sections, junks } = sectionAnalyzer.generate({ data, structure });

  file = Object.assign(file, {
    e_shstrndx
  });

  return layouter.layout({
    file,
    segments,
    sections,
    junks
  });
};

const xy = {
  analyze,
  generate
};

export default xy;
