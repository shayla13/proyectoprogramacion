interface AverageBarProps {
  label: string;
  value: number;
}

export default function AverageBar({ label, value }: AverageBarProps) {
  const pct = Math.round((value / 5) * 100);
  const color = value > 3.5 ? 'bg-green-500' : value >= 2.5 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = value > 3.5 ? 'text-green-700' : value >= 2.5 ? 'text-amber-700' : 'text-red-700';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-8 text-right ${textColor}`}>{value.toFixed(1)}</span>
    </div>
  );
}