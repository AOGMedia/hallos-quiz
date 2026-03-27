import { FORMAT_LABELS, FORMAT_COLORS, type TournamentFormat } from "@/lib/api/tournament";

interface FormatBadgeProps {
  format: TournamentFormat;
  size?: "sm" | "md";
}

const FormatBadge = ({ format, size = "md" }: FormatBadgeProps) => (
  <span
    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 font-medium rounded whitespace-nowrap ${FORMAT_COLORS[format]} ${
      size === "sm" ? "text-[10px]" : "text-[10px] sm:text-xs"
    }`}
  >
    {FORMAT_LABELS[format]}
  </span>
);

export default FormatBadge;
