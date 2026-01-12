import { useState, useEffect } from "react";
import { supabase } from "../../supabase/client";
import { useAuth } from "../../context/AuthContext";
import { RefreshCw, UserCheck, Hash, FileSpreadsheet, Calendar, User, Check } from "lucide-react";

const ProcessResolution = ({ table, id, isGarantia, onUpdate }) => {
  const { user } = useAuth();
  
  // 1. ESTADO PARA EL NOMBRE DEL USUARIO
  const [currentUserName, setCurrentUserName] = useState(user?.user_metadata?.nombre_completo || "Cargando...");

  const [resolutionType, setResolutionType] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Fecha visual
  const todayDate = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // Datos del formulario
  const [formData, setFormData] = useState({
    nota_credito_valor: "",
    folio_nc: "",
    factura_afectada: "",
    persona_notifica: "",
    fecha_notificacion: new Date().toISOString().split('T')[0],
    comentarios: "" 
  });

  // 2. EFECTO: TRAER EL NOMBRE REAL DESDE PERFILES
  useEffect(() => {
    const fetchProfileName = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('nombre_completo')
                .eq('id', user.id)
                .single();
            
            if (data?.nombre_completo) {
                setCurrentUserName(data.nombre_completo);
            }
        } catch (error) {
            console.error("Error al obtener nombre:", error);
        }
    };
    fetchProfileName();
  }, [user]);

  const handleSubmit = async () => {
    if (!resolutionType) return alert("Selecciona una propuesta de resolución");
    
    // VALIDACIONES
    if (resolutionType === 'nota_credito') {
        if (!formData.nota_credito_valor) return alert("Ingresa el valor ($)");
        if (!formData.folio_nc) return alert("Ingresa el Folio de la Nota de Crédito");
        if (!formData.factura_afectada) return alert("Ingresa la Factura Afectada");
    }

    if (resolutionType === 'reparacion' && !formData.comentarios) {
        return alert("Por favor agrega comentarios sobre la reparación.");
    }

    setLoading(true);
    try {
      const datosResolucion = {
        tipo: resolutionType,
        fecha_resolucion: new Date().toISOString(),
        valor_nota_credito: resolutionType === 'nota_credito' ? formData.nota_credito_valor : null,
        folio_nc: resolutionType === 'nota_credito' ? formData.folio_nc : null,
        facturas_afectadas: resolutionType === 'nota_credito' ? formData.factura_afectada : null,
        persona_notifica: resolutionType === 'nota_credito' ? formData.persona_notifica : null,
        fecha_notificacion: resolutionType === 'nota_credito' ? formData.fecha_notificacion : null
      };

      const updatePayload = {
        tipo_resolucion: resolutionType,
        fecha_reingreso_tienda: new Date(),
        datos_resolucion: datosResolucion,
        recibido_de_proveedor_por_id: user.id 
      };

      if (resolutionType === 'nota_credito') {
          updatePayload.factura_numero = formData.factura_afectada; 
      }

      // --- AQUÍ ESTÁ LA CORRECCIÓN DE LA VALIDACIÓN ADMINISTRATIVA ---
      if (table === 'garantias') {
          updatePayload.comentarios_reparacion = formData.comentarios; 
          // ANTES: 'listo_para_entrega' (Directo)
          // AHORA: 'por_aprobar' (Requiere validación admin)
          updatePayload.estatus = 'por_aprobar'; 
      } else {
          // Devoluciones -> 'pendiente_cierre' (Validación admin)
          updatePayload.estatus = 'pendiente_cierre';
      }

      const { error } = await supabase.from(table).update(updatePayload).eq('id', id);

      if (error) throw error;
      if (onUpdate) onUpdate();

    } catch (error) {
      console.error(error);
      alert("Error al guardar resolución.");
    } finally {
      setLoading(false);
    }
  };

  // --- ESTILOS VISUALES ---
  const labelStyle = { display: 'block', fontSize: '0.9rem', color: '#334155', marginBottom: '0.4rem', fontWeight: '500' };
  const inputStyle = { width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', color: '#334155', backgroundColor: 'white' };
  
  const btnStyle = (type) => ({
    flex: 1,
    padding: '10px',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'all 0.2s',
    border: resolutionType === type ? '1px solid #ea580c' : '1px solid #cbd5e1',
    backgroundColor: resolutionType === type ? '#ea580c' : 'white', 
    color: resolutionType === type ? 'white' : '#64748b',
    boxShadow: resolutionType === type ? '0 2px 4px rgba(234, 88, 12, 0.2)' : 'none'
  });

  return (
    <div style={{ padding: '5px' }}>
      
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
        <RefreshCw size={20} color="#ea580c" /> 
        Paso 3: Reingreso y Resolución
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
        
        {/* FECHA (Visual) */}
        <div>
            <label style={labelStyle}>Fecha Reingreso</label>
            <input type="text" readOnly value={todayDate} style={{ ...inputStyle, color: '#64748b', backgroundColor: '#f1f5f9' }} />
        </div>

        {/* BOTONES DE RESOLUCIÓN */}
        <div>
            <label style={labelStyle}>Propuesta de Resolución</label>
            <div style={{ display: 'flex', gap: '8px' }}>
                <div onClick={() => setResolutionType('nota_credito')} style={btnStyle('nota_credito')}>
                    Nota de Crédito
                </div>
                <div onClick={() => setResolutionType('cambio_fisico')} style={btnStyle('cambio_fisico')}>
                    Cambio Físico
                </div>
                {isGarantia && (
                    <div onClick={() => setResolutionType('reparacion')} style={btnStyle('reparacion')}>
                        Reparación
                    </div>
                )}
            </div>
        </div>

        {/* CAMPOS NOTA CRÉDITO */}
        {resolutionType === 'nota_credito' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff7ed', padding: '15px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                <div>
                    <label style={labelStyle}>Valor Nota Crédito ($)</label>
                    <input type="number" style={inputStyle} placeholder="0.00" value={formData.nota_credito_valor} onChange={(e) => setFormData({...formData, nota_credito_valor: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={labelStyle}><Hash size={14} style={{ display:'inline', marginRight:'4px' }}/> Folio NC</label>
                        <input type="text" style={inputStyle} placeholder="Ej: NC-100" value={formData.folio_nc} onChange={(e) => setFormData({...formData, folio_nc: e.target.value})} />
                    </div>
                    <div>
                        <label style={labelStyle}><FileSpreadsheet size={14} style={{ display:'inline', marginRight:'4px' }}/> Factura Afectada</label>
                        <input type="text" style={inputStyle} placeholder="Ej: F-500" value={formData.factura_afectada} onChange={(e) => setFormData({...formData, factura_afectada: e.target.value})} />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={labelStyle}><User size={14} style={{ display:'inline', marginRight:'4px' }}/> Notificado Por</label>
                        <input type="text" style={inputStyle} placeholder="Nombre Rep." value={formData.persona_notifica} onChange={(e) => setFormData({...formData, persona_notifica: e.target.value})} />
                    </div>
                    <div>
                        <label style={labelStyle}><Calendar size={14} style={{ display:'inline', marginRight:'4px' }}/> Fecha Notificación</label>
                        <input type="date" style={inputStyle} value={formData.fecha_notificacion} onChange={(e) => setFormData({...formData, fecha_notificacion: e.target.value})} />
                    </div>
                </div>
            </div>
        )}

        {/* CAMPOS REPARACIÓN */}
        {resolutionType === 'reparacion' && (
            <div className="animate-fade-in">
                <label style={labelStyle}>Comentarios sobre la Reparación</label>
                <textarea style={{...inputStyle, resize: 'vertical', minHeight: '80px'}} placeholder="Describe el trabajo realizado..." value={formData.comentarios} onChange={(e) => setFormData({...formData, comentarios: e.target.value})}></textarea>
            </div>
        )}

        {/* USUARIO QUE RECIBE (Muestra nombre real) */}
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ ...labelStyle, marginBottom: '8px', color: '#64748b' }}>Recibe en sucursal</label>
            <div style={{ 
                background: 'white', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid #cbd5e1', 
                color: '#334155',
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '0.95rem'
            }}>
                <UserCheck size={16} color="#94a3b8" />
                {currentUserName} 
            </div>
        </div>

      </div>

      <button 
        onClick={handleSubmit} 
        disabled={loading} 
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', backgroundColor: '#ea580c', border: 'none', padding: '12px', fontSize: '1rem', fontWeight: '500' }}
      >
        {loading ? "Guardando..." : "Enviar a Revisión"}
      </button>
    </div>
  );
};

export default ProcessResolution;