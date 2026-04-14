import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  DollarSign,
  Percent,
  Building2,
  ArrowDownCircle,
  HandCoins
} from "lucide-react";

export interface CustomItem {
  id: string;
  description: string;
  vendorName?: string;
  vendorCost?: number;
  markupPercent: number;
  customerPrice: number;
  notes?: string;
  pricingMode: 'direct' | 'markup' | 'at_cost';
  isAlternate?: boolean;
}

interface CustomItemsEditorProps {
  items: CustomItem[];
  onChange: (items: CustomItem[]) => void;
  showCostView?: boolean;
}

const DEFAULT_MARKUP = 15;

export function CustomItemsEditor({ items, onChange, showCostView = false }: CustomItemsEditorProps) {
  const [isOpen, setIsOpen] = useState(items.length > 0);
  const [isAdding, setIsAdding] = useState(false);
  const [pricingMode, setPricingMode] = useState<'direct' | 'markup' | 'at_cost'>('direct');
  const [isAlternate, setIsAlternate] = useState(false);
  // Form fields
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorCost, setVendorCost] = useState<number | ''>('');
  const [markupPercent, setMarkupPercent] = useState(DEFAULT_MARKUP);
  const [directPrice, setDirectPrice] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setDescription('');
    setVendorName('');
    setVendorCost('');
    setMarkupPercent(DEFAULT_MARKUP);
    setDirectPrice('');
    setNotes('');
    setIsAlternate(false);
    setIsAdding(false);
  };

  const calculateCustomerPrice = () => {
    if (pricingMode === 'direct') {
      return typeof directPrice === 'number' ? directPrice : 0;
    }
    if (typeof vendorCost === 'number') {
      return vendorCost * (1 + markupPercent / 100);
    }
    return 0;
  };

  const handleAddItem = () => {
    if (!description.trim()) return;
    
    const customerPrice = calculateCustomerPrice();
    if (customerPrice <= 0) return;

    const newItem: CustomItem = {
      id: crypto.randomUUID(),
      description: description.trim(),
      vendorName: vendorName.trim() || undefined,
      vendorCost: pricingMode === 'markup' && typeof vendorCost === 'number' ? vendorCost : undefined,
      markupPercent: pricingMode === 'markup' ? markupPercent : 0,
      customerPrice,
      notes: notes.trim() || undefined,
      pricingMode,
    };

    onChange([...items, newItem]);
    resetForm();
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const totalCustomerPrice = items.reduce((sum, item) => sum + item.customerPrice, 0);
  const totalVendorCost = items.reduce((sum, item) => sum + (item.vendorCost || item.customerPrice), 0);
  const totalProfit = totalCustomerPrice - totalVendorCost;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer group">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Plus className="w-5 h-5" />
                Custom Items
                {items.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-3">
                {items.length > 0 && (
                  <span className="text-sm font-medium text-primary">
                    {formatCurrency(totalCustomerPrice)}
                  </span>
                )}
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          <p className="text-sm text-muted-foreground mt-1">
            Add subcontractor quotes, fencing, concrete work, playgrounds, or any custom line item
          </p>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Add New Item Form */}
            {isAdding ? (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Add Custom Item</h4>
                  <Select 
                    value={pricingMode} 
                    onValueChange={(val: 'direct' | 'markup') => setPricingMode(val)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">
                        <span className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Direct Price
                        </span>
                      </SelectItem>
                      <SelectItem value="markup">
                        <span className="flex items-center gap-2">
                          <Percent className="w-4 h-4" />
                          Cost + Markup
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Concrete walkway - 200 LF, Playground installation, Chain-link fencing"
                  />
                </div>

                {pricingMode === 'direct' ? (
                  /* Direct Price Mode */
                  <div className="space-y-2">
                    <Label htmlFor="directPrice">Customer Price *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="directPrice"
                        type="number"
                        min={0}
                        step={0.01}
                        value={directPrice}
                        onChange={(e) => setDirectPrice(e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="0.00"
                        className="pl-9"
                      />
                    </div>
                  </div>
                ) : (
                  /* Cost + Markup Mode */
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vendorName">Vendor Name (internal only)</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="vendorName"
                            value={vendorName}
                            onChange={(e) => setVendorName(e.target.value)}
                            placeholder="e.g., ABC Concrete, Smith Fencing"
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vendorCost">Vendor Cost *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="vendorCost"
                            type="number"
                            min={0}
                            step={0.01}
                            value={vendorCost}
                            onChange={(e) => setVendorCost(e.target.value ? parseFloat(e.target.value) : '')}
                            placeholder="0.00"
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="markupPercent">Your Markup (%)</Label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="markupPercent"
                            type="number"
                            min={0}
                            max={100}
                            value={markupPercent}
                            onChange={(e) => setMarkupPercent(parseFloat(e.target.value) || 0)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Customer Price</Label>
                        <div className="h-10 px-3 py-2 rounded-md border bg-muted font-medium text-lg flex items-center">
                          {formatCurrency(calculateCustomerPrice())}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Internal Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes (not shown to customer)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any internal notes about this item..."
                    rows={2}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddItem}
                    disabled={!description.trim() || calculateCustomerPrice() <= 0}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setIsAdding(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Item
              </Button>
            )}

            {/* List of Added Items */}
            {items.length > 0 && (
              <div className="space-y-2">
                {items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-start justify-between p-3 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.description}</p>
                      {showCostView && item.pricingMode === 'markup' && (
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {item.vendorName && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {item.vendorName}
                            </span>
                          )}
                          <span>Cost: {formatCurrency(item.vendorCost || 0)}</span>
                          <span>+{item.markupPercent}%</span>
                          <span className="text-green-600 font-medium">
                            Profit: {formatCurrency(item.customerPrice - (item.vendorCost || 0))}
                          </span>
                        </div>
                      )}
                      {!showCostView && item.pricingMode === 'markup' && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {item.vendorName && `${item.vendorName} • `}Cost + {item.markupPercent}% markup
                        </p>
                      )}
                      {item.pricingMode === 'direct' && (
                        <p className="text-sm text-muted-foreground mt-0.5">Direct price</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="font-semibold text-primary whitespace-nowrap">
                        {formatCurrency(item.customerPrice)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Custom Items Total</span>
                    <span className="font-bold text-lg">{formatCurrency(totalCustomerPrice)}</span>
                  </div>
                  {showCostView && totalProfit > 0 && (
                    <div className="flex items-center justify-between text-sm text-green-600 mt-1">
                      <span>Custom Items Profit</span>
                      <span className="font-medium">{formatCurrency(totalProfit)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}