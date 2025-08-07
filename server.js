const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 8080;

// Ruta al directorio donde está tu app Angular
app.use(
  express.static(path.join(__dirname, "dist/spotting-cats-frontend/browser"))
);

// Todas las rutas que no sean archivos estáticos, que devuelvan index.html (SPA)
app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "dist/spotting-cats-frontend/browser/index.html")
  );
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${port}`);
});
