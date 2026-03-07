interface DashboardStatsProps {
  total: number;
  active: number;
  arachee: number;
  nonPlantee: number;
}

export function DashboardStats({
  total,
  active,
  arachee,
  nonPlantee,
}: DashboardStatsProps) {
  const cards = [
    { label: "Total parcelles", value: total },
    { label: "Actives", value: active },
    { label: "Arrachées", value: arachee },
    { label: "Non plantées", value: nonPlantee },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-xs"
        >
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {card.label}
          </div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
