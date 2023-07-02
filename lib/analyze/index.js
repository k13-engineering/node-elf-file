/* eslint-disable camelcase */

import layouter from "../layout.js";
import strucureFactory from "../structures.js";

import fileAnalyzer from "./file.js";
import segmentAnalyzer from "./segment.js";
import sectionAnalyzer from "./section.js";

const analyze = (data) => {
  const structure = strucureFactory.create({ "ei_class": data.file.ei_class, "ei_data": data.file.ei_data });

  const file = fileAnalyzer.analyze({ data });

  let chunks = [];

  const findOrAddChunk = (source) => {
    let idx = chunks.findIndex((chunk) => Buffer.compare(chunk.data, source.data) === 0);
    if (idx < 0) {
      chunks = [].concat(chunks, [{
        "size": source.size,
        "data": source.data.slice(0)
      }]);
      idx = chunks.length - 1;
    }

    return BigInt(idx);
  };

  const segments = segmentAnalyzer.analyze({ data, findOrAddChunk });
  const sections = sectionAnalyzer.analyze({ data, findOrAddChunk, structure });

  return {
    file,
    segments,
    sections,
    chunks
  };
};

const generate = (data) => {
  let file = fileAnalyzer.generate({ data });

  const structure = strucureFactory.create({ "ei_class": file.ei_class, "ei_data": file.ei_data });

  const segments = segmentAnalyzer.generate({ data });
  const { e_shstrndx, sections, chunks } = sectionAnalyzer.generate({ data, structure });

  file = Object.assign(file, {
    e_shstrndx
  });

  return layouter.layout({
    file,
    segments,
    sections,
    chunks
  });
};

const xy = {
  analyze,
  generate
};

export default xy;
