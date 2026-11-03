import { useCallback, useEffect, useState } from "react";
import { getPayslips, runPayroll } from "../api/payroll";
import { getErrorMessage } from "../api/client";
import Alert from "../components/Alert";
import DataState from "../components/DataState";
import PayslipModal from "../components/payroll/PayslipModal";
import SalarySetupForm from "../components/payroll/SalarySetupForm";
import { useAuth } from "../context/AuthContext";
import type { Payslip } from "../types";
import { currentMonth, formatMoney, monthLabel } from "../utils/format";

type Tab = "payslips" | "setup";

export default function Payroll() {
  const { user } = useAuth();
  const isAdmin = user.role === "Admin";

  const [tab, setTab] = useState<Tab>("payslips");
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Payslip | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setPayslips(await getPayslips());
    } catch (e) {
      setLoadError(getErrorMessage(e, "Could not load payslips."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user.role !== "Manager") load();
    else setLoading(false);
  }, [load, user.role]);

  // Managers have no payroll access (see Roles and Permissions table in the plan)
  if (user.role === "Manager") {
    return (
      <div className="hr-page">
        <h1>Payroll</h1>
        <section className="hr-card">
          <p className="hr-state">Payroll is only available to Admin and to employees for their own payslips.</p>
        </section>
      </div>
    );
  }

  const handleRun = async () => {
    if (!month) return setError("Choose the month to run payroll for.");
    if (!window.confirm(`Run payroll for ${monthLabel(month)}? A payslip will be created for every active employee.`)) return;
    setRunning(true);
    setError("");
    setMessage("");
    try {
      const created = await runPayroll(month);
      setMessage(`Payroll for ${monthLabel(month)} is done. ${created.length} payslip(s) created.`);
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="hr-page">
      <h1>Payroll</h1>

      {isAdmin && (
        <div className="hr-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "payslips"} className={tab === "payslips" ? "hr-tab hr-tab-active" : "hr-tab"} onClick={() => setTab("payslips")}>
            Payroll runs and payslips
          </button>
          <button role="tab" aria-selected={tab === "setup"} className={tab === "setup" ? "hr-tab hr-tab-active" : "hr-tab"} onClick={() => setTab("setup")}>
            Salary setup
          </button>
        </div>
      )}

      {tab === "setup" && isAdmin ? (
        <section className="hr-card">
          <h2>Salary setup</h2>
          <SalarySetupForm />
        </section>
      ) : (
        <>
          {isAdmin && (
            <section className="hr-card">
              <h2>Run payroll</h2>
              <div className="hr-row hr-wrap">
                <label className="hr-inline-field">
                  Month
                  <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                </label>
                <button className="hr-btn hr-btn-primary" onClick={handleRun} disabled={running}>
                  {running ? "Running..." : "Run payroll"}
                </button>
              </div>
              <Alert type="error" message={error} onClose={() => setError("")} />
              <Alert type="success" message={message} onClose={() => setMessage("")} />
            </section>
          )}

          <section className="hr-card">
            <h2>{isAdmin ? "Payroll history" : "My payslips"}</h2>
            <DataState
              loading={loading}
              error={loadError}
              isEmpty={payslips.length === 0}
              emptyMessage={isAdmin ? "No payroll has been run yet. Choose a month and run payroll." : "You do not have any payslips yet."}
              onRetry={load}
            >
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      {isAdmin && <th>Employee</th>}
                      <th>Basic</th>
                      <th>Net salary</th>
                      <th>Payslip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map((p) => (
                      <tr key={p.id}>
                        <td>{monthLabel(p.month)}</td>
                        {isAdmin && <td>{p.employeeName}</td>}
                        <td>{formatMoney(p.basicSalary)}</td>
                        <td><strong>{formatMoney(p.netSalary)}</strong></td>
                        <td>
                          <button className="hr-btn hr-btn-ghost" onClick={() => setSelected(p)}>View payslip</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataState>
          </section>
        </>
      )}

      {selected && <PayslipModal payslip={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
