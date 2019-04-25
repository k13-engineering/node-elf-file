import elf from "../index.mjs";
import fs from "fs";

process.nextTick(async () => {
  try {
    const raw = await fs.promises.readFile("./tests/assets/elf64-le-x86_64/static.elf");
    const data = elf.parse(raw);
    console.log("data =", data);
  } catch (ex) {
    console.error(ex);
  }
});
