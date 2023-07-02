import assert from "assert";
import elf from "../index.js";
import assets from "./assets.js";

const checkHeader = (file) => {
  assert.equal(typeof file.type, "string");
  assert.equal(typeof file.machine, "string");
  assert.equal(typeof file.entry, "bigint");
  assert.equal(typeof file.flags, "bigint");
  // assert(Array.isArray(file.flags));
};

const checkSegment = (segment) => {
  assert.equal(typeof segment.type, "string");
  // assert.equal(typeof segment.flags, "bigint");
  // assert(Array.isArray(segment.flags));
  assert.equal(typeof segment.vaddr, "bigint");
  assert.equal(typeof segment.paddr, "bigint");
  assert.equal(typeof segment.filesz, "bigint");
  assert.equal(typeof segment.memsz, "bigint");
  assert.equal(typeof segment.align, "bigint");
};

const checkSection = (section) => {
  assert.equal(typeof section.type, "string");
  // assert(Array.isArray(section.flags));
  assert.equal(typeof section.address, "bigint");
  assert.equal(typeof section.size, "bigint");
  if (["SHT_SYMTAB"].indexOf(section.type) < 0) {
    assert.equal(typeof section.link, "string");
  }
  assert.equal(typeof section.info, "bigint");
};

const copyExcluding = (data, excludes) => {
  let result = {};
  Object.keys(data).filter((key) => excludes.indexOf(key) < 0).forEach((key) => {
    result = Object.assign(result, {
      [key]: data[key]
    });
  });
  return result;
};

const dechunkify = (data) => {
  const file = data.file;

  const segments = data.segments.map((segment) => copyExcluding(segment, [ "chunk_idx", "chunk_offset" ]));

  let sections = {};
  Object.keys(data.sections).forEach((name) => {
    sections = Object.assign(sections, {
      [name]: copyExcluding(data.sections[name], [ "chunk_idx", "chunk_offset" ])
    });
  });

  return {
    file,
    segments,
    sections
  };
};

describe("analyzing", function () {
  assets.all.forEach(({ name, data }) => {
    describe(name, () => {
      it("should analyze without error", () => {
        elf.analyze(elf.parse(data));
      });

      it("should generate without error", () => {
        elf.generate(elf.analyze(elf.parse(data)));
      });

      it("should reanalyze correctly", () => {
        const analyzed = elf.analyze(elf.parse(data));
        const reanalyzed = elf.analyze(elf.generate(analyzed));

        assert.deepEqual(dechunkify(reanalyzed), dechunkify(analyzed));
      });

      describe("fields", () => {
        describe("simple analyze", () => {
          it("should have proper file fields", () => {
            const { file } = elf.analyze(elf.parse(data));
            checkHeader(file);
          });

          it("should have proper segment fields", () => {
            const { segments } = elf.analyze(elf.parse(data));
            segments.forEach((segment) => checkSegment(segment));
          });

          it("should have proper section fields", () => {
            const { sections } = elf.analyze(elf.parse(data));

            Object.keys(sections).forEach((name) => {
              const section = sections[name];
              checkSection(section);
            });
          });
        });

        describe("reanalyze", () => {
          it("should have proper file fields", () => {
            const { file } = elf.analyze(elf.generate(elf.analyze(elf.parse(data))));
            checkHeader(file);
          });

          it("should have proper segment fields", () => {
            const { segments } = elf.analyze(elf.generate(elf.analyze(elf.parse(data))));
            segments.forEach((segment) => checkSegment(segment));
          });

          it("should have proper section fields", () => {
            const { sections } = elf.analyze(elf.generate(elf.analyze(elf.parse(data))));

            Object.keys(sections).forEach((name) => {
              const section = sections[name];
              checkSection(section);
            });
          });
        });
      });
    });
  });
});
