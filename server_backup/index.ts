import fs from "fs";
import path from "path";
import express from "express";
import apiRouter from "./routes"; // adjust path if needed

const app = express();
const PORT = process.env.PORT || 5000;

const distPath = path.join(__dirname, "../client/dist");
const publicPath = path.join(__dirname, "../client/public");

if (fs.existsSync(path.join(distPath, "index.html"))) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.use(express.static(publicPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

app.use("/api", apiRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
