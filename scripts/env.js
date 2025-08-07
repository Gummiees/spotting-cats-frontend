const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv").config({ path: "src/.env" });

// Generate environment.ts content
const generateEnvFileContent = (isProduction) => {
  return `export const environment = {
  production: ${isProduction},
  apiUrl: "${process.env.API_URL || ""}",
  maptilerApiKey: "${process.env.MAPTILER_API_KEY || ""}",
};
`;
};

const writeEnvFile = (filePath, content) => {
  fs.writeFileSync(filePath, content);
  console.log(`Generated ${path.basename(filePath)}`);
};

const mainEnvContent = generateEnvFileContent(true);
const devEnvContent = generateEnvFileContent(false);
const stagingEnvContent = generateEnvFileContent(true);

console.log("creating env file with dev env content", devEnvContent);

const envDir = path.join(__dirname, "..", "src", "environments");

if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

writeEnvFile(path.join(envDir, "environment.ts"), mainEnvContent);
writeEnvFile(path.join(envDir, "environment.development.ts"), devEnvContent);
writeEnvFile(path.join(envDir, "environment.staging.ts"), stagingEnvContent);
