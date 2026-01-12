import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";

// Importamos las vistas específicas
import WarrantyDetail from "./WarrantyDetail";
import ReturnDetail from "./ReturnDetail";

const ProcessDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Leemos el parámetro 'type' de la URL (ej: ?type=garantias)
  const rawType = searchParams.get("type");

  // --- LÓGICA DE NORMALIZACIÓN ---
  // Esto hace que el componente sea robusto: entiende singular Y plural
  const getProcessType = (type) => {
    if (!type) return null;
    const t = type.toLowerCase();
    
    // Si es garantía (singular o plural) -> retorna 'garantias'
    if (t === 'garantia' || t === 'garantias') return 'garantias';
    
    // Si es devolución (singular o plural) -> retorna 'devoluciones'
    if (t === 'devolucion' || t === 'devoluciones') return 'devoluciones';
    
    return null;
  };

  const processType = getProcessType(rawType);

  // Si no hay tipo válido, mostramos el error (que es el que estás viendo ahora)
  if (!processType) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Error de Navegación</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            No se especificó un tipo de proceso válido en la URL.<br/>
            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>Recibido: "{rawType || 'null'}"</span>
        </p>
        <button onClick={() => navigate('/processes')} className="btn btn-primary">
            <ArrowLeft size={18} /> Volver al Historial
        </button>
      </div>
    );
  }

  // --- RENDERIZADO CONDICIONAL ---
  // Aquí decidimos qué componente cargar según el tipo normalizado
  
  if (processType === 'garantias') {
    return <WarrantyDetail id={id} />;
  }

  if (processType === 'devoluciones') {
    return <ReturnDetail id={id} />;
  }

  return null;
};

export default ProcessDetail;