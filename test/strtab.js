import assert from "assert";
import strtab from "../lib/strtab.js";

describe("strtab", () => {
  it("should be able to parse formatted data", () => {
    const input = [
      "hello",
      "world"
    ];

    const { header, chunk } = strtab.format(input);
    const output = strtab.parse({ header, chunk });

    assert.deepEqual(output, input);
  });
});
