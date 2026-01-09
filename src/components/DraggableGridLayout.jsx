import React, { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { RotateCcw } from 'lucide-react';

export default function DraggableGridLayout({ children, layoutKey = 'dashboardLayout' }) {
  const [layout, setLayout] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Layout por defecto
  const defaultLayout = [
    { x: 0, y: 0, w: 12, h: 8, i: 'kpis' },
    { x: 0, y: 8, w: 12, h: 4, i: 'chart' },
    { x: 0, y: 12, w: 12, h: 6, i: 'weather' },
    { x: 0, y: 18, w: 12, h: 5, i: 'planner' },
    { x: 0, y: 23, w: 12, h: 8, i: 'table' },
    { x: 0, y: 31, w: 12, h: 4, i: 'priorities' },
    { x: 0, y: 35, w: 12, h: 6, i: 'insights' }
  ];

  useEffect(() => {
    setMounted(true);
    // Cargar layout guardado del localStorage
    const saved = localStorage.getItem(layoutKey);
    if (saved) {
      try {
        setLayout(JSON.parse(saved));
      } catch {
        setLayout(defaultLayout);
      }
    } else {
      setLayout(defaultLayout);
    }
  }, [layoutKey]);

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem(layoutKey, JSON.stringify(newLayout));
  };

  const resetLayout = () => {
    setLayout(defaultLayout);
    localStorage.removeItem(layoutKey);
  };

  if (!mounted || layout.length === 0) {
    return <div className="w-full">{children}</div>;
  }

  // Renderizar solo los children sin GridLayout para evitar errores
  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <button
          onClick={resetLayout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Restablecer Layout
        </button>
      </div>
      <div className="relative w-full space-y-4">
        {children}
      </div>

      <style>{`
        .react-grid-layout {
          background: transparent;
        }

        .react-grid-item {
          background: transparent;
          border: 2px dashed rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .react-grid-item:hover {
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.02);
        }

        .react-grid-item.react-grid-placeholder {
          background: rgba(59, 130, 246, 0.1);
          opacity: 0.5;
          border-color: rgba(59, 130, 246, 0.5);
          border-radius: 8px;
        }

        .react-grid-item > .react-resizable-handle {
          background: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRCBF eHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWIuY29tKSAuIFZlcnNpb246IDAuNi4xICAtLT4KPHN2ZyBpZD0idW50aXRsZWQtcGFnZSIgdmlld0JveD0iMCAwIDYgNiIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6I2ZmZmZmZjAwIiB2ZXJzaW9uPSIxLjEiCiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWw6c3BhY2U9InByZXNlcnZlIgogIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iNnB4IiBoZWlnaHQ9IjZweCIK Pjwvc3ZnPg==');
          background-position: bottom right;
          padding: 0 8px 8px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
          opacity: 0.4;
        }

        .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-right: 2px solid rgba(255, 255, 255, 0.5);
          border-bottom: 2px solid rgba(255, 255, 255, 0.5);
        }

        .react-grid-item:hover > .react-resizable-handle {
          opacity: 1;
        }

        .grid-item {
          padding: 12px;
          background: transparent;
          height: 100%;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}