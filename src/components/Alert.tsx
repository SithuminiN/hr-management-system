export default function Alert({ type, message, onClose }: { type: "error" | "success"; message: string; onClose?: () => void }) {
  if (!message) return null;
  return (
    <div className={`hr-alert hr-alert-${type}`} role={type === "error" ? "alert" : "status"}>
      <span>{message}</span>
      {onClose && (
        <button className="hr-alert-close" onClick={onClose} aria-label="Dismiss message">
          ×
        </button>
      )}
    </div>
  );
}
