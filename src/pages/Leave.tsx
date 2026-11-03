import { useCallback, useEffect, useMemo, useState } from "react";
import { cancelLeave, decideLeave, getLeaveBalances, getLeaveRequests } from "../api/leave";
import { getErrorMessage } from "../api/client";
import Alert from "../components/Alert";
import DataState from "../components/DataState";
import LeaveForm from "../components/LeaveForm";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import type { LeaveBalance, LeaveRequest, LeaveStatus } from "../types";
import { daysBetween, formatDate, formatDateTime, todayStr } from "../utils/format";

type Filter = "All" | LeaveStatus;
const FILTERS: Filter[] = ["All", "Pending", "Approved", "Rejected", "Cancelled"];

export default function Leave() {
  const { user } = useAuth();
  const isApprover = user.role === "Admin" || user.role === "Manager";

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [list, bal] = await Promise.all([getLeaveRequests(), getLeaveBalances()]);
      setRequests(list);
      setBalances(bal);
    } catch (e) {
      setLoadError(getErrorMessage(e, "Could not load leave requests."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (filter === "All" ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter],
  );
  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  const isOwn = (r: LeaveRequest) => r.employeeId === user.employeeId;
  // UI rules only. The backend ALWAYS enforces the real permission checks.
  const canDecide = (r: LeaveRequest) => isApprover && !isOwn(r) && r.status === "Pending";
  const canCancel = (r: LeaveRequest) =>
    isOwn(r) && (r.status === "Pending" || (r.status === "Approved" && r.startDate > todayStr()));

  const run = async (id: number, action: () => Promise<unknown>, okMsg: string) => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(okMsg);
      setSelected(null);
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const approve = (r: LeaveRequest) => run(r.id, () => decideLeave(r.id, "Approved"), "Leave request approved.");
  const reject = (r: LeaveRequest) => {
    if (window.confirm(`Reject ${r.employeeName ?? "this"} leave request?`)) {
      run(r.id, () => decideLeave(r.id, "Rejected"), "Leave request rejected.");
    }
  };
  const cancel = (r: LeaveRequest) => {
    if (window.confirm("Cancel this leave request?")) {
      run(r.id, () => cancelLeave(r.id), "Leave request cancelled.");
    }
  };

  const Actions = ({ r, hideView }: { r: LeaveRequest; hideView?: boolean }) => (
    <div className="hr-row">
      {!hideView && <button className="hr-btn hr-btn-ghost" onClick={() => setSelected(r)}>View</button>}
      {canDecide(r) && (
        <>
          <button className="hr-btn hr-btn-success" disabled={busyId === r.id} onClick={() => approve(r)}>Approve</button>
          <button className="hr-btn hr-btn-danger" disabled={busyId === r.id} onClick={() => reject(r)}>Reject</button>
        </>
      )}
      {canCancel(r) && (
        <button className="hr-btn hr-btn-ghost" disabled={busyId === r.id} onClick={() => cancel(r)}>Cancel</button>
      )}
    </div>
  );

  return (
    <div className="hr-page">
      <div className="hr-row hr-between hr-wrap">
        <h1>Leave</h1>
        <button className="hr-btn hr-btn-primary" onClick={() => { setMessage(""); setShowForm(true); }}>
          Apply for leave
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError("")} />
      <Alert type="success" message={message} onClose={() => setMessage("")} />

      <section className="hr-cards">
        {balances.map((b) => (
          <div key={b.leaveTypeId} className="hr-card hr-balance">
            <span className="hr-muted">{b.leaveTypeName} leave</span>
            <strong>{b.remainingDays}</strong>
            <span className="hr-muted">days left this year</span>
          </div>
        ))}
        {isApprover && (
          <div className="hr-card hr-balance">
            <span className="hr-muted">Waiting for a decision</span>
            <strong>{pendingCount}</strong>
            <span className="hr-muted">pending request{pendingCount === 1 ? "" : "s"}</span>
          </div>
        )}
      </section>

      <section className="hr-card">
        <div className="hr-tabs" role="tablist">
          {FILTERS.map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? "hr-tab hr-tab-active" : "hr-tab"} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        <DataState
          loading={loading}
          error={loadError}
          isEmpty={visible.length === 0}
          emptyMessage={filter === "All" ? "No leave requests yet. Use Apply for leave to send your first request." : `No ${filter.toLowerCase()} requests.`}
          onRetry={load}
        >
          <div className="hr-table-wrap">
            <table className="hr-table">
              <thead>
                <tr>
                  {isApprover && <th>Employee</th>}
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    {isApprover && <td>{r.employeeName ?? `#${r.employeeId}`}</td>}
                    <td>{r.leaveTypeName}</td>
                    <td>{formatDate(r.startDate)}</td>
                    <td>{formatDate(r.endDate)}</td>
                    <td>{daysBetween(r.startDate, r.endDate)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td><Actions r={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </section>

      {showForm && (
        <Modal title="Apply for leave" onClose={() => setShowForm(false)}>
          <LeaveForm
            balances={balances}
            onCancel={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              setMessage("Leave request sent. It is now pending approval.");
              load();
            }}
          />
        </Modal>
      )}

      {selected && (
        <Modal title="Leave request details" onClose={() => setSelected(null)}>
          <dl className="hr-details">
            <dt>Employee</dt><dd>{selected.employeeName ?? `#${selected.employeeId}`}</dd>
            <dt>Type</dt><dd>{selected.leaveTypeName}</dd>
            <dt>Dates</dt><dd>{formatDate(selected.startDate)} to {formatDate(selected.endDate)} ({daysBetween(selected.startDate, selected.endDate)} days)</dd>
            <dt>Reason</dt><dd>{selected.reason}</dd>
            <dt>Status</dt><dd><StatusBadge status={selected.status} /></dd>
            {selected.decidedByName && (<><dt>Decided by</dt><dd>{selected.decidedByName}</dd></>)}
            {selected.decidedAt && (<><dt>Decided on</dt><dd>{formatDateTime(selected.decidedAt)}</dd></>)}
          </dl>
          <div className="hr-row hr-end"><Actions r={selected} hideView /></div>
        </Modal>
      )}
    </div>
  );
}
