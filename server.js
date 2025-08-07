const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 8080;

app.use(
  express.static(path.join(__dirname, "dist/spotting-cats-frontend/browser"))
);

console.log("✅ Static middleware and wildcard route set up");
app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "dist/spotting-cats-frontend/browser/index.html")
  );
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${port}`);
});
