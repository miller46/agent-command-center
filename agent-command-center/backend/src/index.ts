import cors from "cors";
import express, { type Request, type Response } from "express";
import morgan from "morgan";
import agentRoutes from "./routes/agentRoutes.js";
import { getAgentsRoot } from "./services/agentService.js";
import { logError, logInfo } from "./utils/logger.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", agentRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error, _req: Request, res: Response) => {
  logError("Unhandled server error", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  logInfo(`Server listening on http://localhost:${port}`);
  logInfo(`Reading agent data from ${getAgentsRoot()}`);
});
