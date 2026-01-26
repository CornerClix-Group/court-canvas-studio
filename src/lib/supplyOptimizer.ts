/**
 * Supply Optimizer
 * Calculates the most cost-effective container combination for material orders.
 * 
 * Example: Need 13 gallons of color
 * Option A: 1x 30-gal drum = $444.30 (17 gal waste)
 * Option B: 3x 5-gal pails = $248.70 (2 gal waste)
 * Savings: $195.60 using pails
 */

export interface ContainerOption {
  inventoryItemId: string;
  productCode: string;
  productName: string;
  productType: string;
  containerSize: number;
  containerType: string;
  costPerContainer: number;
  costPerGallon: number;
  quantityOnHand: number;
  colorName: string | null;
  isPrimary: boolean;
}

export interface ContainerAllocation {
  item: ContainerOption;
  count: number;
  totalGallons: number;
  totalCost: number;
}

export interface SupplyOption {
  containers: ContainerAllocation[];
  totalCost: number;
  totalGallons: number;
  wasteGallons: number;
  wastePercent: number;
  isRecommended: boolean;
  reason: string;
}

export interface SupplyRecommendation {
  productType: string;
  productName: string;
  gallonsRequired: number;
  options: SupplyOption[];
  stockWarning?: string;
  selectedOption?: SupplyOption;
}

export interface MaterialRequirement {
  productType: string;
  productName: string;
  gallonsRequired: number;
  colorName?: string;
}

/**
 * Parse estimate items to extract material requirements
 */
export function parseEstimateItemsForMaterials(
  items: { description: string; quantity: number; unit: string | null }[]
): MaterialRequirement[] {
  const materials: MaterialRequirement[] = [];
  
  for (const item of items) {
    const desc = item.description.toLowerCase();
    
    // Match patterns like "Advantage Color - 26.0 gallons" or "Resurfacer - 15 gal"
    const gallonMatch = desc.match(/(\d+(?:\.\d+)?)\s*(?:gallons?|gal)/i);
    const gallons = gallonMatch ? parseFloat(gallonMatch[1]) : null;
    
    if (gallons) {
      // Determine product type from description
      let productType = 'other';
      let productName = item.description;
      
      if (desc.includes('resurfacer') || desc.includes('resurface')) {
        productType = 'resurfacer';
        productName = desc.includes('advantage') ? 'Advantage Resurfacer' : 'Resurfacer';
      } else if (desc.includes('color') && !desc.includes('line')) {
        productType = 'color';
        productName = desc.includes('advantage') ? 'Advantage Color' : 'Color Coat';
        
        // Try to extract color name
        const colorPatterns = [
          /us open blue/i,
          /us open green/i,
          /royal purple/i,
          /standard/i,
        ];
        for (const pattern of colorPatterns) {
          if (pattern.test(desc)) {
            productName = `Advantage ${desc.match(pattern)?.[0]}`;
            break;
          }
        }
      } else if (desc.includes('cushion') && desc.includes('granule')) {
        productType = 'cushion';
        productName = 'Cushion Plus Granule';
      } else if (desc.includes('cushion') && desc.includes('powder')) {
        productType = 'cushion';
        productName = 'Cushion Plus Powder';
      } else if (desc.includes('line') && desc.includes('paint')) {
        productType = 'line_paint';
        productName = 'Line Paint';
      } else if (desc.includes('crack') && desc.includes('filler')) {
        productType = 'specialty';
        productName = 'Crack Filler';
      }
      
      // Only add if we identified a product type
      if (productType !== 'other') {
        materials.push({
          productType,
          productName,
          gallonsRequired: gallons,
        });
      }
    }
  }
  
  // Consolidate duplicates
  const consolidated = new Map<string, MaterialRequirement>();
  for (const mat of materials) {
    const key = `${mat.productType}-${mat.productName}`;
    if (consolidated.has(key)) {
      consolidated.get(key)!.gallonsRequired += mat.gallonsRequired;
    } else {
      consolidated.set(key, { ...mat });
    }
  }
  
  return Array.from(consolidated.values());
}

