import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change: string;
  trend: "up" | "down";
  color: "orange" | "green" | "yellow" | "blue";
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  change,
  trend,
  color,
}: StatCardProps) {
  const colors = {
    orange: "bg-orange-500/20 text-orange-500",
    green: "bg-green-500/20 text-green-500",
    yellow: "bg-yellow-500/20 text-yellow-500",
    blue: "bg-blue-500/20 text-blue-500",
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/40 transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>

          <h2 className="text-3xl font-bold mt-3">
            {value}
          </h2>

          <p
            className={`mt-4 text-sm font-semibold ${
              trend === "up"
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            {trend === "up" ? "↑" : "↓"} {change}
          </p>
        </div>

        <div className={`p-4 rounded-xl ${colors[color]}`}>
          <Icon size={28} />
        </div>
      </div>
    </div>
  );
}