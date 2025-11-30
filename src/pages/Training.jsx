import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, GraduationCap, Trophy, Star, Play, CheckCircle, 
  Lock, Award, BookOpen, Target, TrendingUp, Users, Sparkles,
  ChevronRight, Clock, Medal
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Cursos predefinidos
const COURSES_DATA = [
  {
    id: 'ventas-101',
    title: 'Fundamentos de Venta',
    description: 'Aprende las bases de una venta exitosa en Popsy',
    level: 1,
    category: 'ventas',
    duration_minutes: 15,
    icon: '🎯',
    color: 'from-pink-400 to-rose-500',
    content: `
# Bienvenido a Fundamentos de Venta

## ¿Qué aprenderás?
- Cómo saludar al cliente
- Técnicas de escucha activa
- Identificar necesidades del cliente
- Cerrar una venta exitosa

## El Saludo Popsy
Siempre recibe al cliente con una sonrisa y di: "¡Bienvenido a Popsy! ¿Qué sabor te antoja hoy?"

## Escucha Activa
- Mira al cliente a los ojos
- Asiente mientras habla
- Repite lo que entendiste

## Cierre de Venta
Siempre ofrece un complemento: "¿Te gustaría agregar una malteada o un topping?"
    `,
    quiz: [
      { q: '¿Cuál es el saludo correcto en Popsy?', options: ['Hola', '¡Bienvenido a Popsy! ¿Qué sabor te antoja?', 'Buenas', 'Qué desea'], correct: 1 },
      { q: '¿Qué debes hacer al escuchar al cliente?', options: ['Mirar el celular', 'Mirar a los ojos y asentir', 'Interrumpir', 'Hablar más fuerte'], correct: 1 },
      { q: '¿Qué ofrecer al cierre?', options: ['Nada', 'Un complemento', 'Que se vaya', 'Descuento'], correct: 1 }
    ]
  },
  {
    id: 'ticket-promedio',
    title: 'Mejora tu Ticket Promedio',
    description: 'Técnicas para aumentar el valor de cada venta',
    level: 2,
    category: 'ticket_promedio',
    duration_minutes: 20,
    icon: '💰',
    color: 'from-amber-400 to-orange-500',
    content: `
# Mejora tu Ticket Promedio

## ¿Por qué es importante?
El ticket promedio mide cuánto gasta cada cliente. ¡Subirlo significa más ventas sin más clientes!

## Estrategias Clave

### 1. Sugerido Inteligente
- Ofrece el sabor del mes
- Sugiere tamaños más grandes
- Propón combos

### 2. Cross-Selling
- "¿Quieres agregar un topping?"
- "¿Una malteada para acompañar?"
- "Tenemos promoción en conos dobles"

### 3. Up-Selling
- Del cono sencillo al doble
- De la copa pequeña a la grande
- Del helado al sundae
    `,
    quiz: [
      { q: '¿Qué es el ticket promedio?', options: ['Un boleto', 'Cuánto gasta cada cliente', 'El número de clientes', 'El horario'], correct: 1 },
      { q: '¿Qué es cross-selling?', options: ['Vender menos', 'Ofrecer productos complementarios', 'Cerrar la tienda', 'Dar descuentos'], correct: 1 },
      { q: '¿Qué es up-selling?', options: ['Vender más barato', 'Ofrecer versión más grande/mejor', 'Regalar productos', 'Nada'], correct: 1 }
    ]
  },
  {
    id: 'servicio-estrella',
    title: 'Servicio 5 Estrellas',
    description: 'Convierte cada visita en una experiencia memorable',
    level: 2,
    category: 'servicio',
    duration_minutes: 25,
    icon: '⭐',
    color: 'from-purple-400 to-violet-500',
    content: `
# Servicio 5 Estrellas Popsy

## La Experiencia Popsy
No vendemos helados, ¡vendemos felicidad!

## Los 5 Pilares del Servicio

### 1. Sonrisa Genuina
Tu sonrisa es contagiosa. ¡Úsala!

### 2. Rapidez con Calidad
Atiende rápido pero sin descuidar la presentación.

### 3. Conocimiento del Producto
Conoce todos los sabores, sus ingredientes y alérgenos.

### 4. Resolución de Problemas
Si hay un problema, resuélvelo con actitud positiva.

### 5. Despedida Memorable
"¡Gracias por visitarnos! ¡Te esperamos pronto!"
    `,
    quiz: [
      { q: '¿Qué vendemos en Popsy?', options: ['Solo helados', 'Felicidad y experiencias', 'Comida rápida', 'Bebidas'], correct: 1 },
      { q: '¿Cuántos pilares tiene el servicio?', options: ['3', '4', '5', '6'], correct: 2 },
      { q: '¿Cómo resolver un problema?', options: ['Ignorarlo', 'Con actitud positiva', 'Llamar al jefe', 'Discutir'], correct: 1 }
    ]
  },
  {
    id: 'lider-popsy',
    title: 'Líder Popsy',
    description: 'Desarrolla habilidades de liderazgo en tu punto',
    level: 3,
    category: 'liderazgo',
    duration_minutes: 30,
    icon: '👑',
    color: 'from-indigo-400 to-blue-500',
    content: `
# Conviértete en Líder Popsy

## ¿Qué es un Líder Popsy?
Es quien inspira al equipo, resuelve problemas y hace crecer las ventas.

## Habilidades de Liderazgo

### Comunicación Efectiva
- Instrucciones claras
- Feedback constructivo
- Escucha activa

### Motivación del Equipo
- Reconoce logros
- Celebra pequeñas victorias
- Apoya en momentos difíciles

### Toma de Decisiones
- Analiza la situación
- Considera opciones
- Actúa con confianza
    `,
    quiz: [
      { q: '¿Qué hace un líder Popsy?', options: ['Solo vende', 'Inspira y resuelve', 'Descansa', 'Critica'], correct: 1 },
      { q: '¿Cómo motivar al equipo?', options: ['Ignorándolo', 'Reconociendo logros', 'Gritando', 'Con amenazas'], correct: 1 },
      { q: '¿Qué tipo de feedback dar?', options: ['Destructivo', 'Constructivo', 'Ninguno', 'Solo negativo'], correct: 1 }
    ]
  },
  {
    id: 'experto-sabores',
    title: 'Experto en Sabores',
    description: 'Conoce todos los sabores y sus combinaciones perfectas',
    level: 2,
    category: 'producto',
    duration_minutes: 20,
    icon: '🍦',
    color: 'from-cyan-400 to-teal-500',
    content: `
# Experto en Sabores Popsy

## Líneas de Productos

### Gourmet
Sabores clásicos premium: Chocolate, Vainilla, Fresa, Arequipe

### Exclusivos
Colaboraciones especiales: OREO, M&M's, SNICKERS, Nutella

## Combinaciones Ganadoras
- Chocolate + Arequipe = Dulce intenso
- Fresa + Vainilla = Clásico refrescante
- OREO + Cookies & Cream = Galleta lovers

## Alérgenos
Siempre pregunta por alergias antes de recomendar.
    `,
    quiz: [
      { q: '¿A qué línea pertenece OREO?', options: ['Gourmet', 'Exclusivos', 'Light', 'Básico'], correct: 1 },
      { q: '¿Qué preguntar antes de recomendar?', options: ['El nombre', 'Por alergias', 'La edad', 'Nada'], correct: 1 },
      { q: 'Chocolate + Arequipe es:', options: ['Refrescante', 'Dulce intenso', 'Ácido', 'Salado'], correct: 1 }
    ]
  }
];

