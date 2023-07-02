import assert from "assert";

const parse = ({ header, chunk }) => {
  assert(typeof chunk !== "undefined", "chunk should be given");

  const buf = chunk.data.slice(Number(header.chunk_offset), Number(header.chunk_offset + header.sh_size));

  let result = [];
  let offset = 0;

  while (offset < buf.length) {
    const delimIndex = buf.indexOf(0, offset);
    if (delimIndex < 0) {
      throw new Error("found undelimited string");
    }
    result = [].concat(result, buf.slice(offset, delimIndex).toString("ascii"));
    offset = delimIndex + 1;
  }

  return result;
};

const format = (data) => {
  let buf = Buffer.alloc(0);

  data.forEach((entry) => {
    buf = Buffer.concat([ buf, Buffer.from(entry, "ascii"), Buffer.alloc(1) ]);
  });

  const chunk = {
    "size": BigInt(buf.length),
    "data": buf
  };

  const header = {
    "sh_type": "SHT_STRTAB",
    "sh_size": BigInt(buf.length),

    "chunk_offset": BigInt(0)
  };

  return {
    header,
    chunk
  };
};

const index = (tab, str) => {
  const arrIndex = tab.indexOf(str);
  if (arrIndex < 0) {
    throw new Error(`string ${str} not contained in strtab`);
  }

  let offset = 0;
  tab.slice(0, arrIndex).forEach((entry) => {
    offset += entry.length + 1;
  });

  return BigInt(offset);
};

const string = (tab, idx) => {
  let offset = 0;

  let i = 0;
  while (i < tab.length && (offset + tab[i].length) < Number(idx)) {
    offset += tab[i].length + 1;
    i += 1;
  }

  if (i >= tab.length) {
    throw new Error(`given index ${idx} not in strtab`);
  }

  return tab[i].substr(Number(idx) - offset);
};

const strtab = {
  parse,
  format,

  index,
  string
};

export default strtab;
