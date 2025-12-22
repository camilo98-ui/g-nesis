import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Cloud, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';

export default function BackupToGoogleDrive() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleBackup = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('backupToGoogleDrive', {});
      
      if (response.data.success) {
        setResult(response.data);
        toast.success('Backup creado en Google Drive');
      } else {
        toast.error(response.data.error || 'Error al crear backup');
      }
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Error al conectar con Google Drive');
    }

    setLoading(false);
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start gap-4">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-3 rounded-xl bg-blue-100 flex-shrink-0"
          >
            <Cloud className="w-7 h-7 text-blue-600" />
          </motion.div>
          
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1 text-sm">Backup a Google Drive</h3>
            <p className="text-xs text-gray-600 mb-4">
              Guarda una copia de seguridad completa de todos los datos de la app en tu Google Drive
            </p>

            <Button
              onClick={handleBackup}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg gap-2"
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Crear Backup Ahora
                </>
              )}
            </Button>

            {/* Resultado */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-emerald-900 mb-1">
                        ✓ {result.message}
                      </p>
                      <div className="text-xs text-emerald-700 space-y-0.5">
                        <p>📁 Archivo: {result.file_name}</p>
                        <p>📊 Registros respaldados:</p>
                        <ul className="ml-4 mt-1 space-y-0.5 text-[11px]">
                          <li>• {result.records_backed_up.stores} tiendas</li>
                          <li>• {result.records_backed_up.cashiers} cajeros</li>
                          <li>• {result.records_backed_up.shift_records} registros de turno</li>
                          <li>• {result.records_backed_up.shifts} turnos programados</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}