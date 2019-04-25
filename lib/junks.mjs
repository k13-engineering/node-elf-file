const finder = ({ data }) => {
  let junks = [];
  return {
    "process": (offset, size) => {
      const overlap = junks.find((junk) => {
        return junk.address < (offset + size) && (junk.address + junk.size) > offset;
      });

      if (overlap) {
        overlap.address = overlap.address < offset ? overlap.address : offset;
        overlap.size = BigInt(Math.max(Number(overlap.address + overlap.size), Number(offset + size))) - overlap.address;
      } else {
        junks.push({
          "address": offset,
          "size": size
        });
      }
    },
    "junks": () => {
      return junks.map((junk) => {
        return {
          "address": junk.address,
          "size": junk.size,
          "data": data.slice(Number(junk.address), Number(junk.address + junk.size))
        };
      });
    }
  };
};

const junks = {
  finder
};

export default junks;
