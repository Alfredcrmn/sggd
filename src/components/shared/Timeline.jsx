import { Check, Clock, AlertCircle } from "lucide-react";

const Timeline = ({ currentStatus, type, onStepClick, viewStep }) => {
  
  // Definimos los pasos lógicos del proceso
  const steps = [
    { label: "Creada", status: "creado" },
    { label: "Folio SICAR", status: "asignar_folio_sicar" }, // NUEVO PASO
    { label: "Entrega Prov.", status: "pendiente_validacion" }, // Este paso usa VendorHandover
    { label: "Resolución", status: "con_proveedor" }, // Engloba con_proveedor y por_aprobar
    { label: "Entrega Cliente", status: "listo_para_entrega" },
    { label: "Cerrado", status: "cerrado" }
  ];

  // Función para determinar en qué índice numérico va el proceso actual
  const getCurrentStepIndex = (status) => {
    switch (status) {
      case 'creado': return 0;
      case 'asignar_folio_sicar': return 1;

      case 'activo': 
      case 'pendiente_validacion': return 2;

      case 'con_proveedor': 
      case 'por_aprobar': 
      case 'pendiente_cierre': return 3; // Todos estos son fase de resolución/espera
      case 'listo_para_entrega': return 4;
      case 'cerrado': return 5;
      default: return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex(currentStatus);
  const viewStepIndex = viewStep ? getCurrentStepIndex(viewStep) : currentStepIndex;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', margin: '20px 0' }}>
      
      {/* Línea de fondo (gris) */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '4px', background: '#e2e8f0', zIndex: 0, transform: 'translateY(-50%)' }} />

      {/* Línea de progreso (color) */}
      <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: 0, 
          height: '4px', 
          background: type === 'garantia' ? 'var(--color-brand-primary)' : '#0ea5e9', 
          zIndex: 0, 
          transform: 'translateY(-50%)',
          width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
          transition: 'width 0.5s ease'
      }} />

      {steps.map((step, index) => {
        const isCompleted = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isViewed = index === viewStepIndex;

        let circleColor = '#e2e8f0'; // Gris por defecto
        let iconColor = '#94a3b8';
        
        if (isCompleted) {
            circleColor = type === 'garantia' ? 'var(--color-brand-primary)' : '#0ea5e9';
            iconColor = 'white';
        }

        // Estilo especial para el paso que estamos "mirando" (si el usuario hizo clic en historial)
        const isSelectedView = viewStep && index === viewStepIndex;

        return (
          <div 
            key={index} 
            onClick={() => {
                // Solo permitimos navegar a pasos anteriores o al actual
                if (index <= currentStepIndex && onStepClick) {
                    // Mapeamos el label del timeline de regreso a un status "genérico" para que WarrantyDetail sepa qué mostrar
                    onStepClick(step.status); 
                }
            }}
            style={{ 
                position: 'relative', 
                zIndex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                cursor: index <= currentStepIndex ? 'pointer' : 'default' 
            }}
          >
            <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: circleColor, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: isSelectedView ? '3px solid #1e293b' : '3px solid white', // Resaltar selección
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.3s'
            }}>
                {isCompleted ? (
                    isCurrent ? <Clock size={16} color="white" /> : <Check size={16} color="white" />
                ) : (
                    <div style={{ width: '8px', height: '8px', background: '#cbd5e1', borderRadius: '50%' }} />
                )}
            </div>
            
            <span style={{ 
                marginTop: '8px', 
                fontSize: '0.75rem', 
                fontWeight: isCurrent ? '700' : '500', 
                color: isCurrent ? '#1e293b' : '#94a3b8',
                position: 'absolute',
                top: '35px',
                width: '100px',
                textAlign: 'center'
            }}>
                {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;