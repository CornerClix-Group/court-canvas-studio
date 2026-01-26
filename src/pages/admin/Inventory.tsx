import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Loader2, 
  Plus, 
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
  RefreshCw,
  Search
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface InventoryItem {
  id: string;
  product_code: string;
  product_name: string;
  product_type: string;
  product_line: string;
  is_primary: boolean;
  container_size: number;
  container_type: string;
  cost_per_gallon: number;
  cost_per_container: number;
  quantity_on_hand: number;
  reorder_point: number;
  reorder_quantity: number;
  color_name: string | null;
  is_premium_color: boolean;
  supplier: string;
  notes: string | null;
  is_active: boolean;
}

const PRODUCT_TYPE_CONFIG = {
  resurfacer: { label: "Resurfacers", color: "bg-blue-500" },
  color: { label: "Color Coats", color: "bg-green-500" },
  cushion: { label: "Cushion Materials", color: "bg-purple-500" },
  line_paint: { label: "Line Paint", color: "bg-orange-500" },
  specialty: { label: "Specialty", color: "bg-gray-500" },
};

export default function Inventory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; item: InventoryItem | null; mode: 'add' | 'remove' }>({
    open: false,
    item: null,
    mode: 'add'
  });
  const [adjustQuantity, setAdjustQuantity] = useState(1);

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['material-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_inventory')
        .select('*')
        .eq('is_active', true)
        .order('product_type')
        .order('is_primary', { ascending: false })
        .order('product_name');

      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async ({ id, newQuantity }: { id: string; newQuantity: number }) => {
      const { error } = await supabase
        .from('material_inventory')
        .update({ quantity_on_hand: newQuantity })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-inventory'] });
      toast({ title: "Inventory Updated", description: "Stock level has been adjusted." });
      setAdjustModal({ open: false, item: null, mode: 'add' });
      setAdjustQuantity(1);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update inventory." });
    },
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity_on_hand === 0) return { status: 'out', icon: XCircle, color: 'text-destructive', label: 'Out of Stock' };
    if (item.quantity_on_hand <= item.reorder_point) return { status: 'low', icon: AlertTriangle, color: 'text-amber-500', label: 'Low Stock' };
    return { status: 'ok', icon: CheckCircle, color: 'text-green-500', label: 'In Stock' };
  };

  const filteredInventory = inventory?.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || item.product_type === activeTab;
    return matchesSearch && matchesTab;
  });

  const lowStockCount = inventory?.filter(item => item.quantity_on_hand <= item.reorder_point).length || 0;
  const outOfStockCount = inventory?.filter(item => item.quantity_on_hand === 0).length || 0;

  const handleAdjust = () => {
    if (!adjustModal.item) return;
    const currentQty = adjustModal.item.quantity_on_hand;
    const newQty = adjustModal.mode === 'add' 
      ? currentQty + adjustQuantity 
      : Math.max(0, currentQty - adjustQuantity);
    adjustMutation.mutate({ id: adjustModal.item.id, newQuantity: newQty });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-8 h-8" />
            Material Inventory
          </h1>
          <p className="text-muted-foreground mt-1">
            Track stock levels for Advantage and backup products
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['material-inventory'] })}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{inventory?.length || 0}</p>
              </div>
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? "border-amber-500" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-amber-500">{lowStockCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className={outOfStockCount > 0 ? "border-destructive" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-destructive">{outOfStockCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          {Object.entries(PRODUCT_TYPE_CONFIG).map(([key, config]) => (
            <TabsTrigger key={key} value={key}>{config.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'all' ? 'All Products' : PRODUCT_TYPE_CONFIG[activeTab as keyof typeof PRODUCT_TYPE_CONFIG]?.label}
              </CardTitle>
              <CardDescription>
                {filteredInventory?.length || 0} products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead className="text-right">Container</TableHead>
                    <TableHead className="text-right">Cost/Gal</TableHead>
                    <TableHead className="text-right">On Hand</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory?.map((item) => {
                    const stockStatus = getStockStatus(item);
                    const StatusIcon = stockStatus.icon;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.is_primary && (
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            )}
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              {item.color_name && (
                                <p className="text-sm text-muted-foreground">{item.color_name}</p>
                              )}
                            </div>
                            {item.is_premium_color && (
                              <Badge variant="secondary" className="text-xs">Premium</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.product_code}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.product_line}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.container_size} gal {item.container_type}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${item.cost_per_gallon.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-bold ${stockStatus.color}`}>
                            {item.quantity_on_hand}
                          </span>
                          <span className="text-muted-foreground text-sm"> / {item.reorder_point} min</span>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${stockStatus.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-sm">{stockStatus.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setAdjustModal({ open: true, item, mode: 'add' })}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setAdjustModal({ open: true, item, mode: 'remove' })}
                              disabled={item.quantity_on_hand === 0}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Modal */}
      <Dialog open={adjustModal.open} onOpenChange={(open) => setAdjustModal({ ...adjustModal, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustModal.mode === 'add' ? 'Receive Stock' : 'Use Stock'}
            </DialogTitle>
            <DialogDescription>
              {adjustModal.item?.product_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Stock:</span>
              <span className="font-bold">{adjustModal.item?.quantity_on_hand} containers</span>
            </div>
            <div className="space-y-2">
              <Label>Quantity to {adjustModal.mode === 'add' ? 'Add' : 'Remove'}</Label>
              <Input
                type="number"
                min={1}
                max={adjustModal.mode === 'remove' ? adjustModal.item?.quantity_on_hand : 100}
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">New Stock Level:</span>
              <span className="font-bold text-lg">
                {adjustModal.mode === 'add' 
                  ? (adjustModal.item?.quantity_on_hand || 0) + adjustQuantity
                  : Math.max(0, (adjustModal.item?.quantity_on_hand || 0) - adjustQuantity)
                } containers
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustModal({ open: false, item: null, mode: 'add' })}>
              Cancel
            </Button>
            <Button onClick={handleAdjust} disabled={adjustMutation.isPending}>
              {adjustMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {adjustModal.mode === 'add' ? 'Add Stock' : 'Remove Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
