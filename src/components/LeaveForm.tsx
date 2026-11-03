import { useEffect, useState, type FormEvent } from "react";
import { applyLeave, getLeaveTypes } from "../api/leave";
import { getErrorMessage } from "../api/client";
import Alert from "./Alert";
import type { LeaveBalance, LeaveType } from "../types";
import { daysBetween, todayStr } from "../utils/format";

interface Props {
  balances: LeaveBalance[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface Errors {
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export default function LeaveForm({ balances, onSuccess, onCancel }: Props) {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getLeaveTypes()
      .then(setTypes)
      .catch((e) => setServerError(getErrorMessage(e, "Could not load leave types.")));
  }, []);

  const days = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const left = balances.find((b) => String(b.leaveTypeId) === leaveTypeId)?.remainingDays;

  const validate = (): Errors => {
    const e: Errors = {};
    if (!leaveTypeId) e.leaveTypeId = "Choose a leave type.";
    if (!startDate) e.startDate = "Choose a start date.";
    else if (startDate < todayStr()) e.startDate = "Start date cannot be in the past.";
    if (!endDate) e.endDate = "Choose an end date.";
    else if (startDate && endDate < startDate) e.endDate = "End date cannot be before the start date.";
    if (reason.trim().length < 5) e.reason = "Write a reason of at least 5 characters.";
    if (!e.leaveTypeId && !e.startDate && !e.endDate && left !== undefined && days > left) {
      e.endDate = `You only have ${left} day(s) of this leave left.`;
    }
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await applyLeave({ leaveTypeId: Number(leaveTypeId), startDate, endDate, reason: reason.trim() });
      onSuccess();
    } catch (e) {
      setServerError(getErrorMessage(e)); // backend validation message
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <Alert type="error" message={serverError} onClose={() => setServerError("")} />

      <div className="hr-field">
        <label htmlFor="leaveType">Leave type</label>
        <select id="leaveType" value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)}>
          <option value="">Select a type</option>
          {types.map((t) => {
            const b = balances.find((x) => x.leaveTypeId === t.id);
            return (
              <option key={t.id} value={t.id}>
                {t.name}
                {b ? ` (${b.remainingDays} days left)` : ""}
              </option>
            );
          })}
        </select>
        {errors.leaveTypeId && <small className="hr-text-red">{errors.leaveTypeId}</small>}
      </div>

      <div className="hr-grid-2">
        <div className="hr-field">
          <label htmlFor="startDate">Start date</label>
          <input id="startDate" type="date" min={todayStr()} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          {errors.startDate && <small className="hr-text-red">{errors.startDate}</small>}
        </div>
        <div className="hr-field">
          <label htmlFor="endDate">End date</label>
          <input id="endDate" type="date" min={startDate || todayStr()} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          {errors.endDate && <small className="hr-text-red">{errors.endDate}</small>}
        </div>
      </div>

      {days > 0 && <p className="hr-muted">This request is for {days} day{days > 1 ? "s" : ""}.</p>}

      <div className="hr-field">
        <label htmlFor="reason">Reason</label>
        <textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        {errors.reason && <small className="hr-text-red">{errors.reason}</small>}
      </div>

      <div className="hr-row hr-end">
        <button type="button" className="hr-btn hr-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
          {submitting ? "Sending..." : "Send request"}
        </button>
      </div>
    </form>
  );
}
