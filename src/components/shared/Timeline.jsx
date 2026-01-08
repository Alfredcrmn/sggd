import { Check, Circle, Clock, AlertCircle } from "lucide-react";

const Timeline = ({ currentStatus, type, onStepClick, viewStep }) => {
  const isGarantia = type === 'garantia';

  const stepsGarantia = [
    { key: 'creado', label: 'Creada' },
    { key: 'con_proveedor', label: 'Con Proveedor' },
    { key: 'por_aprobar', label: 'Por Aprobar' },
    { key: 'listo_para_entrega', label: 'Entregar Cliente' },
    { key: 'pendiente_cierre', label: 'Validación Final' },
    { key: 'cerrado', label: 'Cerrado' },
  ];

  const stepsDevolucion = [
    { key: 'creado', label: 'Creada' },
    { key: 'con_proveedor', label: 'Con Proveedor' },
    { key: 'pendiente_cierre', label: 'Por Cerrar' },
    { key: 'cerrado', label: 'Cerrada' },
  ];

  const steps = isGarantia ? stepsGarantia : stepsDevolucion;
  
  // Normalización
  const mapStatus = (s) => s === 'activo' ? 'creado' : s;
  
  // 1. Estado REAL (Base de Datos) - Controla qué checks están marcados
  const dbStatusKey = mapStatus(currentStatus);
  const activeStepIndex = steps.findIndex(s => s.key === dbStatusKey);
  const safeActiveIndex = activeStepIndex === -1 ? 0 : activeStepIndex;

  // 2. Estado VISTO (Navegación) - Controla el anillo de selección
  const currentViewKey = mapStatus(viewStep || currentStatus);

  return (
    <>
      {/* Estilo para ocultar scrollbar en Chrome/Safari */}
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>

      <div 
        className="hide-scrollbar"
        style={{ 
            padding: '2rem 4px 1.5rem 4px', // Padding lateral mínimo para evitar corte del anillo
            width: '100%', 
            overflowX: 'auto',
            scrollbarWidth: 'none', // Ocultar en Firefox
            msOverflowStyle: 'none' // Ocultar en IE/Edge
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', minWidth: '600px' }}>
          
          {/* LÍNEA GRIS (Fondo) */}
          <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '4px', background: '#e2e8f0', zIndex: 0 }} />
          
          {/* LÍNEA DE COLOR (Progreso Real) */}
          <div style={{ 
              position: 'absolute', top: '15px', left: '0', height: '4px', background: isGarantia ? '#f97316' : '#0ea5e9', zIndex: 0,
              width: `${(safeActiveIndex / (steps.length - 1)) * 100}%`,
              transition: 'width 0.5s ease'
          }} />

          {steps.map((step, index) => {
            // Lógica BD
            const isCompleted = index < safeActiveIndex;
            const isCurrentReal = index === safeActiveIndex;
            const isPendingState = step.key.includes('pendiente') || step.key === 'por_aprobar';
            
            // Lógica UI
            const isViewing = step.key === currentViewKey;
            const isClickable = index <= safeActiveIndex;

            // Colores
            let bgColor = '#fff';
            let borderColor = '#e2e8f0';
            let iconColor = '#94a3b8';
            let IconComp = Circle;

            const brandColor = isGarantia ? '#f97316' : '#0ea5e9';

            if (isCompleted || isCurrentReal) {
              if (isCurrentReal && isPendingState) {
                  borderColor = '#eab308'; // Amarillo alerta
                  iconColor = '#eab308';
                  IconComp = AlertCircle;
              } else {
                  borderColor = brandColor;
                  if (isCompleted) {
                      bgColor = brandColor;
                      iconColor = '#fff';
                      IconComp = Check;
                  } else {
                      iconColor = brandColor;
                      IconComp = Clock;
                  }
              }
            }

            return (
              <div 
                  key={step.key} 
                  onClick={() => isClickable && onStepClick && onStepClick(step.key)}
                  style={{ 
                      position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px',
                      cursor: isClickable ? 'pointer' : 'default',
                      opacity: isClickable ? 1 : 0.5,
                      transform: isViewing ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.3s ease'
                  }}
              >
                {/* CÍRCULO CON ANILLO DE ENFOQUE */}
                <div style={{ 
                    width: '34px', height: '34px', borderRadius: '50%', 
                    background: bgColor, border: `3px solid ${borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    // ANILLO VISUAL (Halo)
                    boxShadow: isViewing 
                      ? `0 0 0 4px ${isGarantia ? 'rgba(249, 115, 22, 0.2)' : 'rgba(14, 165, 233, 0.2)'}` 
                      : 'none'
                }}>
                    <IconComp size={18} color={iconColor} strokeWidth={2.5} />
                </div>

                {/* TEXTO DESTACADO */}
                <div style={{ 
                    marginTop: '8px', fontSize: '0.70rem', textAlign: 'center',
                    fontWeight: isViewing ? '800' : (isCurrentReal ? '600' : 'normal'),
                    color: isViewing ? '#0f172a' : (isCurrentReal ? '#334155' : '#94a3b8'),
                    textDecoration: isViewing ? 'underline' : 'none',
                    textUnderlineOffset: '4px',
                    textDecorationColor: isViewing ? brandColor : 'transparent'
                }}>
                    {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Timeline;