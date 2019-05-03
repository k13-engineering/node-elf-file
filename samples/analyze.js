import elf from "../index.js";
import fs from "fs";

process.nextTick(async () => {
  try {
    const raw = await fs.promises.readFile("./test/assets/elf64-le-x86_64/static.elf");
    const parsed = elf.parse(raw);
    const analyzed = elf.analyze(parsed);
    console.log("analyzed =", analyzed.sections);
    console.log("regenerated =", elf.generate(analyzed));
  } catch (ex) {
    console.error(ex);
  }
});
