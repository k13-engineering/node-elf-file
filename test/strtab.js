import assert from "assert";
import strtab from "../lib/strtab.js";

describe("strtab", () => {
  it("should be able to parse formatted data", () => {
    const input = [
      "hello",
      "world"
    ];

    const { header, junk } = strtab.format(input);
    const output = strtab.parse({ header, junk });

    assert.deepEqual(output, input);
  });
});
