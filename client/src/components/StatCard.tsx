interface StatCardProps {
  title: string;
  count: number;
  color: "success" | "warning" | "error" | "processing";
  onClick: () => void;
}

const colorClasses = {
  success: "border-l-[hsl(var(--chart-1))]",
  warning: "border-l-[hsl(var(--chart-2))]",
  error: "border-l-[hsl(var(--destructive))]",
  processing: "border-l-[hsl(var(--chart-5))]"
};

export default function StatCard({ title, count, color, onClick }: StatCardProps) {
  return (
    <div 
      className={`bg-card p-6 rounded-xl shadow-lg border-l-4 ${colorClasses[color]} cursor-pointer stat-card-hover transition-all duration-300`}
      onClick={onClick}
    >
      <div className="text-3xl font-bold text-accent mb-2">{count}</div>
      <div className="text-card-foreground text-lg">{title}</div>
    </div>
  );
}
