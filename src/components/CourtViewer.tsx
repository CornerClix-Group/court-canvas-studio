import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Eye } from "lucide-react";
import Court3D from "@/components/Court3D";
import LeadCaptureModal from "@/components/LeadCaptureModal";
import { getLeadCookie, trackEvent } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";

// Laykold color palette - Standard Colors
const STANDARD_COLORS = [
  { name: "Forest Green", hex: "#3D4A3A" },
  { name: "Dark Green", hex: "#4A5648" },
  { name: "Medium Green", hex: "#5A6855" },
  { name: "Grass Green", hex: "#6E7D63" },
  { name: "Dark Blue", hex: "#2C3E50" },
  { name: "Light Blue", hex: "#3498B5" },
  { name: "Pro Blue", hex: "#426C85" },
  { name: "Royal Purple", hex: "#3E3854" },
  { name: "Brick Red", hex: "#7B4641" },
  { name: "Burgundy", hex: "#4A3337" },
  { name: "Dark Grey", hex: "#5A6062" },
  { name: "Desert Sand", hex: "#B5A089" },
];

// Laykold color palette - Vibrant Colors
const VIBRANT_COLORS = [
  { name: "Coral", hex: "#B36B70" },
  { name: "Scarlet", hex: "#8A4A45" },
  { name: "Pumpkin", hex: "#D9834E" },
  { name: "Canary", hex: "#E8C75A" },
  { name: "Midnight", hex: "#324D6B" },
  { name: "Teal", hex: "#4B9490" },
  { name: "Arctic", hex: "#6A9AC4" },
  { name: "Black", hex: "#3A3B38" },
  { name: "Key Lime", hex: "#C5CB6E" },
  { name: "Kiwi", hex: "#A7B35E" },
  { name: "Silver", hex: "#929A96" },
  { name: "Mocha", hex: "#7B6759" },
];

// Combined color palette
const LAYKOLD_COLORS = [
  { name: "White", hex: "#FFFFFF" },
  ...STANDARD_COLORS,
  ...VIBRANT_COLORS,
];

