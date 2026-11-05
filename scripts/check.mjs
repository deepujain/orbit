// Checks every script parses as a module and that no skin leaks a host app's own names.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const files = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? files(path) : [path];
});
let failed = false;
for (const path of [...files("src"), ...files("react"), ...files("example"), ...files("scripts")].filter((p) => /\.m?js$/.test(p))) {
  const result = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: readFileSync(path) });
  if (result.status !== 0) {
    failed = true;
    console.error(`${path}: does not parse\n${result.stderr}`);
  }
}
for (const path of files("themes")) {
  const css = readFileSync(path, "utf8");
  for (const leak of [/data-style=/, /\.spark-/]) {
    if (leak.test(css)) {
      failed = true;
      console.error(`${path}: contains ${leak}`);
    }
  }
}
const tests = readdirSync("test").filter((name) => name.endsWith(".test.js")).map((name) => join("test", name));
if (tests.length && spawnSync(process.execPath, ["--test", ...tests], { stdio: "inherit" }).status !== 0) failed = true;
if (failed) process.exit(1);
console.log("playskin: all checks pass");
