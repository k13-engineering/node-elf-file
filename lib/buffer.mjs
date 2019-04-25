const create = (buf, endianness) => {
  const delegate = (name) => {
    return buf[name].bind(buf);
  };

  let result = {
    "byteOffset": buf.byteOffset,
    "length": buf.length,
    endianness
  };

  [
    "compare", "copy", "entries", "equals", "fill", "includes",
    "indexOf", "keys", "lastIndexOf", "toJSON", "toString",
    "values",

    "swap16",
    "swap32",
    "swap64",

    "readUInt8",
    "writeUInt8",

    "readInt8",
    "writeInt8"
  ].forEach((key) => {
    result = Object.assign(result, {
      [key]: delegate(key)
    });
  });

  let suffix;

  if (endianness === "le" || endianness === "little" || endianness === "lsb") {
    suffix = "LE";
  } else if (endianness === "be" || endianness === "big" || endianness === "msb") {
    suffix = "BE";
  } else {
    throw new Error("invalid endianness " + endianness);
  }

  [
    "writeDouble",
    "writeFloat",
    "writeInt16",
    "writeInt32",
    "writeInt",
    "writeUInt16",
    "writeUInt32",
    "writeUInt",
    "writeBigInt64",
    "writeBigUInt64",

    "readDouble",
    "readFloat",
    "readInt16",
    "readInt32",
    "readInt",
    "readUInt16",
    "readUInt32",
    "readUInt",
    "readBigInt64",
    "readBigUInt64"
  ].forEach((key) => {
    result = Object.assign(result, {
      [key]: delegate(key + suffix)
    });
  });

  result = Object.assign(result, {
    "toBuffer": () => buf,
    "slice": function () {
      return create(buf.slice(...arguments), endianness);
    }
  });

  return result;
};

const EndianBuffer = {};

EndianBuffer.allocLE = function () {
  return create(Buffer.alloc(...arguments), "little");
};

EndianBuffer.allocBE = function () {
  return create(Buffer.alloc(...arguments), "big");
};

EndianBuffer.allocAs = function (endianness) {
  return create(Buffer.alloc(...Array.from(arguments).slice(1)), endianness);
};

EndianBuffer.fromLE = function () {
  return create(Buffer.from(...arguments), "little");
};

EndianBuffer.fromBE = function () {
  return create(Buffer.from(...arguments), "big");
};

EndianBuffer.fromType = function (endianness) {
  return create(Buffer.from(...Array.from(arguments).slice(1)), endianness);
};

EndianBuffer.isBuffer = Buffer.isBuffer;
EndianBuffer.isEncoding = Buffer.isEncoding;
EndianBuffer.byteLength = Buffer.byteLength;
EndianBuffer.compare = Buffer.compare;
EndianBuffer.concat = function (list) {
  const endian = list[0].endianness;
  if (typeof endian === "undefined") {
    throw new Error("non-endian buffer given");
  }
  if (list.some((l) => l.endianness !== endian)) {
    throw new Error("not all buffers have same endianness");
  }
  return create(Buffer.concat(...arguments), endian);
};

export default EndianBuffer;
