const fs = require("fs");
const path = require("path");

// Read .env file
const envPath = path.join(__dirname, "..", ".env");
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join("=").trim();
    }
  });
}

// Generate environment.ts content
const generateEnvFileContent = (isProduction) => {
  return `export const environment = {
  production: ${isProduction},
  apiUrl: "${envVars.API_URL || ""}",
  maptilerApiKey: "${envVars.MAPTILER_API_KEY || ""}",
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

const envDir = path.join(__dirname, "..", "src", "environments");

writeEnvFile(path.join(envDir, "environment.ts"), mainEnvContent);
writeEnvFile(path.join(envDir, "environment.development.ts"), devEnvContent);
writeEnvFile(path.join(envDir, "environment.staging.ts"), stagingEnvContent);
