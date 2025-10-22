import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// Laykold color palette
const LAYKOLD_COLORS = [
  { name: "US Open Blue", hex: "#1A3D8E" },
  { name: "US Open Green", hex: "#6DBE45" },
  { name: "Pro Blue", hex: "#004C97" },
  { name: "Dark Green", hex: "#006341" },
  { name: "Medium Green", hex: "#009639" },
  { name: "Forest Green", hex: "#004B28" },
  { name: "Brick Red", hex: "#A4343A" },
  { name: "Terracotta", hex: "#C75146" },
  { name: "Light Blue", hex: "#0076BE" },
  { name: "Light Green", hex: "#8DC63F" },
  { name: "Championship Purple", hex: "#532D82" },
  { name: "Cool Gray", hex: "#9A9A9A" },
  { name: "Clay Red", hex: "#B84131" },
  { name: "Tan", hex: "#D9B382" },
  { name: "White", hex: "#FFFFFF" },
];

const CourtViewer = () => {
  const [courtType, setCourtType] = useState("pickleball");
  const [surfaceColor, setSurfaceColor] = useState("#1A3D8E");
  const [lineColor, setLineColor] = useState("#FFFFFF");
  const [kitchenColor, setKitchenColor] = useState("#6DBE45");
  const [outOfBoundsColor, setOutOfBoundsColor] = useState("#0076BE");
  const [lineWidth, setLineWidth] = useState(2);
  const [showLabels, setShowLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<HTMLDivElement>(null);

  const renderCourt = () => {
    const scale = 12 * zoom;
    const linePx = (lineWidth / 12) * scale;

    if (courtType === "pickleball") {
      const courtW = 20 * scale;
      const courtL = 44 * scale;
      const oobPadding = 10 * scale; // 10 feet out of bounds
      const netY = courtL / 2;
      const nvzDepth = 7 * scale;
      const w = 1000, h = 700;
      const x0 = (w - courtW - oobPadding * 2) / 2;
      const y0 = (h - courtL - oobPadding * 2) / 2;

      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
          {/* Out of bounds area */}
          <rect x={x0} y={y0} width={courtW + oobPadding * 2} height={courtL + oobPadding * 2} fill={outOfBoundsColor} rx="8" />
          {/* Court surface */}
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
              <text x={x0 + oobPadding / 2} y={y0 + oobPadding + courtL / 2} textAnchor="middle" className="text-xs" transform={`rotate(-90 ${x0 + oobPadding / 2} ${y0 + oobPadding + courtL / 2})`}>Out of Bounds</text>
            </g>
          )}
        </svg>
      );
    }

    // Tennis court rendering
    const isSingles = courtType === "tennis-singles";
    const courtL = 78 * scale;
    const courtW = (isSingles ? 27 : 36) * scale;
    const oobPadding = 12 * scale; // 12 feet out of bounds for tennis
    const svcFromNet = 21 * scale;
    const netY = courtL / 2;
    const w = 1200, h = 800;
    const x0 = (w - courtW - oobPadding * 2) / 2;
    const y0 = (h - courtL - oobPadding * 2) / 2;

    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
        {/* Out of bounds area */}
        <rect x={x0} y={y0} width={courtW + oobPadding * 2} height={courtL + oobPadding * 2} fill={outOfBoundsColor} rx="8" />
        {/* Court surface */}
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
            <text x={x0 + oobPadding / 2} y={y0 + oobPadding + courtL / 2} textAnchor="middle" className="text-xs" transform={`rotate(-90 ${x0 + oobPadding / 2} ${y0 + oobPadding + courtL / 2})`}>Out of Bounds</text>
          </g>
        )}
      </svg>
    );
  };

  const exportSVG = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "courtpro_view.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="viewer" className="py-16 md:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-secondary mb-2">Interactive Court Viewer</h2>
            <p className="text-muted-foreground text-lg">
              Toggle between tennis & pickleball, choose Laykold colors, and export your layout.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Court Type</Label>
                <Select value={courtType} onValueChange={setCourtType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="pickleball">Pickleball (44' × 20')</SelectItem>
                    <SelectItem value="tennis-singles">Tennis – Singles (78' × 27')</SelectItem>
                    <SelectItem value="tennis-doubles">Tennis – Doubles (78' × 36')</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Surface Color (Laykold)</Label>
                <Select value={surfaceColor} onValueChange={setSurfaceColor}>
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
                <Select value={lineColor} onValueChange={setLineColor}>
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
                  <Select value={kitchenColor} onValueChange={setKitchenColor}>
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
                <Select value={outOfBoundsColor} onValueChange={setOutOfBoundsColor}>
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

              <div className="space-y-2">
                <Label>Line Width: {lineWidth.toFixed(2)} inches</Label>
                <Slider value={[lineWidth]} onValueChange={([val]) => setLineWidth(val)} min={1} max={4} step={0.25} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setZoom(1)}>Reset View</Button>
                <Button variant="outline" onClick={() => setShowLabels(!showLabels)}>
                  {showLabels ? "Hide" : "Show"} Labels
                </Button>
              </div>

              <Button onClick={exportSVG} className="w-full font-semibold">
                Export SVG
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="p-6">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CourtViewer;
