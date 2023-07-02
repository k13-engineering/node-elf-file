const analyze = ({ data, findOrAddChunk }) => {
  return data.segments.map((segment) => {
    return {
      "type": segment.p_type,
      "flags": segment.p_flags,
      "vaddr": segment.p_vaddr,
      "paddr": segment.p_paddr,
      "filesz": segment.p_filesz,
      "memsz": segment.p_memsz,
      "align": segment.p_align,
      "chunk_idx": segment.chunk_idx !== undefined ? findOrAddChunk(data.chunks[segment.chunk_idx]) : undefined,
      "chunk_offset": segment.chunk_offset
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
      "chunk_idx": segment.chunk_idx,
      "chunk_offset": segment.chunk_offset
    };
  });
};

const segmentAnalyzer = {
  analyze,
  generate
};

export default segmentAnalyzer;
