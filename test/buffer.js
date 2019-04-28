import assert from "assert";
import EndianBuffer from "../lib/buffer.js";

describe("buffer", () => {
  describe("API", () => {
    it("should work to instantiate using allocLE", () => {
      const buf = EndianBuffer.allocLE(10);
      assert.equal(buf.length, 10);
      assert.equal(buf.endianness, "little");
    });

    it("should work to instantiate using allocBE", () => {
      const buf = EndianBuffer.allocBE(10);
      assert.equal(buf.length, 10);
      assert.equal(buf.endianness, "big");
    });

    it("should work to instantiate using allocAs", () => {
      const buf = EndianBuffer.allocAs("big", 10);
      assert.equal(buf.length, 10);
      assert.equal(buf.endianness, "big");
    });

    it("should work to instantiate using fromLE", () => {
      const buf = EndianBuffer.fromLE(Buffer.alloc(10));
      assert.equal(buf.length, 10);
      assert.equal(buf.endianness, "little");
    });

    it("should work to instantiate using fromBE", () => {
      const buf = EndianBuffer.fromBE(Buffer.alloc(10));
      assert.equal(buf.length, 10);
      assert.equal(buf.endianness, "big");
    });

    it("should work to instantiate using fromType", () => {
      const buf = EndianBuffer.fromType("big", Buffer.alloc(10));
      assert.equal(buf.length, 10);
      assert.equal(buf.endianness, "big");
    });

    it("should work to concat multiple buffers", () => {
      const buf = EndianBuffer.concat([ EndianBuffer.allocLE(10), EndianBuffer.allocLE(10) ]);
      assert.equal(buf.length, 20);
      assert.equal(buf.endianness, "little");
    });

    it("should work to slice", () => {
      const buf = EndianBuffer.allocLE(10).slice(0, 5);
      assert.equal(buf.length, 5);
      assert.equal(buf.endianness, "little");
    });
  });

  describe("error cases", () => {
    it("should givenan error when non-endian buffers are beeing concated", () => {
      assert.throws(() => EndianBuffer.concat([ Buffer.alloc(10), Buffer.alloc(10) ]), (ex) => {
        return ex.message === "non-endian buffer given";
      });
    });

    it("should give an error when different endian buffers are beeing concated", () => {
      assert.throws(() => EndianBuffer.concat([ EndianBuffer.allocLE(10), EndianBuffer.allocBE(10) ]), (ex) => {
        return ex.message === "not all buffers have same endianness";
      });
    });

    it("should give an error when a invalid endianness is specified", () => {
      assert.throws(() => EndianBuffer.allocAs("some-nonesene-endian", 10), (ex) => {
        return ex.message === "invalid endianness some-nonesene-endian";
      });
    });
  });
});
