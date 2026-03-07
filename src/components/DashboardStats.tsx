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
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="min-w-[180px] snap-start rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-xs"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {card.label}
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {card.value}
          </div>
          <div className="mt-2 text-sm text-slate-500">{card.helper}</div>
        </div>
      ))}
    </div>
  );
}
