import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFound, requestLogger } from "./middleware/error";
import routes from "./routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
