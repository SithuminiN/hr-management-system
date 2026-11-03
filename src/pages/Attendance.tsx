import { useCallback, useEffect, useMemo, useState } from "react";
import { checkIn, checkOut, getAttendanceHistory } from "../api/attendance";
import { getErrorMessage } from "../api/client";
import Alert from "../components/Alert";
import DataState from "../components/DataState";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import type { AttendanceRecord } from "../types";
import { formatDate, formatMinutes, formatTime, todayStr } from "../utils/format";

export default function Attendance() {
  const { user } = useAuth();
  const showNames = user.role !== "Employee"; // Admin / Manager see other people's records

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setRecords(await getAttendanceHistory({ from: from || undefined, to: to || undefined }));
    } catch (e) {
      setLoadError(getErrorMessage(e, "Could not load attendance records."));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  // The user's own open session (checked in, not yet checked out)
  const openSession = useMemo(
    () => records.find((r) => r.employeeId === user.employeeId && !r.checkOut),
    [records, user.employeeId],
  );
  const todayDone = useMemo(
    () => records.find((r) => r.employeeId === user.employeeId && r.date === todayStr() && r.checkOut),
    [records, user.employeeId],
  );

  const act = async (action: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(okMsg);
      await load();
    } catch (e) {
      setError(getErrorMessage(e)); // shows the backend rule, e.g. "already checked in"
    } finally {
      setBusy(false);
    }
  };

  const totals = useMemo(
    () => ({
      present: records.filter((r) => r.status === "Present").length,
      late: records.filter((r) => r.status === "Late").length,
      absent: records.filter((r) => r.status === "Absent").length,
      overtime: records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0),
    }),
    [records],
  );

  return (
    <div className="hr-page">
      <h1>Attendance</h1>

      <section className="hr-card">
        <div className="hr-row hr-between">
          <div>
            <h2>Today, {formatDate(todayStr())}</h2>
            <p className="hr-muted">
              {openSession
                ? `You checked in at ${formatTime(openSession.checkIn)}.`
                : todayDone
                  ? `You checked out at ${formatTime(todayDone.checkOut)}. See you tomorrow.`
                  : "You have not checked in today."}
            </p>
          </div>
          <div className="hr-row">
            <button
              className="hr-btn hr-btn-success"
              disabled={busy || !!openSession}
              onClick={() => act(checkIn, "Checked in successfully.")}
            >
              Check in
            </button>
            <button
              className="hr-btn hr-btn-danger"
              disabled={busy || !openSession}
              onClick={() => act(checkOut, "Checked out successfully.")}
            >
              Check out
            </button>
          </div>
        </div>
        <Alert type="error" message={error} onClose={() => setError("")} />
        <Alert type="success" message={message} onClose={() => setMessage("")} />
      </section>

      <section className="hr-card">
        <div className="hr-row hr-between hr-wrap">
          <h2>History</h2>
          <div className="hr-row hr-wrap">
            <label className="hr-inline-field">
              From
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="hr-inline-field">
              To
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </label>
            {(from || to) && (
              <button className="hr-btn hr-btn-ghost" onClick={() => { setFrom(""); setTo(""); }}>
                Clear dates
              </button>
            )}
          </div>
        </div>

        <div className="hr-stats">
          <div><strong>{totals.present}</strong><span>Present</span></div>
          <div><strong>{totals.late}</strong><span>Late</span></div>
          <div><strong>{totals.absent}</strong><span>Absent</span></div>
          <div><strong>{formatMinutes(totals.overtime)}</strong><span>Overtime</span></div>
        </div>

        <DataState
          loading={loading}
          error={loadError}
          isEmpty={records.length === 0}
          emptyMessage="No attendance records for this period. Check in to create today's record."
          onRetry={load}
        >
          <div className="hr-table-wrap">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Date</th>
                  {showNames && <th>Employee</th>}
                  <th>Check in</th>
                  <th>Check out</th>
                  <th>Worked</th>
                  <th>Overtime</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.date)}</td>
                    {showNames && <td>{r.employeeName ?? `#${r.employeeId}`}</td>}
                    <td>{formatTime(r.checkIn)}</td>
                    <td>{r.checkOut ? formatTime(r.checkOut) : "Still open"}</td>
                    <td>{formatMinutes(r.workedMinutes)}</td>
                    <td>{formatMinutes(r.overtimeMinutes)}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </section>
    </div>
  );
}
