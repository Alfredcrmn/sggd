import { useState } from "react";
import { supabase } from "../../supabase/client";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const AdminReview = ({ table, id, currentStatus, onUpdate }) => {
  const { user } = useAuth(); 
  const [loading, setLoading] = useState(false);

  // Determinar contexto
  const isGarantiaMiddleStep = currentStatus === 'por_aprobar';
  
  // Configuración de Textos
  const title = isGarantiaMiddleStep ? "Revisión de Resolución" : "Validación de Cierre";
  
  const approveText = isGarantiaMiddleStep ? "Aprobar Resolución" : "Validar y Cerrar";
  const rejectText = "Rechazar";

  const description = isGarantiaMiddleStep 
      ? "El equipo ha propuesto una resolución. Revisa los datos y autoriza el paso a la entrega al cliente." 
      : "Se ha completado el proceso operativo. Verifica la evidencia final para cerrar el ticket definitivamente.";

  // LÓGICA: APROBAR
  const handleApprove = async () => {
    if (!window.confirm("¿Confirmas la validación de esta etapa?")) return;

    setLoading(true);
    try {
        const updateData = {};

        if (isGarantiaMiddleStep) {
            updateData.estatus = 'listo_para_entrega';
            updateData.validado_por_admin_id = user.id;
        } else {
            updateData.estatus = 'cerrado';
            updateData.fecha_cierre = new Date();
            updateData.cerrado_por_id = user.id;
            
            if (table === 'devoluciones') {
                updateData.validado_por_admin_id = user.id;
            }
        }

        const { error } = await supabase.from(table).update(updateData).eq('id', id);
        if (error) throw error;
        
        alert("✅ Aprobado correctamente.");
        onUpdate();
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  // LÓGICA: RECHAZAR
  const handleReject = async () => {
    const reason = window.prompt("Indica la razón del rechazo para que el equipo pueda corregirlo:");
    if (reason === null) return; 

    setLoading(true);
    try {
        let targetStatus = '';

        if (isGarantiaMiddleStep) {
            targetStatus = 'con_proveedor';
        } else {
            if (table === 'garantias') {
                targetStatus = 'listo_para_entrega';
            } else {
                targetStatus = 'con_proveedor';
            }
        }

        const { error } = await supabase.from(table).update({
            estatus: targetStatus,
            validado_por_admin_id: null 
        }).eq('id', id);

        if (error) throw error;
        alert(`⚠️ Etapa rechazada. Regresando a corrección.`);
        onUpdate();
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={{ 
        animation: 'fadeIn 0.3s ease', 
        background: '#fff', 
        borderRadius: '12px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        position: 'relative'
    }}>
        {/* Barra lateral de acento */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: '#f59e0b' }} />

        <div style={{ padding: '1.5rem 1.5rem 1.5rem 2rem' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.8rem' }}>
                <div style={{ 
                    background: '#fffbeb', color: '#b45309', 
                    padding: '8px', borderRadius: '8px', display: 'flex' 
                }}>
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: '700' }}>
                        {title}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        ACCIÓN DE ADMINISTRADOR
                    </span>
                </div>
            </div>
            
            {/* Descripción */}
            <div style={{ marginBottom: '1.5rem', paddingLeft: '4px' }}>
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                    {description}
                </p>
            </div>

            {/* Botones de Acción */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                
                {/* Botón Rechazar (Outline Rojo) */}
                <button 
                    onClick={handleReject} 
                    disabled={loading} 
                    className="btn" 
                    style={{ 
                        flex: 1, 
                        justifyContent: 'center', 
                        background: '#fff', 
                        color: '#ef4444', 
                        border: '1px solid #fca5a5',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                >
                    <XCircle size={18} /> {rejectText}
                </button>

                {/* Botón Aprobar (Sólido Brand/Verde) */}
                <button 
                    onClick={handleApprove} 
                    disabled={loading} 
                    className="btn" 
                    style={{ 
                        flex: 1.5, 
                        justifyContent: 'center', 
                        background: '#059669', // Verde Esmeralda para "Aprobar"
                        color: 'white', 
                        border: 'none',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                    }}
                >
                    {loading ? "Procesando..." : <><CheckCircle2 size={18} /> {approveText}</>}
                </button>
            </div>
        </div>
    </div>
  );
};

export default AdminReview;