/**
 * Generate all valid container combinations that meet the required gallons
 */
function generateCombinations(
  gallonsRequired: number,
  containers: ContainerOption[],
  maxContainers: number = 20
): ContainerAllocation[][] {
  const combinations: ContainerAllocation[][] = [];
  
  // Sort containers by size (largest first) for efficiency
  const sortedContainers = [...containers].sort((a, b) => b.containerSize - a.containerSize);
  
  function recurse(
    remaining: number,
    currentCombo: ContainerAllocation[],
    startIndex: number
  ) {
    // If we've met the requirement, save this combination
    if (remaining <= 0) {
      combinations.push([...currentCombo]);
      return;
    }
    
    // Limit total combinations to prevent performance issues
    if (combinations.length >= 50) return;
    
    for (let i = startIndex; i < sortedContainers.length; i++) {
      const container = sortedContainers[i];
      const maxNeeded = Math.ceil(remaining / container.containerSize);
      
      for (let count = 1; count <= Math.min(maxNeeded + 1, maxContainers); count++) {
        const totalContainers = currentCombo.reduce((sum, c) => sum + c.count, 0) + count;
        if (totalContainers > maxContainers) break;
        
        const allocation: ContainerAllocation = {
          item: container,
          count,
          totalGallons: container.containerSize * count,
          totalCost: container.costPerContainer * count,
        };
        
        currentCombo.push(allocation);
        
        const newRemaining = remaining - allocation.totalGallons;
        
        if (newRemaining <= 0) {
          combinations.push([...currentCombo]);
        } else {
          // Only try smaller containers
          recurse(newRemaining, currentCombo, i);
        }
        
        currentCombo.pop();
      }
    }
  }
  
  recurse(gallonsRequired, [], 0);
  
  return combinations;
}

/**
 * Score a container combination based on cost and waste
 */
function scoreCombination(
  combo: ContainerAllocation[],
  gallonsRequired: number
): { totalCost: number; totalGallons: number; wasteGallons: number; wastePercent: number; score: number } {
  const totalGallons = combo.reduce((sum, c) => sum + c.totalGallons, 0);
  const totalCost = combo.reduce((sum, c) => sum + c.totalCost, 0);
  const wasteGallons = totalGallons - gallonsRequired;
  const wastePercent = (wasteGallons / totalGallons) * 100;
  
  // Score: Lower is better
  // Primary factor: cost
  // Secondary factor: waste (penalize high waste)
  const wastePenalty = wastePercent > 30 ? (wastePercent - 30) * 2 : 0;
  const score = totalCost + wastePenalty;
  
  return { totalCost, totalGallons, wasteGallons, wastePercent, score };
}

/**
 * Optimize supply order for a single material requirement
 */
