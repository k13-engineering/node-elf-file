import assert from "assert";
import fs from "fs";
import elf from "../lib/elf.js";
import assets from "./assets.js";

describe("parsing", function () {
  assets.all.forEach(({ name, data }) => {
    describe(name, () => {
      it("should parse without error", () => {
        elf.parse(data);
      });
    });
  });
});
