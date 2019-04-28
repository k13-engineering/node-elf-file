import EndianBuffer from "./buffer.js";
import assert from "assert";

const structure = {
  "create": (defs, { endianness }) => {
    const read = (data, field) => {
      const def = defs[field];

      let value;

      if (def.endianness) {
        data = EndianBuffer.fromType(def.endianness, data.toBuffer());
      }

      switch (def.size) {
        case 1:
          value = data.readUInt8(def.offset);
          break;
        case 2:
          value = data.readUInt16(def.offset);
          break;
        case 4:
          value = data.readUInt32(def.offset);
          break;
        case 8:
          value = data.readBigUInt64(def.offset);
          break;
        default:
          throw new Error("invalid size");
      }

      return def.codec ? def.codec.decode(BigInt(value), BigInt(value)) : BigInt(value);
    };

    const parse = (data) => {
      const d = EndianBuffer.fromType(endianness, data);
      let result = {};

      Object.keys(defs).forEach((field) => {
        result = Object.assign(result, {
          [field]: read(d, field)
        });
      });

      return result;
    };

    const format = (data) => {
      let length = 0;
      Object.keys(defs).forEach((field) => {
        if (defs[field].offset + defs[field].size > length) {
          length = defs[field].offset + defs[field].size;
        }
      });

      let result = Buffer.alloc(length);

      Object.keys(defs).forEach((field) => {
        const def = defs[field];

        let buf;
        if (def.endianness) {
          buf = EndianBuffer.allocAs(def.endianness, length);
        } else {
          buf = EndianBuffer.allocAs(endianness, length);
        }

        let value = def.codec && (typeof data[field] === "string" || Array.isArray(data[field])) ? def.codec.encode(data[field]) : data[field];

        switch (def.size) {
          case 1:
            buf.writeUInt8(Number(value));
            break;
          case 2:
            buf.writeUInt16(Number(value));
            break;
          case 4:
            buf.writeUInt32(Number(value));
            break;
          case 8:
            buf.writeBigUInt64(BigInt(value));
            break;
          default:
            throw new Error("invalid size");
        }

        buf.copy(result, Number(def.offset));
      });

      return result;
    };

    return {
      parse,
      format
    };
  }
};

const splitEntries = ({ data, entrySize }, fn) => {
  if (entrySize === BigInt(0)) {
    return [];
  }

  assert.equal(BigInt(data.length) % entrySize, BigInt(0));

  return Array.from({ "length": Number(BigInt(data.length) / entrySize) }, (_, idx) => {
    return data.slice(Number(BigInt(idx) * entrySize), Number((BigInt(idx) + BigInt(1)) * entrySize));
  });
};

const table = {
  "create": ({ entryParser, entrySize }) => {
    return {
      "parse": (buf) => {
        const entries = splitEntries({ "data": buf, entrySize });
        return entries.map((entry) => entryParser.parse(entry));
      },
      "format": (data) => {
        let result = Buffer.alloc(0);
        data.forEach((entry) => {
          const entryDataPadded = Buffer.alloc(Number(entrySize));
          const entryData = entryParser.format(entry);
          entryData.copy(entryDataPadded);
          result = Buffer.concat([result, entryDataPadded]);
        });
        return result;
      }
    };
  }
};

const parser = {
  structure,
  table
};

export default parser;