export default function Training() {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: progress = [] } = useQuery({
    queryKey: ['courseProgress', currentUser?.id],
    queryFn: () => base44.entities.CourseProgress.filter({ cashier_id: currentUser?.id }),
    enabled: !!currentUser?.id
  });

  const getProgressForCourse = (courseId) => {
    return progress.find(p => p.course_id === courseId);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const existing = progress.find(p => p.course_id === data.course_id);
      if (existing) {
        return base44.entities.CourseProgress.update(existing.id, data);
      }
      return base44.entities.CourseProgress.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries(['courseProgress'])
  });

  const startCourse = (course) => {
    setSelectedCourse(course);
    setShowQuiz(false);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const submitQuiz = () => {
    const course = selectedCourse;
    let correct = 0;
    course.quiz.forEach((q, i) => {
      if (quizAnswers[i] === q.correct) correct++;
    });
    const score = Math.round((correct / course.quiz.length) * 100);
    const passed = score >= 70;
    
    setQuizResult({ score, passed, correct, total: course.quiz.length });
    
    saveMutation.mutate({
      cashier_id: currentUser?.id,
      course_id: course.id,
      status: passed ? 'certified' : 'completed',
      score,
      completed_date: format(new Date(), 'yyyy-MM-dd'),
      attempts: (getProgressForCourse(course.id)?.attempts || 0) + 1
    });
    
    if (passed) {
      toast.success('🎉 ¡Felicidades! Has aprobado el curso');
    } else {
      toast.error('No alcanzaste el puntaje mínimo. ¡Intenta de nuevo!');
    }
  };

  const getLevelStars = (level) => {
    return Array(level).fill('⭐').join('');
  };

  const completedCount = progress.filter(p => p.status === 'certified').length;
  const totalPoints = progress.reduce((acc, p) => acc + (p.score || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-purple-600" />
              Academia Popsy
            </h1>
            <p className="text-sm text-gray-500">Capacítate y certifícate</p>
          </div>
          {currentUser && (
            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm">
              <Trophy className="w-5 h-5 text-amber-500" />
              <div className="text-right">
                <p className="text-xs text-gray-500">Certificaciones</p>
                <p className="font-bold text-purple-600">{completedCount}/{COURSES_DATA.length}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-4 bg-gradient-to-br from-pink-100 to-rose-100 border-none">
            <Medal className="w-6 h-6 text-pink-600 mb-2" />
            <p className="text-2xl font-bold text-pink-700">{completedCount}</p>
            <p className="text-xs text-pink-600">Cursos Completados</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-100 to-violet-100 border-none">
            <Star className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-700">{totalPoints}</p>
            <p className="text-xs text-purple-600">Puntos Totales</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-100 to-yellow-100 border-none">
            <Award className="w-6 h-6 text-amber-600 mb-2" />
            <p className="text-2xl font-bold text-amber-700">Nivel {Math.min(5, Math.floor(completedCount / 2) + 1)}</p>
            <p className="text-xs text-amber-600">Tu Rango</p>
          </Card>
        </div>

        {/* Course List */}
        {!selectedCourse ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Cursos Disponibles
            </h2>
            
            {COURSES_DATA.map((course, index) => {
              const courseProgress = getProgressForCourse(course.id);
              const isLocked = index > 0 && !getProgressForCourse(COURSES_DATA[index - 1].id)?.status?.includes('certified');
              const isCertified = courseProgress?.status === 'certified';
              
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${isLocked ? 'opacity-50' : ''} ${isCertified ? 'ring-2 ring-green-400' : ''}`}
                    onClick={() => !isLocked && startCourse(course)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${course.color} flex items-center justify-center text-2xl shadow-lg`}>
                        {isLocked ? <Lock className="w-6 h-6 text-white" /> : course.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800">{course.title}</h3>
                          {isCertified && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </div>
                        <p className="text-sm text-gray-500">{course.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{getLevelStars(course.level)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration_minutes} min</span>
                          {courseProgress?.score && <span className="text-purple-600 font-medium">Puntaje: {courseProgress.score}%</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Course Content */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button variant="ghost" onClick={() => setSelectedCourse(null)} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver a cursos
            </Button>
            
            <Card className="p-6">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${selectedCourse.color} flex items-center justify-center text-3xl shadow-lg mb-4`}>
                {selectedCourse.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedCourse.title}</h2>
              <p className="text-gray-500 mb-6">{selectedCourse.description}</p>
              
              {!showQuiz ? (
                <>
                  <div className="prose prose-sm max-w-none mb-6 bg-gray-50 rounded-xl p-4">
                    {selectedCourse.content.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-gray-800 mb-3">{line.replace('# ', '')}</h1>;
                      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold text-gray-700 mt-4 mb-2">{line.replace('## ', '')}</h2>;
                      if (line.startsWith('### ')) return <h3 key={i} className="text-base font-medium text-gray-600 mt-3 mb-1">{line.replace('### ', '')}</h3>;
                      if (line.startsWith('- ')) return <li key={i} className="text-gray-600 ml-4">{line.replace('- ', '')}</li>;
                      if (line.trim()) return <p key={i} className="text-gray-600 mb-2">{line}</p>;
                      return null;
                    })}
                  </div>
                  <Button onClick={() => setShowQuiz(true)} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Play className="w-4 h-4 mr-2" /> Tomar Evaluación
                  </Button>
                </>
              ) : quizResult ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl mb-4 ${quizResult.passed ? 'bg-green-100' : 'bg-red-100'}`}
                  >
                    {quizResult.passed ? '🎉' : '😢'}
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">{quizResult.passed ? '¡Aprobado!' : 'No aprobado'}</h3>
                  <p className="text-4xl font-bold text-purple-600 mb-2">{quizResult.score}%</p>
                  <p className="text-gray-500 mb-6">{quizResult.correct} de {quizResult.total} respuestas correctas</p>
                  
                  {quizResult.passed && currentUser && (
                    <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 mb-4">
                      <Award className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <p className="font-bold text-amber-800">Certificado para:</p>
                      <p className="text-lg text-amber-700">{currentUser.full_name || currentUser.email}</p>
                      <p className="text-xs text-amber-600 mt-1">{format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</p>
                    </Card>
                  )}
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setSelectedCourse(null)} className="flex-1">
                      Volver
                    </Button>
                    {!quizResult.passed && (
                      <Button onClick={() => { setShowQuiz(true); setQuizResult(null); setQuizAnswers({}); }} className="flex-1 bg-purple-500 text-white">
                        Reintentar
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold">Evaluación</h3>
                  {selectedCourse.quiz.map((question, qIndex) => (
                    <div key={qIndex} className="p-4 bg-gray-50 rounded-xl">
                      <p className="font-medium mb-3">{qIndex + 1}. {question.q}</p>
                      <div className="space-y-2">
                        {question.options.map((opt, oIndex) => (
                          <button
                            key={oIndex}
                            onClick={() => setQuizAnswers({ ...quizAnswers, [qIndex]: oIndex })}
                            className={`w-full p-3 rounded-lg text-left transition-all ${
                              quizAnswers[qIndex] === oIndex 
                                ? 'bg-purple-500 text-white' 
                                : 'bg-white border border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button 
                    onClick={submitQuiz} 
                    disabled={Object.keys(quizAnswers).length < selectedCourse.quiz.length}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    Enviar Respuestas
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}