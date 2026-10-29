import { useState } from "react";
import { downloadPayslipPdf } from "../../api/payroll";
import { getErrorMessage } from "../../api/client";
import Alert from "../Alert";
import Modal from "../Modal";
import type { Payslip } from "../../types";
import { formatMoney, monthLabel } from "../../utils/format";

/** Shows one payslip. Every number comes from the backend, nothing is calculated here except the totals line. */
export default function PayslipModal({ payslip: p, onClose }: { payslip: Payslip; onClose: () => void }) {
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const totalAllowances = p.allowances.reduce((s, x) => s + x.amount, 0);
  const totalDeductions = p.deductions.reduce((s, x) => s + x.amount, 0);

  const download = async () => {
    setError("");
    setDownloading(true);
    try {
      await downloadPayslipPdf(p);
    } catch (e) {
      setError(getErrorMessage(e, "Could not download the payslip PDF."));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal title={`Payslip, ${monthLabel(p.month)}`} onClose={onClose} wide>
      <div className="hr-payslip">
        <Alert type="error" message={error} onClose={() => setError("")} />
        <p>
          <strong>{p.employeeName}</strong>
          {p.employeeCode ? ` (${p.employeeCode})` : ""}
        </p>

        <table className="hr-table hr-payslip-table">
          <tbody>
            <tr><th>Basic salary</th><td>{formatMoney(p.basicSalary)}</td></tr>
            {p.allowances.map((a, i) => (
              <tr key={`a${i}`}><td>Allowance: {a.name}</td><td>{formatMoney(a.amount)}</td></tr>
            ))}
            <tr><td>Overtime pay ({p.overtimeHours} h)</td><td>{formatMoney(p.overtimePay)}</td></tr>
            <tr className="hr-subtotal"><th>Total earnings</th><td>{formatMoney(p.basicSalary + totalAllowances + p.overtimePay)}</td></tr>
            {p.deductions.map((d, i) => (
              <tr key={`d${i}`}><td>Deduction: {d.name}</td><td>- {formatMoney(d.amount)}</td></tr>
            ))}
            <tr><td>EPF (employee 8%)</td><td>- {formatMoney(p.epfEmployee)}</td></tr>
            <tr className="hr-subtotal"><th>Total deductions</th><td>- {formatMoney(totalDeductions + p.epfEmployee)}</td></tr>
            <tr className="hr-net"><th>Net salary</th><td>{formatMoney(p.netSalary)}</td></tr>
          </tbody>
        </table>

        <p className="hr-muted">
          Paid by the employer, not deducted from you: EPF 12% = {formatMoney(p.epfEmployer)}, ETF 3% = {formatMoney(p.etfEmployer)}.
        </p>
      </div>

      <div className="hr-row hr-end hr-no-print">
        <button className="hr-btn hr-btn-ghost" onClick={() => window.print()}>Print</button>
        <button className="hr-btn hr-btn-primary" onClick={download} disabled={downloading}>
          {downloading ? "Preparing..." : "Download PDF"}
        </button>
      </div>
    </Modal>
  );
}
