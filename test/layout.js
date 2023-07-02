import assert from "assert";
import elf from "../lib/index.js";
import assets from "./assets.js";

describe("layouting", function () {
  assets.all.forEach(({ name, data }) => {
    describe(name, () => {
      it("should delayout without error", () => {
        elf.delayout(elf.parse(data));
      });

      it("should relayout without error", () => {
        const parsed = elf.parse(data);
        const layouted = elf.layout(parsed);
        elf.validate(layouted);
      });

      it("should delayout and layout without error", () => {
        const parsed = elf.parse(data);
        const delayouted = elf.delayout(parsed);
        const layouted = elf.layout(delayouted);
        elf.validate(layouted);
      });

      it("should only touch layout specific data", () => {
        const parsed = elf.parse(data);
        const before = elf.delayout(parsed);
        const after = elf.delayout(elf.layout(before));

        assert.deepEqual(after, before);
      });

      it("should show a reproducible behaviour when layouting using same input", () => {
        const input = elf.delayout(elf.parse(data));
        const output1 = elf.layout(input);
        const output2 = elf.layout(input);

        assert.deepEqual(output2, output1);
      });

      it("should show a reproducible behaviour when layouting using chain", () => {
        const input = elf.delayout(elf.parse(data));
        const output1 = elf.layout(input);
        const output2 = elf.layout(elf.delayout(output1));

        assert.deepEqual(output2, output1);
      });
    });
  });
});
