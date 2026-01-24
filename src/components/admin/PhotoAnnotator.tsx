import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnnotationToolbar, type AnnotationTool } from "./AnnotationToolbar";
import { MeasurementDialog } from "./MeasurementDialog";
import { renderAnnotations, type AnnotationElement, type AnnotationsData } from "@/lib/imageUtils";

interface PhotoAnnotatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageName: string;
  annotations: AnnotationsData | null;
  onSave: (annotations: AnnotationsData) => void;
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
}

export function PhotoAnnotator({
  open,
  onOpenChange,
  imageUrl,
  imageName,
  annotations,
  onSave,
}: PhotoAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const [activeTool, setActiveTool] = useState<AnnotationTool>('measurement');
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [elements, setElements] = useState<AnnotationElement[]>(annotations?.elements || []);
  const [history, setHistory] = useState<AnnotationElement[][]>([annotations?.elements || []]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [drawing, setDrawing] = useState<DrawingState>({ isDrawing: false, startX: 0, startY: 0 });
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false);
  const [pendingMeasurement, setPendingMeasurement] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [textValue, setTextValue] = useState("");
  const [scale, setScale] = useState(1);

  // Load image and set up canvas
  useEffect(() => {
    if (!open || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Scale canvas to fit container while maintaining aspect ratio
      const container = canvas.parentElement;
      if (!container) return;
      
      const maxWidth = container.clientWidth;
      const maxHeight = window.innerHeight * 0.6;
      
      const imgScale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      setScale(imgScale);
      
      canvas.width = img.width * imgScale;
      canvas.height = img.height * imgScale;
      
      redraw();
    };
    img.src = imageUrl;
  }, [open, imageUrl]);

  // Redraw canvas when elements change
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Draw annotations
    if (elements.length > 0) {
      renderAnnotations(ctx, { version: 1, elements }, scale);
    }
  }, [elements, scale]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      const initialElements = annotations?.elements || [];
      setElements(initialElements);
      setHistory([initialElements]);
      setHistoryIndex(0);
    }
  }, [open, annotations]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Convert to unscaled coordinates for storage
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  const addToHistory = (newElements: AnnotationElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setElements(newElements);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (textInput.visible) return;
    
    const { x, y } = getCanvasCoords(e);
    
    if (activeTool === 'text') {
      setTextInput({ x, y, visible: true });
      setTextValue("");
      return;
    }
    
    setDrawing({ isDrawing: true, startX: x, startY: y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.isDrawing) return;
    
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !img || !ctx) return;
    
    // Redraw everything then preview current stroke
    redraw();
    
    ctx.strokeStyle = activeColor;
    ctx.fillStyle = activeColor;
    ctx.lineWidth = 2 * scale;
    ctx.lineCap = 'round';
    
    const startX = drawing.startX * scale;
    const startY = drawing.startY * scale;
    const endX = x * scale;
    const endY = y * scale;
    
    switch (activeTool) {
      case 'measurement':
      case 'arrow':
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        break;
      case 'rectangle':
        ctx.strokeRect(startX, startY, endX - startX, endY - startY);
        break;
    }
  };

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.isDrawing) return;
    
    const { x, y } = getCanvasCoords(e);
    setDrawing({ isDrawing: false, startX: 0, startY: 0 });
    
    if (activeTool === 'measurement') {
      setPendingMeasurement({
        x1: drawing.startX,
        y1: drawing.startY,
        x2: x,
        y2: y,
      });
      setMeasurementDialogOpen(true);
      return;
    }
    
    let newElement: AnnotationElement;
    
    switch (activeTool) {
      case 'arrow':
        newElement = {
          type: 'arrow',
          x1: drawing.startX,
          y1: drawing.startY,
          x2: x,
          y2: y,
          color: activeColor,
          lineWidth: 2,
        };
        break;
      case 'rectangle':
        newElement = {
          type: 'rectangle',
          x: drawing.startX,
          y: drawing.startY,
          width: x - drawing.startX,
          height: y - drawing.startY,
          color: activeColor,
          lineWidth: 2,
        };
        break;
      default:
        return;
    }
    
    addToHistory([...elements, newElement]);
  };

  const handleMeasurementConfirm = (value: string) => {
    if (!pendingMeasurement) return;
    
    const newElement: AnnotationElement = {
      type: 'measurement',
      x1: pendingMeasurement.x1,
      y1: pendingMeasurement.y1,
      x2: pendingMeasurement.x2,
      y2: pendingMeasurement.y2,
      value,
      color: activeColor,
      lineWidth: 2,
    };
    
    addToHistory([...elements, newElement]);
    setMeasurementDialogOpen(false);
    setPendingMeasurement(null);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textValue.trim()) {
      setTextInput({ x: 0, y: 0, visible: false });
      return;
    }
    
    const newElement: AnnotationElement = {
      type: 'text',
      x: textInput.x,
      y: textInput.y,
      text: textValue,
      color: activeColor,
      fontSize: 16,
    };
    
    addToHistory([...elements, newElement]);
    setTextInput({ x: 0, y: 0, visible: false });
    setTextValue("");
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const handleClear = () => {
    addToHistory([]);
  };

  const handleSave = () => {
    onSave({ version: 1, elements });
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Annotate: {imageName}</DialogTitle>
          </DialogHeader>
          
          <AnnotationToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            activeColor={activeColor}
            onColorChange={setActiveColor}
            onUndo={handleUndo}
            onClear={handleClear}
            onSave={handleSave}
            canUndo={historyIndex > 0}
            canSave={true}
          />
          
          <div className="flex-1 overflow-auto relative bg-muted rounded-lg flex items-center justify-center p-4">
            <div className="relative inline-block">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => setDrawing({ isDrawing: false, startX: 0, startY: 0 })}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                className="cursor-crosshair rounded shadow-lg touch-none"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              
              {/* Text input overlay */}
              {textInput.visible && (
                <form
                  onSubmit={handleTextSubmit}
                  className="absolute"
                  style={{
                    left: textInput.x * scale,
                    top: textInput.y * scale,
                    transform: 'translate(-2px, -2px)',
                  }}
                >
                  <Input
                    autoFocus
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    onBlur={handleTextSubmit}
                    placeholder="Enter text..."
                    className="h-8 w-48 text-sm shadow-lg"
                  />
                </form>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2 text-sm text-muted-foreground">
            <span>Tip: Draw on the image to add measurements, arrows, or notes</span>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <MeasurementDialog
        open={measurementDialogOpen}
        onOpenChange={(open) => {
          setMeasurementDialogOpen(open);
          if (!open) {
            setPendingMeasurement(null);
            redraw();
          }
        }}
        onConfirm={handleMeasurementConfirm}
      />
    </>
  );
}
