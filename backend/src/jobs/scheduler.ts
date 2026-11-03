import { env } from "../config/env";
import { runAttendanceAlerts } from "../services/attendanceAlert.service";

// Every 15 minutes, after ALERT_CHECK_TIME on working days, send late/absent alerts.
// Duplicates are prevented inside runAttendanceAlerts. Leave ALERT_CHECK_TIME empty to switch this off.
export function startAlertScheduler() {
  if (!env.alertCheckTime) {
    console.log("Attendance alert job is off (ALERT_CHECK_TIME is empty).");
    return;
  }
  const [h, m] = env.alertCheckTime.split(":").map(Number);
  const cutoff = h * 60 + m;

  setInterval(async () => {
    const now = new Date();
    if (now.getHours() * 60 + now.getMinutes() < cutoff) return;
    try {
      await runAttendanceAlerts(now);
    } catch (err) {
      console.error("Attendance alert job failed:", err);
    }
  }, 15 * 60 * 1000);

  console.log(`Attendance alert job on: checks every 15 min after ${env.alertCheckTime} on working days.`);
}
