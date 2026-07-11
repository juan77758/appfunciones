import React, { useEffect, useRef, useState } from 'react';

// Evaluación segura de funciones matemáticas
function createMathFn(expression) {
    try {
        const safeExpr = expression
            .replace(/\bsin\b/g, 'Math.sin')
            .replace(/\bcos\b/g, 'Math.cos')
            .replace(/\btan\b/g, 'Math.tan')
            .replace(/\basin\b/g, 'Math.asin')
            .replace(/\bacos\b/g, 'Math.acos')
            .replace(/\batan\b/g, 'Math.atan')
            .replace(/\blog\b/g, 'Math.log')
            .replace(/\bexp\b/g, 'Math.exp')
            .replace(/\bsqrt\b/g, 'Math.sqrt')
            .replace(/\babs\b/g, 'Math.abs')
            .replace(/\bcbrt\b/g, 'Math.cbrt')
            .replace(/\bpi\b/g, 'Math.PI')
            .replace(/\bE\b/g, 'Math.E')
            .replace(/\boo\b/g, 'Infinity');
        return new Function('x', `"use strict"; try { return (${safeExpr}); } catch(e) { return NaN; }`);
    } catch {
        return null;
    }
}

export default function AnalyticalGraph({ expression, asymptotes = [], holes = [], domain }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [viewWindow, setViewWindow] = useState({ xMin: -10, xMax: 10, yMin: -10, yMax: 10 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);

    useEffect(() => {
        if (!canvasRef.current || !expression) return;
        draw();
    }, [expression, viewWindow, asymptotes, holes]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 1.15 : 0.87;
            const cx = (viewWindow.xMin + viewWindow.xMax) / 2;
            const cy = (viewWindow.yMin + viewWindow.yMax) / 2;
            const halfW = ((viewWindow.xMax - viewWindow.xMin) / 2) * factor;
            const halfH = ((viewWindow.yMax - viewWindow.yMin) / 2) * factor;
            setViewWindow({
                xMin: cx - halfW, xMax: cx + halfW,
                yMin: cy - halfH, yMax: cy + halfH,
            });
        };

        canvas.addEventListener('wheel', handleWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', handleWheel);
    }, [viewWindow]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const W = rect.width;
        const H = rect.height;

        // Limpiar
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, W, H);

        const { xMin, xMax, yMin, yMax } = viewWindow;
        const toCanvasX = (x) => ((x - xMin) / (xMax - xMin)) * W;
        const toCanvasY = (y) => H - ((y - yMin) / (yMax - yMin)) * H;

        // Grid
        ctx.strokeStyle = 'rgba(64, 65, 79, 0.3)';
        ctx.lineWidth = 0.5;
        const gridStepX = getGridStep(xMax - xMin);
        const gridStepY = getGridStep(yMax - yMin);
        for (let x = Math.ceil(xMin / gridStepX) * gridStepX; x <= xMax; x += gridStepX) {
            const cx = toCanvasX(x);
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, H);
            ctx.stroke();
        }
        for (let y = Math.ceil(yMin / gridStepY) * gridStepY; y <= yMax; y += gridStepY) {
            const cy = toCanvasY(y);
            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(W, cy);
            ctx.stroke();
        }

        // Ejes
        ctx.strokeStyle = 'rgba(172, 172, 190, 0.4)';
        ctx.lineWidth = 1;
        // Eje X
        const axisY = toCanvasY(0);
        if (axisY >= 0 && axisY <= H) {
            ctx.beginPath();
            ctx.moveTo(0, axisY);
            ctx.lineTo(W, axisY);
            ctx.stroke();
        }
        // Eje Y
        const axisX = toCanvasX(0);
        if (axisX >= 0 && axisX <= W) {
            ctx.beginPath();
            ctx.moveTo(axisX, 0);
            ctx.lineTo(axisX, H);
            ctx.stroke();
        }

        // Labels de ejes
        ctx.fillStyle = 'rgba(172, 172, 190, 0.6)';
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        for (let x = Math.ceil(xMin / gridStepX) * gridStepX; x <= xMax; x += gridStepX) {
            if (Math.abs(x) < gridStepX * 0.01) continue;
            ctx.fillText(x % 1 === 0 ? x.toString() : x.toFixed(1), toCanvasX(x), Math.min(Math.max(axisY + 16, 16), H - 4));
        }
        ctx.textAlign = 'right';
        for (let y = Math.ceil(yMin / gridStepY) * gridStepY; y <= yMax; y += gridStepY) {
            if (Math.abs(y) < gridStepY * 0.01) continue;
            ctx.fillText(y % 1 === 0 ? y.toString() : y.toFixed(1), Math.min(Math.max(axisX - 8, 30), W - 4), toCanvasY(y) + 4);
        }

        // Asíntotas verticales
        if (asymptotes) {
            asymptotes.filter(a => a.type === 'vertical').forEach(a => {
                const ax = toCanvasX(a.value);
                if (ax < 0 || ax > W) return;
                ctx.strokeStyle = 'rgba(251, 113, 133, 0.5)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(ax, 0);
                ctx.lineTo(ax, H);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = 'rgba(251, 113, 133, 0.8)';
                ctx.font = '11px JetBrains Mono, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`x = ${a.value}`, ax, 16);
            });

            // Asíntotas horizontales
            asymptotes.filter(a => a.type === 'horizontal').forEach(a => {
                const ay = toCanvasY(a.value);
                if (ay < 0 || ay > H) return;
                ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(0, ay);
                ctx.lineTo(W, ay);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = 'rgba(96, 165, 250, 0.8)';
                ctx.font = '11px JetBrains Mono, monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`y = ${a.value}`, W - 60, ay - 6);
            });

            // Asíntotas oblicuas
            asymptotes.filter(a => a.type === 'oblique').forEach(a => {
                ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([6, 4]);
                const slope = a.slope || 1;
                const intercept = a.intercept || 0;
                ctx.beginPath();
                const x1 = xMin, y1 = slope * x1 + intercept;
                const x2 = xMax, y2 = slope * x2 + intercept;
                ctx.moveTo(toCanvasX(x1), toCanvasY(y1));
                ctx.lineTo(toCanvasX(x2), toCanvasY(y2));
                ctx.stroke();
                ctx.setLineDash([]);
            });
        }

        // Dibujar función
        const fn = createMathFn(expression);
        if (!fn) return;

        ctx.strokeStyle = '#6c63ff';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let isDrawing = false;
        let prevY = null;
        const step = (xMax - xMin) / (W * 2); // alta resolución

        ctx.beginPath();
        for (let x = xMin; x <= xMax; x += step) {
            // Verificar dominio (skip puntos cercanos a asíntotas verticales)
            const nearAsymptote = asymptotes?.some(a =>
                a.type === 'vertical' && Math.abs(x - a.value) < step * 3
            );

            let y;
            try { y = fn(x); } catch { y = NaN; }

            if (!isFinite(y) || isNaN(y) || Math.abs(y) > 1e6 || nearAsymptote) {
                if (isDrawing) ctx.stroke();
                ctx.beginPath();
                isDrawing = false;
                prevY = null;
                continue;
            }

            // Detectar saltos (posibles asíntotas no marcadas)
            if (prevY !== null && Math.abs(y - prevY) > (yMax - yMin) * 0.8) {
                if (isDrawing) ctx.stroke();
                ctx.beginPath();
                isDrawing = false;
            }

            const cx = toCanvasX(x);
            const cy = toCanvasY(y);

            if (!isDrawing) {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                isDrawing = true;
            } else {
                ctx.lineTo(cx, cy);
            }
            prevY = y;
        }
        if (isDrawing) ctx.stroke();

        // Agujeros (discontinuidades evitables)
        if (holes && holes.length > 0) {
            holes.forEach(h => {
                const hx = toCanvasX(h.x);
                const hy = toCanvasY(h.limit);
                if (hx < 0 || hx > W || hy < 0 || hy > H) return;

                // Círculo abierto
                ctx.beginPath();
                ctx.arc(hx, hy, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#0a0a12';
                ctx.fill();
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        }
    };

    const getGridStep = (range) => {
        const rawStep = range / 8;
        const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const normalized = rawStep / mag;
        if (normalized <= 1.5) return mag;
        if (normalized <= 3.5) return 2 * mag;
        if (normalized <= 7.5) return 5 * mag;
        return 10 * mag;
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY, window: { ...viewWindow } });
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !dragStart) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const dx = (e.clientX - dragStart.x) / rect.width * (dragStart.window.xMax - dragStart.window.xMin);
        const dy = (e.clientY - dragStart.y) / rect.height * (dragStart.window.yMax - dragStart.window.yMin);
        setViewWindow({
            xMin: dragStart.window.xMin - dx,
            xMax: dragStart.window.xMax - dx,
            yMin: dragStart.window.yMin + dy,
            yMax: dragStart.window.yMax + dy,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragStart(null);
    };

    const resetView = () => {
        setViewWindow({ xMin: -10, xMax: 10, yMin: -10, yMax: 10 });
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-dark-500 uppercase tracking-wider font-medium">
                    Gráfica interactiva
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-dark-600">Scroll: zoom · Arrastre: mover</span>
                    <button
                        onClick={resetView}
                        className="text-xs px-2 py-1 rounded bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-dark-200 border border-dark-700 transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                className="w-full rounded-xl border border-dark-800 cursor-grab active:cursor-grabbing"
                style={{ height: '400px' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 mt-2 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-accent rounded"></div>
                    <span className="text-xs text-dark-500">f(x)</span>
                </div>
                {asymptotes?.some(a => a.type === 'vertical') && (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-0.5 bg-math-rose rounded" style={{ borderStyle: 'dashed' }}></div>
                        <span className="text-xs text-dark-500">Asíntota vertical</span>
                    </div>
                )}
                {asymptotes?.some(a => a.type === 'horizontal') && (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-0.5 bg-math-blue rounded" style={{ borderStyle: 'dashed' }}></div>
                        <span className="text-xs text-dark-500">Asíntota horizontal</span>
                    </div>
                )}
                {holes && holes.length > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border-2 border-math-amber bg-dark-950"></div>
                        <span className="text-xs text-dark-500">Discontinuidad evitable</span>
                    </div>
                )}
            </div>
        </div>
    );
}