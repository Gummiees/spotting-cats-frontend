const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 8080;

// Servir los archivos estáticos del dist
app.use(
  express.static(path.join(__dirname, "dist/spotting-cats-frontend/browser"))
);

// Cualquier ruta angular debe redirigir a index.html
app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "dist/spotting-cats-frontend/browser/index.html")
  );
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🔥 Listening on http://0.0.0.0:${port}`);
});
