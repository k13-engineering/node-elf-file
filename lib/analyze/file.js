import assert from "assert";

const analyze = ({ data }) => {

  if (data.file.ei_version !== data.file.e_version) {
    throw new Error("ei_version and e_version must be the same");
  }

  if (data.file.ei_version !== 1n) {
    throw new Error(`only ei_version 1 supported, ei_version = ${data.file.ei_version}`);
  }

  return {
    "type": data.file.e_type,
    "machine": data.file.e_machine,
    "entry": data.file.e_entry,
    "flags": data.file.e_flags,
    "version": data.file.ei_version,
    "osabi": data.file.ei_osabi,
    "abiversion": data.file.ei_abiversion,
  };
};

const machineTypes = {
  "x86": { "ei_class": BigInt(1), "ei_data": BigInt(1) },
  "x86-64": { "ei_class": BigInt(2), "ei_data": BigInt(1) },
  "PowerPC": { "ei_class": BigInt(1), "ei_data": BigInt(2) },
  "ARM": { "ei_class": BigInt(1), "ei_data": BigInt(1) }
};

const determineTypeFromMachine = (machine) => {
  const type = machineTypes[machine];
  assert(!!type, "machine type not supported");
  return type;
};

const generate = ({ data }) => {
  const type = determineTypeFromMachine(data.file.machine);

  return {
    "ei_magic": 0x7f454c46n,
    "ei_class": type.ei_class,
    "ei_data": type.ei_data,
    "ei_version": data.file.version,
    "ei_osabi": data.file.osabi,
    "ei_abiversion": data.file.abiversion,
    "e_version": data.file.version,
    "e_type": data.file.type,
    "e_machine": data.file.machine,
    "e_entry": data.file.entry,
    "e_flags": data.file.flags
  };
};

const fileAnalyzer = {
  analyze,
  generate
};

export default fileAnalyzer;