export function optimizeSupplyOrder(
  requirement: MaterialRequirement,
  availableContainers: ContainerOption[]
): SupplyRecommendation {
  const { productType, productName, gallonsRequired } = requirement;
  
  // Filter containers that match the product type
  const matchingContainers = availableContainers.filter(
    c => c.productType === productType
  );
  
  if (matchingContainers.length === 0) {
    return {
      productType,
      productName,
      gallonsRequired,
      options: [],
      stockWarning: 'No matching inventory items found for this product type.',
    };
  }
  
  // Generate all possible combinations
  const combinations = generateCombinations(gallonsRequired, matchingContainers);
  
  if (combinations.length === 0) {
    return {
      productType,
      productName,
      gallonsRequired,
      options: [],
      stockWarning: 'Could not find valid container combinations.',
    };
  }
  
  // Score each combination
  const scoredOptions: SupplyOption[] = combinations.map(combo => {
    const { totalCost, totalGallons, wasteGallons, wastePercent, score } = scoreCombination(combo, gallonsRequired);
    
    return {
      containers: combo,
      totalCost,
      totalGallons,
      wasteGallons,
      wastePercent,
      isRecommended: false,
      reason: '',
      _score: score,
    } as SupplyOption & { _score: number };
  });
  
  // Sort by score (lower is better)
  scoredOptions.sort((a, b) => (a as any)._score - (b as any)._score);
  
  // Remove duplicates and limit to top 5 options
  const uniqueOptions: SupplyOption[] = [];
  const seen = new Set<string>();
  
  for (const option of scoredOptions) {
    const key = option.containers
      .map(c => `${c.item.productCode}:${c.count}`)
      .sort()
      .join('|');
    
    if (!seen.has(key) && uniqueOptions.length < 5) {
      seen.add(key);
      
      // Clean up internal score
      delete (option as any)._score;
      
      uniqueOptions.push(option);
    }
  }
  
  // Mark the recommended option and add reasons
  if (uniqueOptions.length > 0) {
    uniqueOptions[0].isRecommended = true;
    
    if (uniqueOptions[0].wastePercent < 15) {
      uniqueOptions[0].reason = 'Best value - lowest cost with minimal waste';
    } else if (uniqueOptions.length > 1 && uniqueOptions[0].totalCost < uniqueOptions[1].totalCost * 0.8) {
      uniqueOptions[0].reason = 'Lowest cost (saves 20%+ vs alternatives)';
    } else {
      uniqueOptions[0].reason = 'Lowest overall cost';
    }
    
    // Add reasons for alternatives
    for (let i = 1; i < uniqueOptions.length; i++) {
      const opt = uniqueOptions[i];
      if (opt.wastePercent < uniqueOptions[0].wastePercent - 10) {
        opt.reason = 'Less material waste';
      } else if (opt.containers.length < uniqueOptions[0].containers.length) {
        opt.reason = 'Fewer containers to manage';
      } else if (opt.containers.some(c => c.item.isPrimary)) {
        opt.reason = 'Uses primary inventory';
      } else {
        opt.reason = 'Alternative option';
      }
    }
  }
  
  // Check stock levels
  let stockWarning: string | undefined;
  const recommended = uniqueOptions.find(o => o.isRecommended);
  if (recommended) {
    const stockIssues: string[] = [];
    for (const alloc of recommended.containers) {
      if (alloc.item.quantityOnHand < alloc.count) {
        const needed = alloc.count - alloc.item.quantityOnHand;
        stockIssues.push(`Need ${needed} more ${alloc.item.containerType}(s) of ${alloc.item.productName}`);
      }
    }
    if (stockIssues.length > 0) {
      stockWarning = stockIssues.join('; ');
    }
  }
  
  return {
    productType,
    productName,
    gallonsRequired,
    options: uniqueOptions,
    stockWarning,
    selectedOption: uniqueOptions.find(o => o.isRecommended),
  };
}

/**
 * Optimize supplies for all material requirements
 */
export function optimizeAllSupplies(
  requirements: MaterialRequirement[],
  availableContainers: ContainerOption[]
): SupplyRecommendation[] {
  return requirements.map(req => optimizeSupplyOrder(req, availableContainers));
}

/**
 * Calculate total cost for selected supply options
 */
export function calculateTotalSupplyCost(recommendations: SupplyRecommendation[]): number {
  return recommendations.reduce((total, rec) => {
    return total + (rec.selectedOption?.totalCost || 0);
  }, 0);
}

/**
 * Format container description for display
 */
export function formatContainerDescription(alloc: ContainerAllocation): string {
  const { item, count } = alloc;
  const unit = item.containerType === 'pail' ? 'pail' : 
               item.containerType === 'drum' ? 'drum' : 
               item.containerType === 'box' ? 'box' : 'container';
  const unitPlural = count > 1 ? `${unit}s` : unit;
  return `${count}x ${item.containerSize}-gal ${unitPlural}`;
}
