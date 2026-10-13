import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const applicationSourceSha = "2c0dbfd79f4f0a2ef94a23acb5a0a21d566f68b8";
const output = "docs/demo/source-manifest.json";
const tracked = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);
const inputs = tracked
  .filter(
    (path) =>
      path === "index.html" ||
      path === "package.json" ||
      path === "package-lock.json" ||
      path === "tsconfig.json" ||
      path === "vite.config.ts" ||
      path.startsWith("src/") ||
      path.startsWith("public/data/") ||
      path.startsWith("public/assets/photos/"),
  )
  .sort()
  .map((path) => {
    const bytes = readFileSync(path);
    const gitBlobSha = createHash("sha1")
      .update(`blob ${bytes.length}\0`)
      .update(bytes)
      .digest("hex");
    return { path, git_blob_sha: gitBlobSha, bytes: bytes.length };
  });

mkdirSync(dirname(output), { recursive: true });
writeFileSync(
  output,
  `${JSON.stringify(
    {
      schema: 1,
      recorded_application_source_sha: applicationSourceSha,
      source_scope:
        "Runtime, build configuration, versioned planning data and local photographs used by the captured production app.",
      inputs,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `Recorded ${inputs.length} application inputs for ${applicationSourceSha}`,
);
