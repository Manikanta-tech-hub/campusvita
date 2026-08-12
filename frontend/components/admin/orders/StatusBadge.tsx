type OrderStatus =
  | "Preparing"
  | "Completed"
  | "Cancelled"
  | "Processing";

interface Props {
  status: OrderStatus;
}

const styles = {
  Preparing:
    "bg-amber-500/15 text-amber-400 border border-amber-500/30",

  Completed:
    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",

  Cancelled:
    "bg-red-500/15 text-red-400 border border-red-500/30",

  Processing:
    "bg-blue-500/15 text-blue-400 border border-blue-500/30",
};

export default function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}