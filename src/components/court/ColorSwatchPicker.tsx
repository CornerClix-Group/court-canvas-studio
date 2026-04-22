/**
 * Reusable Laykold color swatch picker.
 * Used in Explore Mode and Approval Mode.
 */
import { LaykoldColor, formatLaykoldName } from "@/lib/courtGeometry";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorSwatchPickerProps {
  label: string;
  colors: LaykoldColor[];
  selected: string;
  onChange: (name: string) => void;
  /** When true, splits into Standards and Vibrants headings (only meaningful for court colors). */
  groupByTier?: boolean;
  size?: "sm" | "md";
}

export function ColorSwatchPicker({
  label,
  colors,
  selected,
  onChange,
  groupByTier = false,
  size = "md",
}: ColorSwatchPickerProps) {
  const standards = colors.filter((c) => c.group === "standard");
  const vibrants = colors.filter((c) => c.group === "vibrant");
  const lines = colors.filter((c) => c.group === "line");

  const renderGroup = (group: LaykoldColor[]) => (
    <div className={cn("grid gap-2", size === "sm" ? "grid-cols-6" : "grid-cols-6")}>
      {group.map((c) => {
        const active = selected === c.name;
        return (
          <button
            key={c.name + c.hex}
            type="button"
            onClick={() => onChange(c.name)}
            className={cn(
              "relative aspect-square rounded-md border-2 transition-all min-h-[44px] min-w-[44px]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active
                ? "border-primary ring-2 ring-primary/30 scale-105"
                : "border-border hover:border-primary/50"
            )}
            style={{
              backgroundColor: c.hex,
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15), inset 0 0 8px rgba(0,0,0,0.18)",
            }}
            aria-label={formatLaykoldName(c.name)}
            title={formatLaykoldName(c.name)}
          >
            {active && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Check className="h-4 w-4" style={{ color: getReadableOn(c.hex) }} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
        <span className="text-xs text-muted-foreground">
          {selected ? formatLaykoldName(selected) : "—"}
        </span>
      </div>

      {groupByTier ? (
        <div className="space-y-3">
          {standards.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Standards
              </p>
              {renderGroup(standards)}
            </div>
          )}
          {vibrants.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Vibrants
              </p>
              {renderGroup(vibrants)}
            </div>
          )}
        </div>
      ) : (
        renderGroup(lines.length > 0 ? lines : colors)
      )}
    </div>
  );
}

function getReadableOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#000" : "#fff";
}
