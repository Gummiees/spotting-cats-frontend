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
const envContent = `export const environment = {
  production: ${process.env.NODE_ENV === "production" || false},
  apiUrl: "${envVars.API_URL || "https://api.thecatapi.com/v1"}",
};
`;

// Write to environment.ts
const envFilePath = path.join(
  __dirname,
  "..",
  "src",
  "environments",
  "environment.ts"
);
fs.writeFileSync(envFilePath, envContent);