const CourtViewer = () => {
  const [courtType, setCourtType] = useState("pickleball");
  const [surfaceColor, setSurfaceColor] = useState("#426C85");
  const [lineColor, setLineColor] = useState("#FFFFFF");
  const [kitchenColor, setKitchenColor] = useState("#6E7D63");
  const [outOfBoundsColor, setOutOfBoundsColor] = useState("#3498B5");
  const [lineWidth, setLineWidth] = useState(2);
  const [showLabels, setShowLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [showLeadModal, setShowLeadModal] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleCourtTypeChange = (newType: string) => {
    setCourtType(newType);
    trackEvent("court_view_change", { court_type: newType });
  };

  const handleColorChange = (colorType: string, value: string) => {
    trackEvent("color_theme_change", { 
      color_type: colorType, 
      color_value: value 
    });
  };

  const handleViewSVGClick = () => {
    const leadId = getLeadCookie();
    
    if (leadId) {
      // User already identified, open SVG directly
      openSVG();
    } else {
      // Show lead capture modal
      setShowLeadModal(true);
    }
  };

  const openSVG = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    trackEvent("svg_open", { court_type: courtType });
    
    window.open(url, "_blank");
    
    toast({
      title: "SVG Opened",
      description: "Your court design is now open in a new tab.",
    });
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const renderCourt = () => {
    const scale = 12 * zoom;
    const linePx = (lineWidth / 12) * scale;

    if (courtType === "pickleball") {
      const courtW = 20 * scale;
      const courtL = 44 * scale;
      const oobPadding = 10 * scale;
      const netY = courtL / 2;
      const nvzDepth = 7 * scale;
      const w = 1000, h = 700;
      const x0 = (w - courtW - oobPadding * 2) / 2;
      const y0 = (h - courtL - oobPadding * 2) / 2;

      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
          <rect x={x0} y={y0} width={courtW + oobPadding * 2} height={courtL + oobPadding * 2} fill={outOfBoundsColor} rx="8" />
          <rect x={x0 + oobPadding} y={y0 + oobPadding} width={courtW} height={courtL} fill={surfaceColor} rx="4" />
          <line x1={x0 + oobPadding} y1={y0 + oobPadding} x2={x0 + oobPadding} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
          <line x1={x0 + oobPadding + courtW} y1={y0 + oobPadding} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
          <line x1={x0 + oobPadding} y1={y0 + oobPadding} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding} stroke={lineColor} strokeWidth={linePx} />
          <line x1={x0 + oobPadding} y1={y0 + oobPadding + courtL} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
          <line x1={x0 + oobPadding} y1={y0 + oobPadding + netY - nvzDepth} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + netY - nvzDepth} stroke={lineColor} strokeWidth={linePx} />
          <line x1={x0 + oobPadding} y1={y0 + oobPadding + netY + nvzDepth} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + netY + nvzDepth} stroke={lineColor} strokeWidth={linePx} />
          <line x1={x0 + oobPadding + courtW / 2} y1={y0 + oobPadding} x2={x0 + oobPadding + courtW / 2} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
          <rect x={x0 + oobPadding} y={y0 + oobPadding + netY - nvzDepth} width={courtW} height={nvzDepth * 2} fill={kitchenColor} opacity="0.3" />
          <line x1={x0 + oobPadding} y1={y0 + oobPadding + netY} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + netY} stroke="black" strokeWidth={Math.max(2, linePx / 2)} strokeDasharray="4" />
          {showLabels && (
            <g className="text-xs fill-secondary">
              <text x={x0 + oobPadding + courtW / 2} y={y0 + oobPadding - 10} textAnchor="middle" className="text-xs">Baseline</text>
              <text x={x0 + oobPadding + courtW / 2} y={y0 + oobPadding + courtL + 20} textAnchor="middle" className="text-xs">Baseline</text>
              <text x={x0 + oobPadding + courtW / 2 + 8} y={y0 + oobPadding + netY} className="text-xs">Net</text>
            </g>
          )}
        </svg>
      );
    }

    if (courtType === "basketball-full") {
      const courtW = 50 * scale;
      const courtL = 94 * scale;
      const oobPadding = 10 * scale;
      const keyW = 16 * scale; // Width of free throw lane
      const keyL = 19 * scale; // Length from baseline to free throw line
      const threePointRadius = 23.75 * scale; // 3-point arc radius (NBA)
      const cornerOffsetX = 22 * scale; // distance from center to straight 3PT lines
      const basketOffset = 4.75 * scale; // rim center from baseline (approx.)
      const centerCircleRadius = 6 * scale;
      const w = 1200, h = 900;
      const x0 = (w - courtW - oobPadding * 2) / 2;
      const y0 = (h - courtL - oobPadding * 2) / 2;
      const cx = x0 + oobPadding + courtW / 2;

      // Hoop centers
      const hoopBottomY = y0 + oobPadding + courtL - basketOffset;
      const hoopTopY = y0 + oobPadding + basketOffset;

      // Intersection height of arc with straight corner lines
      const delta = Math.sqrt(Math.max(0, threePointRadius * threePointRadius - cornerOffsetX * cornerOffsetX));
      const arcBottomY = hoopBottomY - delta;
      const arcTopY = hoopTopY + delta;
      const xLeft = cx - cornerOffsetX;
      const xRight = cx + cornerOffsetX;

      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
          {/* Out of bounds */}
          <rect x={x0} y={y0} width={courtW + oobPadding * 2} height={courtL + oobPadding * 2} fill={outOfBoundsColor} rx="8" />
          {/* Court surface */}
          <rect x={x0 + oobPadding} y={y0 + oobPadding} width={courtW} height={courtL} fill={surfaceColor} rx="4" />
          
          {/* Perimeter */}
          <line x1={x0 + oobPadding} y1={y0 + oobPadding} x2={x0 + oobPadding} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
          <line x1={x0 + oobPadding + courtW} y1={y0 + oobPadding} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
          <line x1={x0 + oobPadding} y1={y0 + oobPadding} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding} stroke={lineColor} strokeWidth={linePx} />
          <line x1={x0 + oobPadding} y1={y0 + oobPadding + courtL} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
          
          {/* Half court line */}
          <line x1={x0 + oobPadding} y1={y0 + oobPadding + courtL / 2} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + courtL / 2} stroke={lineColor} strokeWidth={linePx} />
          
          {/* Center circle */}
          <circle cx={cx} cy={y0 + oobPadding + courtL / 2} r={centerCircleRadius} fill="none" stroke={lineColor} strokeWidth={linePx} />
          
          {/* Bottom court - Key/Paint */}
          <rect x={cx - keyW / 2} y={y0 + oobPadding + courtL - keyL} width={keyW} height={keyL} fill="none" stroke={lineColor} strokeWidth={linePx} />
          {/* Free throw circle */}
          <circle cx={cx} cy={y0 + oobPadding + courtL - keyL} r={6 * scale} fill="none" stroke={lineColor} strokeWidth={linePx} />
          
          {/* 3-point - bottom (correct geometry) */}
          {/* Straight corner lines */}
          <line x1={xLeft} y1={y0 + oobPadding + courtL} x2={xLeft} y2={arcBottomY} stroke={lineColor} strokeWidth={linePx} />
          <line x1={xRight} y1={y0 + oobPadding + courtL} x2={xRight} y2={arcBottomY} stroke={lineColor} strokeWidth={linePx} />
          {/* Arc */}
          <path d={`M ${xLeft} ${arcBottomY} A ${threePointRadius} ${threePointRadius} 0 0 1 ${xRight} ${arcBottomY}`} fill="none" stroke={lineColor} strokeWidth={linePx} />
          
          {/* Top court - Key/Paint */}
          <rect x={cx - keyW / 2} y={y0 + oobPadding} width={keyW} height={keyL} fill="none" stroke={lineColor} strokeWidth={linePx} />
          {/* Free throw circle */}
          <circle cx={cx} cy={y0 + oobPadding + keyL} r={6 * scale} fill="none" stroke={lineColor} strokeWidth={linePx} />
          
          {/* 3-point - top (correct geometry) */}
          {/* Straight corner lines */}
          <line x1={xLeft} y1={y0 + oobPadding} x2={xLeft} y2={arcTopY} stroke={lineColor} strokeWidth={linePx} />
          <line x1={xRight} y1={y0 + oobPadding} x2={xRight} y2={arcTopY} stroke={lineColor} strokeWidth={linePx} />
          {/* Arc */}
          <path d={`M ${xLeft} ${arcTopY} A ${threePointRadius} ${threePointRadius} 0 0 0 ${xRight} ${arcTopY}`} fill="none" stroke={lineColor} strokeWidth={linePx} />
          
          {showLabels && (
            <g className="text-xs fill-secondary">
              <text x={cx} y={y0 + oobPadding - 10} textAnchor="middle">Basketball Full Court (94' × 50')</text>
            </g>
          )}
        </svg>
      );
    }

    if (courtType === "basketball-half") {
      const courtW = 50 * scale;
      const courtL = 47 * scale;
      const oobPadding = 10 * scale;
      const keyW = 16 * scale;
      const keyL = 19 * scale;
      const threePointRadius = 23.75 * scale;
      const cornerOffsetX = 22 * scale;
      const basketOffset = 4.75 * scale;
      const w = 1200, h = 700;
      const x0 = (w - courtW - oobPadding * 2) / 2;
      const y0 = (h - courtL - oobPadding * 2) / 2;
      const cx = x0 + oobPadding + courtW / 2;

      const hoopBottomY = y0 + oobPadding + courtL - basketOffset;
      const delta = Math.sqrt(Math.max(0, threePointRadius * threePointRadius - cornerOffsetX * cornerOffsetX));
      const arcBottomY = hoopBottomY - delta;
      const xLeft = cx - cornerOffsetX;
      const xRight = cx + cornerOffsetX;

      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
          {/* Out of bounds */}
          <rect x={x0} y={y0} width={courtW + oobPadding * 2} height={courtL + oobPadding * 2} fill={outOfBoundsColor} rx="8" />
          {/* Court surface */}
          <rect x={x0 + oobPadding} y={y0 + oobPadding} width={courtW} height={courtL} fill={surfaceColor} rx="4" />
          
          {/* Perimeter */}
          <line x1={x0 + oobPadding} y1={y0 + oobPadding} x2={x0 + oobPadding} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
          <line x1={x0 + oobPadding + courtW} y1={y0 + oobPadding} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
          <line x1={x0 + oobPadding} y1={y0 + oobPadding} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding} stroke={lineColor} strokeWidth={linePx} />
          <line x1={x0 + oobPadding} y1={y0 + oobPadding + courtL} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
          
          {/* Key/Paint */}
          <rect x={cx - keyW / 2} y={y0 + oobPadding + courtL - keyL} width={keyW} height={keyL} fill="none" stroke={lineColor} strokeWidth={linePx} />
          {/* Free throw circle */}
          <circle cx={cx} cy={y0 + oobPadding + courtL - keyL} r={6 * scale} fill="none" stroke={lineColor} strokeWidth={linePx} />
          
          {/* 3-point - bottom (correct geometry) */}
          <line x1={xLeft} y1={y0 + oobPadding + courtL} x2={xLeft} y2={arcBottomY} stroke={lineColor} strokeWidth={linePx} />
          <line x1={xRight} y1={y0 + oobPadding + courtL} x2={xRight} y2={arcBottomY} stroke={lineColor} strokeWidth={linePx} />
          <path d={`M ${xLeft} ${arcBottomY} A ${threePointRadius} ${threePointRadius} 0 0 1 ${xRight} ${arcBottomY}`} fill="none" stroke={lineColor} strokeWidth={linePx} />
          
          {showLabels && (
            <g className="text-xs fill-secondary">
              <text x={cx} y={y0 + oobPadding + courtL + 20} textAnchor="middle">Basketball Half Court (47' × 50')</text>
            </g>
          )}
        </svg>
      );
    }

    // Tennis court rendering
    const isSingles = courtType === "tennis-singles";
    const courtL = 78 * scale;
    const courtW = (isSingles ? 27 : 36) * scale;
    const oobPadding = 12 * scale;
    const svcFromNet = 21 * scale;
    const netY = courtL / 2;
    const w = 1200, h = 800;
    const x0 = (w - courtW - oobPadding * 2) / 2;
    const y0 = (h - courtL - oobPadding * 2) / 2;

    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
        <rect x={x0} y={y0} width={courtW + oobPadding * 2} height={courtL + oobPadding * 2} fill={outOfBoundsColor} rx="8" />
        <rect x={x0 + oobPadding} y={y0 + oobPadding} width={courtW} height={courtL} fill={surfaceColor} rx="4" />
        <line x1={x0 + oobPadding} y1={y0 + oobPadding} x2={x0 + oobPadding} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
        <line x1={x0 + oobPadding + courtW} y1={y0 + oobPadding} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
        {!isSingles && (
          <>
            <line x1={x0 + oobPadding + 4.5 * scale} y1={y0 + oobPadding} x2={x0 + oobPadding + 4.5 * scale} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
            <line x1={x0 + oobPadding + courtW - 4.5 * scale} y1={y0 + oobPadding} x2={x0 + oobPadding + courtW - 4.5 * scale} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
          </>
        )}
        <line x1={x0 + oobPadding} y1={y0 + oobPadding} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding} stroke={lineColor} strokeWidth={linePx} />
        <line x1={x0 + oobPadding} y1={y0 + oobPadding + courtL} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + courtL} stroke={lineColor} strokeWidth={linePx} />
        <line x1={x0 + oobPadding} y1={y0 + oobPadding + netY - svcFromNet} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + netY - svcFromNet} stroke={lineColor} strokeWidth={linePx} />
        <line x1={x0 + oobPadding} y1={y0 + oobPadding + netY + svcFromNet} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + netY + svcFromNet} stroke={lineColor} strokeWidth={linePx} />
        <line x1={x0 + oobPadding + courtW / 2} y1={y0 + oobPadding + netY - svcFromNet} x2={x0 + oobPadding + courtW / 2} y2={y0 + oobPadding + netY + svcFromNet} stroke={lineColor} strokeWidth={linePx} />
        <line x1={x0 + oobPadding} y1={y0 + oobPadding + netY} x2={x0 + oobPadding + courtW} y2={y0 + oobPadding + netY} stroke="black" strokeWidth={Math.max(2, linePx / 2)} strokeDasharray="4" />
        {showLabels && (
          <g className="text-xs fill-secondary">
            <text x={x0 + oobPadding + courtW / 2} y={y0 + oobPadding - 10} textAnchor="middle" className="text-xs">Baseline</text>
            <text x={x0 + oobPadding + courtW / 2} y={y0 + oobPadding + courtL + 20} textAnchor="middle" className="text-xs">Baseline</text>
          </g>
        )}
      </svg>
    );
  };

  const getSportType = () => {
    if (courtType.startsWith("basketball")) return "basketball";
    if (courtType.startsWith("tennis")) return "tennis";
    return "pickleball";
  };

  return (
    <section id="viewer" className="py-16 md:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-secondary mb-2">Interactive Court Viewer</h2>
            <p className="text-muted-foreground text-lg">
              Customize your court design with 2D/3D views, Laykold colors, and export your layout.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>View Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={viewMode === "2d" ? "default" : "outline"}
                    onClick={() => setViewMode("2d")}
                    className="w-full"
                  >
                    2D
                  </Button>
                  <Button
                    variant={viewMode === "3d" ? "default" : "outline"}
                    onClick={() => setViewMode("3d")}
                    className="w-full"
                  >
                    3D
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Court Type</Label>
                <Select value={courtType} onValueChange={handleCourtTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="pickleball">Pickleball (44' × 20')</SelectItem>
                    <SelectItem value="tennis-singles">Tennis – Singles (78' × 27')</SelectItem>
                    <SelectItem value="tennis-doubles">Tennis – Doubles (78' × 36')</SelectItem>
                    <SelectItem value="basketball-full">Basketball – Full (94' × 50')</SelectItem>
                    <SelectItem value="basketball-half">Basketball – Half (47' × 50')</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Surface Color (Laykold)</Label>
                <Select value={surfaceColor} onValueChange={(val) => { setSurfaceColor(val); handleColorChange("surface", val); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover max-h-80">
                    {LAYKOLD_COLORS.map((color) => (
                      <SelectItem key={color.hex} value={color.hex}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: color.hex }} />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Line Color (Laykold)</Label>
                <Select value={lineColor} onValueChange={(val) => { setLineColor(val); handleColorChange("line", val); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover max-h-80">
                    {LAYKOLD_COLORS.map((color) => (
                      <SelectItem key={color.hex} value={color.hex}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border" style={{ backgroundColor: color.hex }} />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {courtType === "pickleball" && (
                <div className="space-y-2">
                  <Label>Kitchen Area Color (Laykold)</Label>
                  <Select value={kitchenColor} onValueChange={(val) => { setKitchenColor(val); handleColorChange("kitchen", val); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover max-h-80">
                      {LAYKOLD_COLORS.map((color) => (
                        <SelectItem key={color.hex} value={color.hex}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: color.hex }} />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Out of Bounds Color (Laykold)</Label>
                <Select value={outOfBoundsColor} onValueChange={(val) => { setOutOfBoundsColor(val); handleColorChange("out_of_bounds", val); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover max-h-80">
                    {LAYKOLD_COLORS.map((color) => (
                      <SelectItem key={color.hex} value={color.hex}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border" style={{ backgroundColor: color.hex }} />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {viewMode === "2d" && (
                <div className="space-y-2">
                  <Label>Line Width: {lineWidth.toFixed(2)} inches</Label>
                  <Slider value={[lineWidth]} onValueChange={([val]) => setLineWidth(val)} min={1} max={4} step={0.25} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {viewMode === "2d" && (
                  <>
                    <Button variant="outline" onClick={() => setZoom(1)}>Reset View</Button>
                    <Button variant="outline" onClick={() => setShowLabels(!showLabels)}>
                      {showLabels ? "Hide" : "Show"} Labels
                    </Button>
                  </>
                )}
              </div>

              <Button onClick={handleViewSVGClick} className="w-full font-semibold gap-2">
                <Eye className="w-4 h-4" />
                View SVG File
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              {viewMode === "2d" ? (
                <>
                  <div ref={svgRef} className="overflow-auto border border-border rounded-lg bg-muted p-4">
                    {renderCourt()}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Scale: 1 ft = 12 px</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>+</Button>
                      <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>−</Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[600px] border border-border rounded-lg overflow-hidden">
                  <Court3D
                    courtType={courtType}
                    surfaceColor={surfaceColor}
                    lineColor={lineColor}
                    kitchenColor={kitchenColor}
                    outOfBoundsColor={outOfBoundsColor}
                    lineWidth={lineWidth}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <LeadCaptureModal
        open={showLeadModal}
        onOpenChange={setShowLeadModal}
        courtType={getSportType()}
        onSuccess={openSVG}
      />
    </section>
  );
};

export default CourtViewer;