import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}. Check your .env file.`);
  return value;
}

const alertCheckTime = process.env.ALERT_CHECK_TIME ?? "10:00";
if (alertCheckTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(alertCheckTime)) {
  throw new Error("ALERT_CHECK_TIME must look like 10:00 (24-hour HH:MM), or be empty to switch off.");
}

export const env = {
  port: Number(process.env.PORT || 5000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  alertCheckTime,
};
