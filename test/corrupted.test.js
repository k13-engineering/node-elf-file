import assets from "./assets.js";
import assert from "assert";
import elf from "../lib/index.js";

describe("corruptions", () => {
  it("should give the correct error message when ELF magic is wrong", () => {
    const a = assets.load("corrupted/missing-magic.elf");
    assert.throws(() => elf.parse(a.data), (ex) => {
      return ex.message === "invalid ELF magic, not an ELF file";
    });
  });
});
