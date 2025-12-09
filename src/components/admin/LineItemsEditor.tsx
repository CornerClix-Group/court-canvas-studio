import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  sort_order: number;
}

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  readOnly?: boolean;
}

const UNITS = [
  { value: "each", label: "Each" },
  { value: "sq_ft", label: "Sq Ft" },
  { value: "linear_ft", label: "Linear Ft" },
  { value: "hour", label: "Hour" },
  { value: "day", label: "Day" },
  { value: "lot", label: "Lot" },
  { value: "gallon", label: "Gallon" },
];

export function LineItemsEditor({ items, onChange, readOnly = false }: LineItemsEditorProps) {
  const generateId = () => crypto.randomUUID();

  const addItem = () => {
    const newItem: LineItem = {
      id: generateId(),
      description: "",
      quantity: 1,
      unit: "each",
      unit_price: 0,
      total: 0,
      sort_order: items.length,
    };
    onChange([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    const updatedItems = items.map((item) => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      // Recalculate total if quantity or unit_price changes
      if (field === "quantity" || field === "unit_price") {
        updated.total = Number(updated.quantity) * Number(updated.unit_price);
      }
      
      return updated;
    });
    onChange(updatedItems);
  };

  const removeItem = (id: string) => {
    const filtered = items.filter((item) => item.id !== id);
    // Reorder sort_order
    const reordered = filtered.map((item, index) => ({
      ...item,
      sort_order: index,
    }));
    onChange(reordered);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {!readOnly && <TableHead className="w-10"></TableHead>}
              <TableHead className="min-w-[250px]">Description</TableHead>
              <TableHead className="w-24">Qty</TableHead>
              <TableHead className="w-32">Unit</TableHead>
              <TableHead className="w-32">Unit Price</TableHead>
              <TableHead className="w-32 text-right">Total</TableHead>
              {!readOnly && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={readOnly ? 5 : 7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No line items yet. Click "Add Item" to add one.
                </TableCell>
              </TableRow>
            ) : (
              items
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((item) => (
                  <TableRow key={item.id}>
                    {!readOnly && (
                      <TableCell className="cursor-grab">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                    )}
                    <TableCell>
                      {readOnly ? (
                        <span>{item.description}</span>
                      ) : (
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          placeholder="Enter description..."
                          className="min-w-[200px]"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span>{item.quantity}</span>
                      ) : (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                          }
                          className="w-20"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span>{UNITS.find(u => u.value === item.unit)?.label || item.unit}</span>
                      ) : (
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateItem(item.id, "unit", value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span>{formatCurrency(item.unit_price)}</span>
                      ) : (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)
                            }
                            className="pl-7 w-28"
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      {!readOnly && (
        <Button type="button" variant="outline" onClick={addItem}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      )}

      <div className="flex justify-end">
        <div className="text-right">
          <span className="text-muted-foreground mr-4">Subtotal:</span>
          <span className="font-semibold text-lg">{formatCurrency(subtotal)}</span>
        </div>
      </div>
    </div>
  );
}
