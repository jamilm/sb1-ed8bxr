import React, { useState, useRef, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Text, Rect } from 'react-konva';
import { Upload, Sliders, Ruler, Square, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [transparency, setTransparency] = useState(1);
  const [lines, setLines] = useState<Array<number[]>>([]);
  const [rectangles, setRectangles] = useState<Array<{ x: number; y: number; width: number; height: number }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'line' | 'rectangle' | null>(null);
  const [scale, setScale] = useState<number | null>(null);
  const stageRef = useRef<any>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => setImage(img);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: any) => {
    if (drawingMode) {
      setIsDrawing(true);
      const pos = e.target.getStage().getPointerPosition();
      if (drawingMode === 'line') {
        setLines([...lines, [pos.x, pos.y, pos.x, pos.y]]);
      } else if (drawingMode === 'rectangle') {
        setRectangles([...rectangles, { x: pos.x, y: pos.y, width: 0, height: 0 }]);
      }
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (drawingMode === 'line') {
      let lastLine = lines[lines.length - 1].slice();
      lastLine[2] = point.x;
      lastLine[3] = point.y;
      lines.splice(lines.length - 1, 1, lastLine);
      setLines([...lines]);
    } else if (drawingMode === 'rectangle') {
      let lastRect = { ...rectangles[rectangles.length - 1] };
      lastRect.width = point.x - lastRect.x;
      lastRect.height = point.y - lastRect.y;
      rectangles.splice(rectangles.length - 1, 1, lastRect);
      setRectangles([...rectangles]);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (drawingMode === 'line' && !scale) {
      const length = prompt('Enter the length of this line in feet:');
      if (length) {
        const lastLine = lines[lines.length - 1];
        const pixelLength = Math.sqrt(
          Math.pow(lastLine[2] - lastLine[0], 2) + Math.pow(lastLine[3] - lastLine[1], 2)
        );
        setScale(pixelLength / parseFloat(length));
      }
    }
  };

  const calculateLength = (line: number[]) => {
    if (!scale) return 0;
    const pixelLength = Math.sqrt(
      Math.pow(line[2] - line[0], 2) + Math.pow(line[3] - line[1], 2)
    );
    return pixelLength / scale;
  };

  const calculateArea = (rect: { width: number; height: number }) => {
    if (!scale) return 0;
    return (Math.abs(rect.width) * Math.abs(rect.height)) / (scale * scale);
  };

  const totalArea = useMemo(() => {
    return rectangles.reduce((sum, rect) => sum + calculateArea(rect), 0);
  }, [rectangles, scale]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Floorplan Manipulation Tool</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-gray-200 p-4 flex flex-col">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mb-4"
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Transparency</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={transparency}
              onChange={(e) => setTransparency(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <button
            onClick={() => setDrawingMode('line')}
            className={`mb-2 p-2 ${drawingMode === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
          >
            <Ruler className="inline-block mr-2" /> Draw Line
          </button>
          <button
            onClick={() => setDrawingMode('rectangle')}
            className={`mb-2 p-2 ${drawingMode === 'rectangle' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
          >
            <Square className="inline-block mr-2" /> Draw Rectangle
          </button>
          <div className="mt-auto">
            <h2 className="text-lg font-semibold mb-2">Total Area</h2>
            <p>{totalArea.toFixed(2)} sq ft</p>
          </div>
        </div>
        <div className="flex-1 relative">
          <Stage
            width={window.innerWidth - 256}
            height={window.innerHeight - 64}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            ref={stageRef}
          >
            <Layer>
              {image && (
                <KonvaImage
                  image={image}
                  opacity={transparency}
                  width={window.innerWidth - 256}
                  height={window.innerHeight - 64}
                />
              )}
              {lines.map((line, i) => (
                <React.Fragment key={i}>
                  <Line
                    points={line}
                    stroke="#df4b26"
                    strokeWidth={2}
                    tension={0}
                    lineCap="round"
                  />
                  {scale && (
                    <Text
                      x={(line[0] + line[2]) / 2}
                      y={(line[1] + line[3]) / 2}
                      text={`${calculateLength(line).toFixed(2)} ft`}
                      fontSize={14}
                      fill="black"
                    />
                  )}
                </React.Fragment>
              ))}
              {rectangles.map((rect, i) => (
                <React.Fragment key={i}>
                  <Rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                  {scale && (
                    <>
                      <Text
                        x={rect.x + rect.width / 2}
                        y={rect.y - 20}
                        text={`${(Math.abs(rect.width) / scale).toFixed(2)} ft`}
                        fontSize={14}
                        fill="black"
                        align="center"
                      />
                      <Text
                        x={rect.x + rect.width + 5}
                        y={rect.y + rect.height / 2}
                        text={`${(Math.abs(rect.height) / scale).toFixed(2)} ft`}
                        fontSize={14}
                        fill="black"
                      />
                      <Text
                        x={rect.x + rect.width / 2}
                        y={rect.y + rect.height / 2}
                        text={`${calculateArea(rect).toFixed(2)} sq ft`}
                        fontSize={14}
                        fill="black"
                        align="center"
                      />
                    </>
                  )}
                </React.Fragment>
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default App;