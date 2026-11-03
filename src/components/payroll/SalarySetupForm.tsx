import { useEffect, useState, type FormEvent } from "react";
import { getEmployeesForPayroll, getSalary, saveSalary } from "../../api/payroll";
import { getErrorMessage } from "../../api/client";
import Alert from "../Alert";
import type { EmployeeLite, NamedAmount } from "../../types";
import { formatMoney } from "../../utils/format";

/** Admin only: set basic salary, allowances and deductions for one employee (PAY-1, PAY-2, PAY-3). */
export default function SalarySetupForm() {
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [basic, setBasic] = useState("");
  const [allowances, setAllowances] = useState<NamedAmount[]>([]);
  const [deductions, setDeductions] = useState<NamedAmount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getEmployeesForPayroll()
      .then(setEmployees)
      .catch((e) => setError(getErrorMessage(e, "Could not load employees.")));
  }, []);

  const choose = async (id: string) => {
    setEmployeeId(id);
    setMessage("");
    setError("");
    if (!id) return;
    setLoading(true);
    try {
      const s = await getSalary(Number(id));
      setBasic(String(s.basicSalary || ""));
      setAllowances(s.allowances);
      setDeductions(s.deductions);
    } catch (e) {
      setError(getErrorMessage(e, "Could not load the salary details."));
    } finally {
      setLoading(false);
    }
  };

  const update = (list: NamedAmount[], set: (l: NamedAmount[]) => void, i: number, patch: Partial<NamedAmount>) =>
    set(list.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const rows = (label: string, list: NamedAmount[], set: (l: NamedAmount[]) => void) => (
    <fieldset className="hr-fieldset">
      <legend>{label}</legend>
      {list.length === 0 && <p className="hr-muted">None added.</p>}
      {list.map((item, i) => (
        <div className="hr-row hr-item-row" key={i}>
          <input
            aria-label={`${label} name`}
            placeholder="Name (e.g. Transport)"
            value={item.name}
            onChange={(e) => update(list, set, i, { name: e.target.value })}
          />
          <input
            aria-label={`${label} amount`}
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={item.amount || ""}
            onChange={(e) => update(list, set, i, { amount: Number(e.target.value) })}
          />
          <button type="button" className="hr-btn hr-btn-ghost" onClick={() => set(list.filter((_, idx) => idx !== i))}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="hr-btn hr-btn-ghost" onClick={() => set([...list, { name: "", amount: 0 }])}>
        Add {label.toLowerCase().replace(/s$/, "")}
      </button>
    </fieldset>
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const basicNum = Number(basic);
    if (!employeeId) return setError("Choose an employee first.");
    if (!basic || isNaN(basicNum) || basicNum < 0) return setError("Enter a valid basic salary.");
    const all = [...allowances, ...deductions];
    if (all.some((x) => !x.name.trim() || x.amount <= 0)) {
      return setError("Every allowance and deduction needs a name and an amount above 0.");
    }
    setSaving(true);
    try {
      await saveSalary({ employeeId: Number(employeeId), basicSalary: basicNum, allowances, deductions });
      setMessage("Salary details saved.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const totalA = allowances.reduce((s, x) => s + (x.amount || 0), 0);
  const totalD = deductions.reduce((s, x) => s + (x.amount || 0), 0);

  return (
    <form onSubmit={submit} noValidate>
      <Alert type="error" message={error} onClose={() => setError("")} />
      <Alert type="success" message={message} onClose={() => setMessage("")} />

      <div className="hr-grid-2">
        <div className="hr-field">
          <label htmlFor="payEmployee">Employee</label>
          <select id="payEmployee" value={employeeId} onChange={(e) => choose(e.target.value)}>
            <option value="">Select an employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employeeCode} - {emp.name}
              </option>
            ))}
          </select>
        </div>
        <div className="hr-field">
          <label htmlFor="basic">Basic salary (LKR)</label>
          <input id="basic" type="number" min="0" step="0.01" value={basic} disabled={!employeeId || loading} onChange={(e) => setBasic(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="hr-state">Loading salary details...</p>
      ) : (
        employeeId && (
          <>
            {rows("Allowances", allowances, setAllowances)}
            {rows("Deductions", deductions, setDeductions)}
            <p className="hr-muted">
              Allowances total {formatMoney(totalA)}, deductions total {formatMoney(totalD)}. Overtime and EPF/ETF are added by the system when payroll runs.
            </p>
            <div className="hr-row hr-end">
              <button className="hr-btn hr-btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save salary details"}
              </button>
            </div>
          </>
        )
      )}
    </form>
  );
}
