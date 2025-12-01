import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from 'lucide-react';
import { toast } from "sonner";

const ROLES_CONFIG = {
  caja: { label: 'Caja', color: '#10b981', emoji: '💳' },
  coneo: { label: 'Coneo', color: '#ec4899', emoji: '🍦' },
  bebidas: { label: 'Bebidas', color: '#f59e0b', emoji: '☕' },
  especialidades: { label: 'Especialidades', color: '#8b5cf6', emoji: '✨' },
  coordinacion: { label: 'Coord.', color: '#3b82f6', emoji: '📋' },
  cookie_jar: { label: 'Cookie', color: '#f97316', emoji: '🍪' },
  stocker: { label: 'Stocker', color: '#64748b', emoji: '📦' },
  toma_pedidos: { label: 'Pedidos', color: '#06b6d4', emoji: '🎧' },
  experiencia: { label: 'Exp.', color: '#eab308', emoji: '👑' },
};

export function generateSchedulePDF(weekDays, shifts, storeName, storeCode) {
  const getShiftsForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return shifts.filter(s => {
      const shiftDateStr = s.date?.split('T')[0] || s.date;
      return shiftDateStr === dayStr;
    });
  };

  const weekStart = format(weekDays[0], "d 'de' MMMM", { locale: es });
  const weekEnd = format(weekDays[6], "d 'de' MMMM yyyy", { locale: es });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Horarios Popsy - ${storeCode}</title>
      <style>
        @page { size: landscape; margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
          padding: 20px;
        }
        .container { max-width: 100%; margin: 0 auto; }
        .header {
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
          color: white;
          padding: 20px 30px;
          border-radius: 16px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);
        }
        .header h1 { font-size: 28px; font-weight: 800; }
        .header .subtitle { font-size: 14px; opacity: 0.9; }
        .header .store { 
          background: rgba(255,255,255,0.2); 
          padding: 10px 20px; 
          border-radius: 10px;
          text-align: center;
        }
        .header .store-code { font-size: 20px; font-weight: 800; }
        .header .store-name { font-size: 11px; opacity: 0.8; }
        
        .calendar {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          background: white;
          padding: 15px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .day {
          background: #fafafa;
          border-radius: 12px;
          overflow: hidden;
          min-height: 300px;
        }
        .day.today { background: linear-gradient(180deg, #fdf2f8 0%, #fce7f3 100%); }
        .day-header {
          padding: 12px;
          text-align: center;
          background: #f1f5f9;
          border-bottom: 2px solid #e2e8f0;
        }
        .day.today .day-header {
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
          color: white;
        }
        .day-name { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
        .day.today .day-name { color: rgba(255,255,255,0.8); }
        .day-number { font-size: 24px; font-weight: 800; color: #1e293b; }
        .day.today .day-number { color: white; }
        
        .shifts { padding: 8px; }
        .shift {
          margin-bottom: 8px;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .shift-header {
          padding: 6px 10px;
          color: white;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .shift-body {
          padding: 10px;
          background: white;
        }
        .shift-name {
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }
        .shift-time {
          font-size: 14px;
          font-weight: 800;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .shift-duration {
          font-size: 10px;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 10px;
          color: #64748b;
        }
        
        .footer {
          margin-top: 20px;
          text-align: center;
          color: #94a3b8;
          font-size: 11px;
        }
        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 12px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          color: #64748b;
        }
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1>🍦 Horarios Popsy</h1>
            <p class="subtitle">Semana del ${weekStart} al ${weekEnd}</p>
          </div>
          <div class="store">
            <div class="store-code">${storeCode}</div>
            <div class="store-name">${storeName}</div>
          </div>
        </div>
        
        <div class="calendar">
          ${weekDays.map(day => {
            const dayShifts = getShiftsForDay(day);
            const isToday = format(new Date(), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
            return `
              <div class="day ${isToday ? 'today' : ''}">
                <div class="day-header">
                  <div class="day-name">${format(day, 'EEEE', { locale: es })}</div>
                  <div class="day-number">${format(day, 'd')}</div>
                </div>
                <div class="shifts">
                  ${dayShifts.length === 0 ? '<p style="text-align:center;color:#94a3b8;font-size:10px;padding:20px;">Sin turnos</p>' : ''}
                  ${dayShifts.map(shift => {
                    const role = ROLES_CONFIG[shift.role] || ROLES_CONFIG.caja;
                    const [startH, startM] = (shift.start_time || '08:00').split(':').map(Number);
                    const [endH, endM] = (shift.end_time || '16:00').split(':').map(Number);
                    const duration = ((endH + endM/60) - (startH + startM/60)).toFixed(1);
                    return `
                      <div class="shift">
                        <div class="shift-header" style="background: ${role.color}">
                          <span>${role.emoji}</span>
                          <span>${role.label}</span>
                        </div>
                        <div class="shift-body">
                          <div class="shift-name">${shift.cashier_name || 'Sin asignar'}</div>
                          <div class="shift-time">
                            🕐 ${shift.start_time} → ${shift.end_time}
                            <span class="shift-duration">${duration}h</span>
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="legend">
          ${Object.entries(ROLES_CONFIG).map(([key, config]) => `
            <div class="legend-item">
              <div class="legend-color" style="background: ${config.color}"></div>
              <span>${config.emoji} ${config.label}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          <p>Generado el ${format(new Date(), "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })} | Popsy Planner</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Horarios_${storeCode}_${format(weekDays[0], 'yyyy-MM-dd')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  toast.success('Horario exportado - Abre el archivo e imprime como PDF');
}

export default function SchedulePDFExport({ weekDays, shifts, storeName, storeCode }) {
  const [loading, setLoading] = React.useState(false);

  const handleExport = () => {
    setLoading(true);
    setTimeout(() => {
      generateSchedulePDF(weekDays, shifts, storeName, storeCode);
      setLoading(false);
    }, 500);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="gap-2 bg-white text-pink-600 hover:bg-pink-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      Exportar PDF
    </Button>
  );
}