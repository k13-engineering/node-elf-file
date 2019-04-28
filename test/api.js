import assert from "assert";
import structureFactory from "../lib/structures.js";
import parser from "../lib/parser.js";
import constants from "../lib/constants.js";

describe("API", () => {
  describe("structures", () => {
    it("should fail to instantiate when unsupported ei_class parameter is given", () => {
      assert.throws(() => structureFactory.create({ "ei_class": BigInt(3), "ei_data": BigInt(1) }), (ex) => {
        return ex.message === "unsupported value for ei_class 3";
      });
    });
    it("should fail to instantiate when unsupported ei_data parameter is given", () => {
      assert.throws(() => structureFactory.create({ "ei_class": BigInt(1), "ei_data": BigInt(3) }, (ex) => {
        return ex.message === "unsupported value for ei_data 3";
      }));
    });
  });

  describe("parser", () => {
    it("should fail to parse values of invalid size", () => {
      assert.throws(() => {
        const p = parser.structure.create({
          "test": { "offset": 0x00, "size": 5 }
        }, { "endianness": "little" });

        p.parse(Buffer.alloc(5));
      }, (ex) => {
        return ex.message === "invalid size";
      });
    });

    it("should fail to format values of invalid size", () => {
      assert.throws(() => {
        const p = parser.structure.create({
          "test": { "offset": 0x00, "size": 5 }
        }, { "endianness": "little" });

        p.format({ "test": BigInt(1) });
      }, (ex) => {
        return ex.message === "invalid size";
      });
    });
  });

  describe("constants", () => {
    it("should give an error when resolving unknown constants without fallback", () => {
      assert.throws(() => constants.FileType.decode("ET_UNIT_TEST"), (ex) => {
        return ex.message === "could not decode file type ET_UNIT_TEST";
      });
    });
  });
});
