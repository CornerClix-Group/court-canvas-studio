import { Button } from "@/components/ui/button";
import {
  Ruler,
  ArrowRight,
  Type,
  Square,
  Undo2,
  Trash2,
  Check,
} from "lucide-react";

export type AnnotationTool = 'measurement' | 'arrow' | 'text' | 'rectangle';

interface AnnotationToolbarProps {
  activeTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
  canUndo: boolean;
  canSave: boolean;
}

const COLORS = [
  { value: '#ef4444', label: 'Red' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#22c55e', label: 'Green' },
  { value: '#000000', label: 'Black' },
  { value: '#ffffff', label: 'White' },
];

const TOOLS: { tool: AnnotationTool; icon: typeof Ruler; label: string }[] = [
  { tool: 'measurement', icon: Ruler, label: 'Measurement' },
  { tool: 'arrow', icon: ArrowRight, label: 'Arrow' },
  { tool: 'text', icon: Type, label: 'Text' },
  { tool: 'rectangle', icon: Square, label: 'Rectangle' },
];

export function AnnotationToolbar({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  onUndo,
  onClear,
  onSave,
  canUndo,
  canSave,
}: AnnotationToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg">
      {/* Tools */}
      <div className="flex items-center gap-1 border-r border-border pr-3 mr-1">
        {TOOLS.map(({ tool, icon: Icon, label }) => (
          <Button
            key={tool}
            variant={activeTool === tool ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange(tool)}
            title={label}
            className="h-9 w-9 p-0"
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Colors */}
      <div className="flex items-center gap-1 border-r border-border pr-3 mr-1">
        {COLORS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onColorChange(value)}
            title={label}
            className={`h-6 w-6 rounded-full border-2 transition-transform ${
              activeColor === value
                ? 'border-primary scale-110'
                : 'border-transparent hover:scale-105'
            }`}
            style={{
              backgroundColor: value,
              boxShadow: value === '#ffffff' ? 'inset 0 0 0 1px #e5e7eb' : undefined,
            }}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className="h-9 w-9 p-0"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          title="Clear All"
          className="h-9 w-9 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Save */}
      <Button
        onClick={onSave}
        disabled={!canSave}
        size="sm"
        className="ml-auto"
      >
        <Check className="h-4 w-4 mr-1" />
        Save
      </Button>
    </div>
  );
}
