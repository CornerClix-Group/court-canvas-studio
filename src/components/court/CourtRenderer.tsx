/**
 * CourtRenderer — SVG-based court visualizer used by the public Designer
 * and the customer Approval flow. Always renders LANDSCAPE.
 *
 * Two view modes: top-down (technical, exact) and 3D perspective (CSS skew
 * for a paper-on-table feel — no Three.js).
 */
import { useMemo } from "react";
import {
  COURT_TYPES,
  CourtType,
  getColorHex,
  getViewBox,
} from "@/lib/courtGeometry";

interface CourtRendererProps {
  courtType: CourtType;
  innerColor: string; // Laykold color name
  outerColor: string;
  lineColor: string;
  showNet?: boolean;
  view?: "top" | "perspective";
  className?: string;
  ariaLabel?: string;
}

const LINE_WIDTH_FT = 0.16; // ~2 inches, scaled in feet

export function CourtRenderer({
  courtType,
  innerColor,
  outerColor,
  lineColor,
  showNet = true,
  view = "top",
  className,
  ariaLabel,
}: CourtRendererProps) {
  const meta = COURT_TYPES[courtType];
  const vb = getViewBox(courtType);
  const innerHex = getColorHex(innerColor);
  const outerHex = getColorHex(outerColor);
  const lineHex = getColorHex(lineColor);

  // Centered playing surface inside the outer pad.
  const padX = (vb.width - meta.playing.length) / 2;
  const padY = (vb.height - meta.playing.width) / 2;

  const lines = useMemo(
    () => buildLines(courtType, vb, padX, padY, meta, lineHex, showNet),
    [courtType, vb.width, vb.height, padX, padY, meta, lineHex, showNet]
  );

  const wrapperStyle: React.CSSProperties =
    view === "perspective"
      ? {
          transform: "perspective(1400px) rotateX(34deg) rotateZ(-2deg)",
          transformOrigin: "center center",
          transition: "transform 400ms ease",
          filter: "drop-shadow(0 24px 28px rgba(0,0,0,0.32))",
        }
      : {
          transition: "transform 400ms ease",
          filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.18))",
        };

  return (
    <div className={className} style={{ width: "100%" }}>
      <div style={wrapperStyle}>
        <svg
          viewBox={`0 0 ${vb.width} ${vb.height}`}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={ariaLabel ?? `${meta.label} preview`}
          style={{ width: "100%", height: "auto", display: "block", borderRadius: 6 }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Outer pad */}
          <rect x={0} y={0} width={vb.width} height={vb.height} fill={outerHex} />
          {/* Subtle texture hint */}
          <rect x={0} y={0} width={vb.width} height={vb.height} fill="url(#texGrain)" opacity={0.06} />
          {/* Inner playing surface */}
          <rect
            x={padX}
            y={padY}
            width={meta.playing.length}
            height={meta.playing.width}
            fill={innerHex}
          />
          {lines}
          <defs>
            <pattern id="texGrain" width="2" height="2" patternUnits="userSpaceOnUse">
              <rect width="2" height="2" fill="#000" opacity="0.05" />
              <circle cx="1" cy="1" r="0.4" fill="#fff" opacity="0.18" />
            </pattern>
          </defs>
        </svg>
      </div>
    </div>
  );
}

// ─── Line builders per court type ────────────────────────────────────────

