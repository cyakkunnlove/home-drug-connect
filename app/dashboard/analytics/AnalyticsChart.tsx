'use client';

import { useEffect, useRef } from 'react';

interface AnalyticsChartProps {
  data: Array<{
    date: string;
    views: number;
  }>;
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate dimensions
    const padding = 40;
    const graphWidth = rect.width - padding * 2;
    const graphHeight = rect.height - padding * 2;

    // Find max value
    const maxValue = Math.max(...data.map(d => d.views), 10);
    const valueStep = Math.ceil(maxValue / 5);
    const maxY = valueStep * 5;

    // Draw grid lines and labels
    ctx.strokeStyle = '#e5e7eb';
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphHeight / 5) * i;
      const value = Math.round(maxY - (maxY / 5) * i);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
      
      // Y-axis label
      ctx.fillText(value.toString(), padding - 10, y);
    }

    // Draw data
    if (data.length > 0) {
      const stepX = graphWidth / (data.length - 1 || 1);
      
      // Draw line
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((point, index) => {
        const x = padding + stepX * index;
        const y = padding + graphHeight - (point.views / maxY) * graphHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Draw area
      ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
      ctx.beginPath();
      
      data.forEach((point, index) => {
        const x = padding + stepX * index;
        const y = padding + graphHeight - (point.views / maxY) * graphHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.lineTo(padding + stepX * (data.length - 1), padding + graphHeight);
      ctx.lineTo(padding, padding + graphHeight);
      ctx.closePath();
      ctx.fill();
      
      // Draw dots and x-axis labels
      ctx.fillStyle = '#2563eb';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      data.forEach((point, index) => {
        const x = padding + stepX * index;
        const y = padding + graphHeight - (point.views / maxY) * graphHeight;
        
        // Dot
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // X-axis label (show every 7th day)
        if (index % 7 === 0 || index === data.length - 1) {
          ctx.fillStyle = '#6b7280';
          const date = new Date(point.date);
          const label = `${date.getMonth() + 1}/${date.getDate()}`;
          ctx.fillText(label, x, rect.height - padding + 10);
          ctx.fillStyle = '#2563eb';
        }
      });
    }
  }, [data]);

  return (
    <div className="w-full h-64">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}