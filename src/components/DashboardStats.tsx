interface DashboardStatCard {
  label: string;
  value: number;
  helper: string;
}

interface DashboardStatsProps {
  cards: DashboardStatCard[];
}

export function DashboardStats({ cards }: DashboardStatsProps) {

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-xs"
        >
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {card.label}
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {card.value}
          </div>
          <div className="mt-1 text-xs text-slate-500">{card.helper}</div>
        </div>
      ))}
    </div>
  );
}
