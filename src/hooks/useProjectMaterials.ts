import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProjectMaterial {
  id: string;
  project_id: string;
  inventory_item_id: string | null;
  product_name: string;
  product_type: string;
  gallons_required: number;
  containers_allocated: number;
  container_size: number | null;
  status: string;
  allocated_at: string | null;
  consumed_at: string | null;
  unit_cost: number | null;
  total_cost: number | null;
  notes: string | null;
  created_at: string;
}

export interface CreateProjectMaterialInput {
  project_id: string;
  inventory_item_id?: string;
  product_name: string;
  product_type: string;
  gallons_required: number;
  containers_allocated: number;
  container_size?: number;
  unit_cost?: number;
  total_cost?: number;
  notes?: string;
}

export function useProjectMaterials(projectId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['project-materials', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_materials')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');
      
      if (error) throw error;
      return data as ProjectMaterial[];
    },
    enabled: !!projectId,
  });
  
  const allocateMutation = useMutation({
    mutationFn: async (materials: CreateProjectMaterialInput[]) => {
      // Insert project materials
      const { data, error } = await supabase
        .from('project_materials')
        .insert(materials.map(m => ({
          ...m,
          status: 'allocated',
          allocated_at: new Date().toISOString(),
        })))
        .select();
      
      if (error) throw error;
      
      // Deduct from inventory for each allocation
      for (const material of materials) {
        if (material.inventory_item_id) {
          // Get current inventory
          const { data: inventory, error: fetchError } = await supabase
            .from('material_inventory')
            .select('quantity_on_hand')
            .eq('id', material.inventory_item_id)
            .single();
          
          if (fetchError) {
            console.error('Error fetching inventory:', fetchError);
            continue;
          }
          
          // Deduct containers
          const newQuantity = Math.max(0, (inventory.quantity_on_hand || 0) - material.containers_allocated);
          
          const { error: updateError } = await supabase
            .from('material_inventory')
            .update({ quantity_on_hand: newQuantity })
            .eq('id', material.inventory_item_id);
          
          if (updateError) {
            console.error('Error updating inventory:', updateError);
          }
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-materials', projectId] });
      queryClient.invalidateQueries({ queryKey: ['material-inventory'] });
      toast({
        title: "Materials Allocated",
        description: "Inventory has been updated.",
      });
    },
    onError: (error) => {
      console.error('Error allocating materials:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to allocate materials.",
      });
    },
  });
  
  const consumeMutation = useMutation({
    mutationFn: async (materialIds: string[]) => {
      const { error } = await supabase
        .from('project_materials')
        .update({
          status: 'consumed',
          consumed_at: new Date().toISOString(),
        })
        .in('id', materialIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-materials', projectId] });
      toast({
        title: "Materials Consumed",
        description: "Materials marked as used.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update material status.",
      });
    },
  });
  
  const returnMutation = useMutation({
    mutationFn: async (materials: ProjectMaterial[]) => {
      // Mark as returned
      const { error } = await supabase
        .from('project_materials')
        .update({ status: 'returned' })
        .in('id', materials.map(m => m.id));
      
      if (error) throw error;
      
      // Return to inventory
      for (const material of materials) {
        if (material.inventory_item_id && material.status === 'allocated') {
          const { data: inventory, error: fetchError } = await supabase
            .from('material_inventory')
            .select('quantity_on_hand')
            .eq('id', material.inventory_item_id)
            .single();
          
          if (fetchError) continue;
          
          const newQuantity = (inventory.quantity_on_hand || 0) + material.containers_allocated;
          
          await supabase
            .from('material_inventory')
            .update({ quantity_on_hand: newQuantity })
            .eq('id', material.inventory_item_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-materials', projectId] });
      queryClient.invalidateQueries({ queryKey: ['material-inventory'] });
      toast({
        title: "Materials Returned",
        description: "Inventory has been restored.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to return materials.",
      });
    },
  });
  
  return {
    materials: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    allocateMaterials: allocateMutation.mutateAsync,
    isAllocating: allocateMutation.isPending,
    consumeMaterials: consumeMutation.mutate,
    isConsuming: consumeMutation.isPending,
    returnMaterials: returnMutation.mutate,
    isReturning: returnMutation.isPending,
  };
}

export function useInventoryContainers() {
  return useQuery({
    queryKey: ['material-inventory-containers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_inventory')
        .select('*')
        .eq('is_active', true)
        .order('product_type')
        .order('container_size', { ascending: false });
      
      if (error) throw error;
      
      // Map to ContainerOption format
      return data.map(item => ({
        inventoryItemId: item.id,
        productCode: item.product_code,
        productName: item.product_name,
        productType: item.product_type,
        containerSize: Number(item.container_size),
        containerType: item.container_type,
        costPerContainer: Number(item.cost_per_container),
        costPerGallon: Number(item.cost_per_gallon),
        quantityOnHand: item.quantity_on_hand || 0,
        colorName: item.color_name,
        isPrimary: item.is_primary || false,
      }));
    },
  });
}
