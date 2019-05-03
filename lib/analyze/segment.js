const analyze = ({ data, findOrAddJunk }) => {
  return data.segments.map((segment) => {
    return {
      "type": segment.p_type,
      "flags": segment.p_flags,
      "vaddr": segment.p_vaddr,
      "paddr": segment.p_paddr,
      "filesz": segment.p_filesz,
      "memsz": segment.p_memsz,
      "align": segment.p_align,
      "junk_idx": segment.junk_idx !== undefined ? findOrAddJunk(data.junks[segment.junk_idx]) : undefined,
      "junk_offset": segment.junk_offset
    };
  });
};

const generate = ({ data }) => {
  return data.segments.map((segment) => {
    return {
      "p_type": segment.type,
      "p_flags": segment.flags,
      "p_vaddr": segment.vaddr,
      "p_paddr": segment.paddr,
      "p_filesz": segment.filesz,
      "p_memsz": segment.memsz,
      "p_align": segment.align,
      "junk_idx": segment.junk_idx,
      "junk_offset": segment.junk_offset
    };
  });
};

const segmentAnalyzer = {
  analyze,
  generate
};

export default segmentAnalyzer;
