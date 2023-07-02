const finder = ({ data }) => {
  let chunks = [];
  return {
    "process": (offset, size) => {
      const overlap = chunks.find((chunk) => {
        return chunk.address < (offset + size) && (chunk.address + chunk.size) > offset;
      });

      if (overlap) {
        overlap.address = overlap.address < offset ? overlap.address : offset;
        overlap.size = BigInt(Math.max(Number(overlap.address + overlap.size), Number(offset + size))) - overlap.address;
      } else {
        chunks.push({
          "address": offset,
          "size": size
        });
      }
    },
    "chunks": () => {
      return chunks.map((chunk) => {
        return {
          "address": chunk.address,
          "size": chunk.size,
          "data": data.slice(Number(chunk.address), Number(chunk.address + chunk.size))
        };
      });
    }
  };
};

const chunks = {
  finder
};

export default chunks;
