import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import router from "./routes";

const app: Express = express();

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: corsOrigin ? corsOrigin.split(",").map(s => s.trim()) : true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const currentDir = typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(decodeURIComponent(new URL(import.meta.url).pathname));
  const publicDir = path.resolve(currentDir, "public");
  app.use(express.static(publicDir));
  app.get("/{path}", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

export default app;