function buildLines(
  courtType: CourtType,
  vb: { width: number; height: number },
  padX: number,
  padY: number,
  meta: typeof COURT_TYPES[CourtType],
  lineHex: string,
  showNet: boolean
): JSX.Element {
  const lw = LINE_WIDTH_FT;
  // Helpers
  const stroke = lineHex;
  const sw = lw;

  // Playing surface boundaries (the perimeter of the inner court)
  const left = padX;
  const right = padX + meta.playing.length;
  const top = padY;
  const bottom = padY + meta.playing.width;
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;

  const elements: JSX.Element[] = [];

  // Always draw playing-surface perimeter
  elements.push(
    <rect
      key="perimeter"
      x={left}
      y={top}
      width={meta.playing.length}
      height={meta.playing.width}
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
    />
  );

  if (courtType === "tennis") {
    // Singles sidelines: 4.5' inset from doubles (top/bottom in landscape view)
    const singlesInset = 4.5;
    elements.push(
      <line key="sgl-top" x1={left} y1={top + singlesInset} x2={right} y2={top + singlesInset} stroke={stroke} strokeWidth={sw} />,
      <line key="sgl-bot" x1={left} y1={bottom - singlesInset} x2={right} y2={bottom - singlesInset} stroke={stroke} strokeWidth={sw} />,
    );
    // Service lines: 21' from net (which is at center)
    const svcOffset = 21;
    elements.push(
      <line key="svc-l" x1={cx - svcOffset} y1={top + singlesInset} x2={cx - svcOffset} y2={bottom - singlesInset} stroke={stroke} strokeWidth={sw} />,
      <line key="svc-r" x1={cx + svcOffset} y1={top + singlesInset} x2={cx + svcOffset} y2={bottom - singlesInset} stroke={stroke} strokeWidth={sw} />,
    );
    // Center service line
    elements.push(
      <line key="ctr-svc" x1={cx - svcOffset} y1={cy} x2={cx + svcOffset} y2={cy} stroke={stroke} strokeWidth={sw} />,
    );
    // Center marks at baselines
    elements.push(
      <line key="ctr-bl-l" x1={left} y1={cy - 0.5} x2={left} y2={cy + 0.5} stroke={stroke} strokeWidth={sw} />,
      <line key="ctr-bl-r" x1={right} y1={cy - 0.5} x2={right} y2={cy + 0.5} stroke={stroke} strokeWidth={sw} />,
    );
    if (showNet) {
      elements.push(
        <line key="net" x1={cx} y1={top - 1.5} x2={cx} y2={bottom + 1.5} stroke="#222" strokeWidth={sw * 1.4} />,
        <rect key="net-tape" x={cx - sw} y={top - 1.5} width={sw * 2} height={bottom - top + 3} fill="#fff" opacity={0.85} />,
      );
    }
  }

  if (courtType === "pickleball") {
    // NVZ (kitchen): 7' from net on each side
    elements.push(
      <line key="nvz-l" x1={cx - 7} y1={top} x2={cx - 7} y2={bottom} stroke={stroke} strokeWidth={sw} />,
      <line key="nvz-r" x1={cx + 7} y1={top} x2={cx + 7} y2={bottom} stroke={stroke} strokeWidth={sw} />,
    );
    // Center service line (only between baseline and NVZ on each side)
    elements.push(
      <line key="ctr-l" x1={left} y1={cy} x2={cx - 7} y2={cy} stroke={stroke} strokeWidth={sw} />,
      <line key="ctr-r" x1={cx + 7} y1={cy} x2={right} y2={cy} stroke={stroke} strokeWidth={sw} />,
    );
    if (showNet) {
      elements.push(
        <line key="net" x1={cx} y1={top - 1.5} x2={cx} y2={bottom + 1.5} stroke="#222" strokeWidth={sw * 1.4} />,
      );
    }
  }

  if (courtType === "pickleball_double") {
    // Two pickleball courts STACKED top-and-bottom, each 20' wide × 44' long
    const courtH = 20;
    const gap = 4; // shared OOB strip between them
    const topCourtY = padY + (meta.playing.width - (courtH * 2 + gap)) / 2;
    const botCourtY = topCourtY + courtH + gap;
    // Re-paint outer pad area between them (already outer color)
    [topCourtY, botCourtY].forEach((courtTop, i) => {
      const cBottom = courtTop + courtH;
      const cyL = (courtTop + cBottom) / 2;
      const k = `c${i}-`;
      elements.push(
        <rect key={k + "perim"} x={left} y={courtTop} width={meta.playing.length} height={courtH} fill="none" stroke={stroke} strokeWidth={sw} />,
        <line key={k + "nvz-l"} x1={cx - 7} y1={courtTop} x2={cx - 7} y2={cBottom} stroke={stroke} strokeWidth={sw} />,
        <line key={k + "nvz-r"} x1={cx + 7} y1={courtTop} x2={cx + 7} y2={cBottom} stroke={stroke} strokeWidth={sw} />,
        <line key={k + "ctr-l"} x1={left} y1={cyL} x2={cx - 7} y2={cyL} stroke={stroke} strokeWidth={sw} />,
        <line key={k + "ctr-r"} x1={cx + 7} y1={cyL} x2={right} y2={cyL} stroke={stroke} strokeWidth={sw} />,
      );
      if (showNet) {
        elements.push(
          <line key={k + "net"} x1={cx} y1={courtTop - 1} x2={cx} y2={cBottom + 1} stroke="#222" strokeWidth={sw * 1.4} />,
        );
      }
    });
    // Remove the misleading outer perimeter rectangle
    elements.shift();
  }

  if (courtType === "basketball" || courtType === "basketball_pickleball") {
    // Half-court line at center
    elements.push(
      <line key="half" x1={cx} y1={top} x2={cx} y2={bottom} stroke={stroke} strokeWidth={sw} />,
      <circle key="ctr-c" cx={cx} cy={cy} r={6} fill="none" stroke={stroke} strokeWidth={sw} />,
    );
    // Free-throw lanes (the "key") — each 12' wide × 19' long from baseline
    const laneLen = 19;
    const laneW = 12;
    elements.push(
      <rect key="key-l" x={left} y={cy - laneW / 2} width={laneLen} height={laneW} fill="none" stroke={stroke} strokeWidth={sw} />,
      <rect key="key-r" x={right - laneLen} y={cy - laneW / 2} width={laneLen} height={laneW} fill="none" stroke={stroke} strokeWidth={sw} />,
      // Free-throw circles
      <circle key="ft-l" cx={left + laneLen} cy={cy} r={6} fill="none" stroke={stroke} strokeWidth={sw} />,
      <circle key="ft-r" cx={right - laneLen} cy={cy} r={6} fill="none" stroke={stroke} strokeWidth={sw} />,
      // Backboards (visual marker)
      <line key="bb-l" x1={left + 4} y1={cy - 3} x2={left + 4} y2={cy + 3} stroke={stroke} strokeWidth={sw * 1.4} />,
      <line key="bb-r" x1={right - 4} y1={cy - 3} x2={right - 4} y2={cy + 3} stroke={stroke} strokeWidth={sw * 1.4} />,
    );
    // Three-point arc — 22' radius from rim (rim ~5.25' from baseline)
    const rimL = left + 5.25;
    const rimR = right - 5.25;
    const arcR = 22;
    elements.push(
      <path
        key="3pt-l"
        d={`M ${rimL} ${cy - arcR} A ${arcR} ${arcR} 0 0 1 ${rimL} ${cy + arcR}`}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />,
      <path
        key="3pt-r"
        d={`M ${rimR} ${cy - arcR} A ${arcR} ${arcR} 0 0 0 ${rimR} ${cy + arcR}`}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />,
    );

    if (courtType === "basketball_pickleball") {
      // CONTRASTING line color for pickleball overlay — pick by simple rule
      const overlayHex = pickContrastingLine(lineHex);
      const courtH = 20;
      const courtL = 44;
      const gap = 4;
      const topCourtY = cy - (courtH + gap / 2);
      const botCourtY = cy + gap / 2;
      const pbLeft = cx - courtL / 2;
      const pbRight = cx + courtL / 2;
      [topCourtY, botCourtY].forEach((courtTop, i) => {
        const cBottom = courtTop + courtH;
        const cyL = (courtTop + cBottom) / 2;
        const k = `pb${i}-`;
        elements.push(
          <rect key={k + "perim"} x={pbLeft} y={courtTop} width={courtL} height={courtH} fill="none" stroke={overlayHex} strokeWidth={sw} />,
          <line key={k + "nvz-l"} x1={cx - 7} y1={courtTop} x2={cx - 7} y2={cBottom} stroke={overlayHex} strokeWidth={sw} />,
          <line key={k + "nvz-r"} x1={cx + 7} y1={courtTop} x2={cx + 7} y2={cBottom} stroke={overlayHex} strokeWidth={sw} />,
          <line key={k + "ctr-l"} x1={pbLeft} y1={cyL} x2={cx - 7} y2={cyL} stroke={overlayHex} strokeWidth={sw} />,
          <line key={k + "ctr-r"} x1={cx + 7} y1={cyL} x2={pbRight} y2={cyL} stroke={overlayHex} strokeWidth={sw} />,
        );
        if (showNet) {
          elements.push(
            <line key={k + "net"} x1={cx} y1={courtTop - 0.5} x2={cx} y2={cBottom + 0.5} stroke="#222" strokeWidth={sw * 1.2} />,
          );
        }
      });
    }
  }

  return <g>{elements}</g>;
}

// White → yellow contrast, otherwise → white. Always picks a Laykold line color.
function pickContrastingLine(currentLineHex: string): string {
  const lower = currentLineHex.toLowerCase();
  if (lower === "#ffffff") return "#F2C33D"; // yellow
  if (lower === "#f2c33d") return "#FFFFFF"; // white
  return "#FFFFFF";
}
