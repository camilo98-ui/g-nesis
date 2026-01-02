import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Presentation, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PresentationGenerator({ storeId, storeName, storeCode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generatePresentation', {
        storeId,
        storeName,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });

      if (response.data.success) {
        setGeneratedUrl(response.data.url);
        toast.success('¡Presentación generada exitosamente!');
      } else {
        toast.error('Error al generar presentación');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar presentación');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setGeneratedUrl(null);
  };

  return (
    <>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="gap-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-all"
        >
          <Presentation className="w-4 h-4" />
          Crear Presentación
        </Button>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Presentation className="w-6 h-6 text-purple-600" />
              Generar Presentación
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!generatedUrl ? (
              <>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-700 mb-2">
                    Se generará una presentación de Google Slides con:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 ml-4">
                    <li>• Resumen ejecutivo de ventas</li>
                    <li>• Cumplimiento de presupuesto</li>
                    <li>• Top 5 cajeros del mes</li>
                    <li>• Métricas clave (ticket promedio, transacciones, sugeridos)</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Tienda:</p>
                  <p className="text-sm text-gray-900">{storeCode} - {storeName}</p>
                  <p className="text-xs font-semibold text-gray-700 mt-2 mb-1">Período:</p>
                  <p className="text-sm text-gray-900">
                    {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando presentación...
                    </>
                  ) : (
                    <>
                      <Presentation className="w-4 h-4 mr-2" />
                      Generar Presentación
                    </>
                  )}
                </Button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg mb-2">¡Presentación creada!</p>
                  <p className="text-sm text-gray-600">
                    Tu presentación está lista en Google Slides
                  </p>
                </div>
                <Button
                  onClick={() => window.open(generatedUrl, '_blank')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-full shadow-lg hover:shadow-xl transition-all gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Presentación
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="w-full"
                >
                  Cerrar
                </Button>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}