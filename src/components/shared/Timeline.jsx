import { Check, Clock, AlertCircle } from "lucide-react";

const Timeline = ({ currentStatus, type, onStepClick, viewStep }) => {
  
  // 1. Define steps dynamically based on type
  // If it's a 'devolucion', we skip 'Entrega Cliente'
  const getSteps = () => {
    const commonStart = [
      { label: "Creada", status: "creado" },
      { label: "Folio SICAR", status: "asignar_folio_sicar" },
      { label: "Entrega Prov.", status: "pendiente_validacion" },
      { label: "Resolución", status: "con_proveedor" }
    ];

    if (type === 'garantia' || type === 'garantias') {
        return [
            ...commonStart,
            { label: "Entrega Cliente", status: "listo_para_entrega" },
            { label: "Cerrado", status: "cerrado" }
        ];
    } else {
        // Devolución: Skip 'Entrega Cliente'
        return [
            ...commonStart,
            { label: "Cerrado", status: "cerrado" }
        ];
    }
  };

  const steps = getSteps();

  // 2. Logic to map backend status to step index
  const getCurrentStepIndex = (status) => {
    // Common indexes
    if (status === 'creado') return 0;
    if (status === 'asignar_folio_sicar') return 1;
    if (status === 'activo' || status === 'pendiente_validacion') return 2;
    if (status === 'con_proveedor' || status === 'por_aprobar' || status === 'pendiente_cierre') return 3;

    // Divergent indexes based on type
    if (type === 'garantia' || type === 'garantias') {
        if (status === 'listo_para_entrega') return 4;
        if (status === 'cerrado') return 5;
    } else {
        // For returns, closed is immediately after resolution (index 3)
        if (status === 'cerrado') return 4; 
    }
    
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex(currentStatus);
  const viewStepIndex = viewStep ? getCurrentStepIndex(viewStep) : currentStepIndex;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', margin: '20px 0' }}>
      
      {/* Background Line (Gray) */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '4px', background: '#e2e8f0', zIndex: 0, transform: 'translateY(-50%)' }} />

      {/* Progress Line (Color) */}
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
        
        let circleColor = '#e2e8f0'; // Gray default
        
        if (isCompleted) {
            circleColor = type === 'garantia' ? 'var(--color-brand-primary)' : '#0ea5e9';
        }

        // Highlight selected view
        const isSelectedView = viewStep && index === viewStepIndex;

        return (
          <div 
            key={index} 
            onClick={() => {
                if (index <= currentStepIndex && onStepClick) {
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
                border: isSelectedView ? '3px solid #1e293b' : '3px solid white', 
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