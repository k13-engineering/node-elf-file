import elf from "../index.js";
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
