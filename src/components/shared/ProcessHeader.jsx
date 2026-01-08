import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, ShieldCheck, Undo2 } from "lucide-react";

const ProcessHeader = ({ data, type }) => { // type: 'garantia' | 'devolucion'
  const navigate = useNavigate();
  const isGarantia = type === 'garantia';

  const getStatusColor = (status) => {
    if (status === 'cerrado') return 'badge-closed';
    if (status === 'pendiente_validacion') return 'badge-pending';
    return 'badge-active';
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <button 
          onClick={() => navigate(-1)} 
          className="btn"
          style={{ background: 'transparent', border: 'none', paddingLeft: 0, color: '#64748b', marginBottom: '1rem' }}
      >
          <ArrowLeft size={18} /> Volver al listado
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ 
                  padding: '12px', borderRadius: '12px',
                  background: isGarantia ? '#fff7ed' : '#f0f9ff',
                  color: isGarantia ? 'var(--color-brand-primary)' : '#0ea5e9'
              }}>
                  {isGarantia ? <ShieldCheck size={32} /> : <Undo2 size={32} />}
              </div>
              <div>
                  <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                      {data.folio}
                      <span className={`badge ${getStatusColor(data.estatus)}`} style={{ fontSize: '0.9rem', padding: '5px 12px' }}>
                          {data.estatus.replace('_', ' ').toUpperCase()}
                      </span>
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', marginTop: '4px', fontSize: '0.9rem' }}>
                      <Calendar size={14} /> 
                      Registrado el {new Date(data.created_at).toLocaleDateString()}
                  </div>
              </div>
          </div>
          
          <div style={{ textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 'bold', color: '#cbd5e1' }}>ID INTERNO</div>
              {data.id}
          </div>
      </div>
    </div>
  );
};

export default ProcessHeader;