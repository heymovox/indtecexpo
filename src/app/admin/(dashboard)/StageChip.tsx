import { adminConfig } from "@/config/admin";
import type { LeadStage } from "@/types/exhibitor";

export function stageColor(stage: LeadStage): string {
  return (
    adminConfig.kanbanColumns.find((column) => column.id === stage)?.color ??
    "#1470DC"
  );
}

export function stageLabel(stage: LeadStage): string {
  return (
    adminConfig.kanbanColumns.find((column) => column.id === stage)?.label ??
    stage
  );
}

export function StageChip({ stage }: { stage: LeadStage }) {
  const color = stageColor(stage);
  return (
    <span
      className="inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}14`,
      }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {stageLabel(stage)}
    </span>
  );
}
