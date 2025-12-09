import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const PAYMENT_TERMS = [
  { value: "due_on_receipt", label: "Due on Receipt", days: 0 },
  { value: "net_15", label: "Net 15", days: 15 },
  { value: "net_30", label: "Net 30", days: 30 },
  { value: "net_60", label: "Net 60", days: 60 },
  { value: "custom", label: "Custom Date", days: null },
];

interface PaymentTermsSelectProps {
  dueDate: Date | null;
  onChange: (dueDate: Date | null) => void;
  disabled?: boolean;
}

export function PaymentTermsSelect({
  dueDate,
  onChange,
  disabled = false,
}: PaymentTermsSelectProps) {
  const [selectedTerm, setSelectedTerm] = useState<string>("net_30");
  const [showCalendar, setShowCalendar] = useState(false);

  // Determine initial term based on dueDate
  useEffect(() => {
    if (!dueDate) {
      setSelectedTerm("due_on_receipt");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateNormalized = new Date(dueDate);
    dueDateNormalized.setHours(0, 0, 0, 0);

    const diffTime = dueDateNormalized.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const matchingTerm = PAYMENT_TERMS.find(
      (term) => term.days !== null && term.days === diffDays
    );

    if (matchingTerm) {
      setSelectedTerm(matchingTerm.value);
    } else {
      setSelectedTerm("custom");
    }
  }, []);

  const handleTermChange = (value: string) => {
    setSelectedTerm(value);

    if (value === "custom") {
      setShowCalendar(true);
      return;
    }

    const term = PAYMENT_TERMS.find((t) => t.value === value);
    if (term && term.days !== null) {
      onChange(addDays(new Date(), term.days));
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setShowCalendar(false);
    }
  };

  return (
    <div className="space-y-3">
      <Select
        value={selectedTerm}
        onValueChange={handleTermChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select payment terms" />
        </SelectTrigger>
        <SelectContent>
          {PAYMENT_TERMS.map((term) => (
            <SelectItem key={term.value} value={term.value}>
              {term.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedTerm === "custom" && (
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dueDate && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, "PPP") : "Pick a due date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate || undefined}
              onSelect={handleDateSelect}
              initialFocus
              className="pointer-events-auto"
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      )}

      {dueDate && (
        <p className="text-sm text-muted-foreground">
          Due: {format(dueDate, "MMMM d, yyyy")}
        </p>
      )}
    </div>
  );
}
