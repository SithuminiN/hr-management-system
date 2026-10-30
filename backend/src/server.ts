import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { startAlertScheduler } from "./jobs/scheduler";

const server = app.listen(env.port, () => {
  console.log(`HRMS backend running on http://localhost:${env.port}  (health: /api/health)`);
  startAlertScheduler();
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);