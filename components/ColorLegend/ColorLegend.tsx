import { useCallback, useEffect, useRef, useState } from "react";

type ViolationProps = {
    lowViolation: {
        count: number;
        color: string;
    };
    highViolation: {
        count: number;
        color: string;
    };
};

const ColorLegend: React.FC<ViolationProps> = ({ lowViolation, highViolation }) => {
    const [color, setColor] = useState(lowViolation.color);
    const [index, setIndex] = useState(lowViolation.count)
    const [position, setPosition] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setGlobalSelection(isDragging);
    }, [isDragging])
    
    const setGlobalSelection = useCallback((enable: boolean) => {
        const value = enable ? 'none' : '';
        document.body.style.userSelect = value; 
      }, []);

    const snapToSlot = (xPos: number, width: number, maxCount: number) => {
        const slotWidth = width / (maxCount - 1);
        const snappedIndex = Math.round(xPos / slotWidth); 
        const snappedXPos = snappedIndex * slotWidth;
        return { snappedXPos, snappedIndex };
    }

    const updatePositionAndColor = useCallback((xPos: number, width: number) => {
        const { snappedXPos, snappedIndex } = snapToSlot(xPos, width, highViolation.count);
        setPosition(snappedXPos);
        const percentage = snappedIndex / (highViolation.count - 1);
        setColor(percentageToColor(percentage, lowViolation.color, highViolation.color));
        setIndex(snappedIndex + 1)
    }, [lowViolation.color, highViolation.color, highViolation.count]);

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        if (barRef.current) {
            const rect = barRef.current.getBoundingClientRect();
            updatePositionAndColor(event.clientX - rect.left, rect.width);
        }
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging && barRef.current) {
            const rect = barRef.current.getBoundingClientRect();
            let xPos = event.clientX - rect.left;
            xPos = Math.max(0, Math.min(xPos, rect.width)); // Ensure the position stays within the bounds
            updatePositionAndColor(xPos, rect.width);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // todo: allow the drag outside the color scale bar
    const handleMouseLeave = () => {
        setIsDragging(false);
    }
    const percentageToColor = (percentage: number, startColor: string, endColor: string) => {
        // Simple linear interpolation between start and end colors in RGBA
        const start = parseInt(startColor.slice(1), 16);
        const end = parseInt(endColor.slice(1), 16);
        const r = Math.round(((end >> 16) - (start >> 16)) * percentage + (start >> 16));
        const g = Math.round(((end >> 8 & 0xFF) - (start >> 8 & 0xFF)) * percentage + (start >> 8 & 0xFF));
        const b = Math.round(((end & 0xFF) - (start & 0xFF)) * percentage + (start & 0xFF));
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    };

    return (
        <div>
            <h3 className="text-base font-semibold mb-2">Violations</h3>
            <div className="flex justify-between text-sm mt-1">
                <span>{lowViolation.count}</span>
                <div
                    ref={barRef}
                    className="relative w-full h-6 cursor-pointer bg-gradient-to-r from-yellow-300 via-red-500 to-red-900"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave} // Optionally handle mouse leaving the element
                    >
                    <div className="absolute top-0 left-0 ml-[-8px] mt-[-8px]" style={{ left: `${position}px` }}>
                        <div className="w-4 h-4 rounded-full border border-gray-300 bg-white"></div>
                    </div>
                </div>
                <span>{highViolation.count}+</span>
            </div>
            <div className="mt-1 flex justify-right items-center">
                <div className="w-6 h-6 rounded-full mx-2" style={{ backgroundColor: color }}></div>
                <div className="text-sm" style={{color: color}}>{index === highViolation.count ? index + "+" : index}</div>
            </div>
        </div>
    );
}

export default ColorLegend

