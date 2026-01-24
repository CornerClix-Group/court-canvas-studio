import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: string) => void;
}

export function MeasurementDialog({
  open,
  onOpenChange,
  onConfirm,
}: MeasurementDialogProps) {
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("ft");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(`${value} ${unit}`);
      setValue("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle>Enter Measurement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="measurement">Distance</Label>
              <div className="flex gap-2">
                <Input
                  id="measurement"
                  type="number"
                  step="0.1"
                  placeholder="45"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ft">ft</option>
                  <option value="LF">LF</option>
                  <option value="SF">SF</option>
                  <option value="in">in</option>
                  <option value="m">m</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!value.trim()}>
              Add Measurement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
