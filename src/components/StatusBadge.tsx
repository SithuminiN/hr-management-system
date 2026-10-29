const COLORS: Record<string, string> = {
  Present: "green",
  Approved: "green",
  Late: "orange",
  Early: "orange",
  Pending: "orange",
  Absent: "red",
  Rejected: "red",
  "On Leave": "blue",
  Cancelled: "grey",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`hr-badge hr-badge-${COLORS[status] ?? "grey"}`}>{status}</span>;
}
