/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */
const brandId = process.env.BRAND_ID;
const { execSync } = require("child_process");

function zcli(command, json = true) {
  try {
    const data = execSync(`yarn zcli ${command}${json ? " --json" : ""}`);
    return json ? JSON.parse(data.toString()) : data.toString();
  } catch (e) {
    console.error(e.message);
    if (e.stdout) console.error(e.stdout.toString());
    if (e.stderr) console.error(e.stderr.toString());
    process.exit(1);
  }
}

const importOutput = zcli(`themes:import --brandId=${brandId}`, false);
const themeId = importOutput.match(/theme ID:\s*(\d+)/)?.[1];

if (!themeId) {
  console.error("Theme import completed without returning a theme ID.");
  process.exit(1);
}

zcli(`themes:publish --themeId=${themeId}`, false);

const { themes } = zcli(`themes:list --brandId=${brandId}`);

for (const { live, id } of themes) {
  if (!live) zcli(`themes:delete --themeId=${id}`);
}
