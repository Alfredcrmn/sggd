import { useState } from "react";
import { supabase } from "../../supabase/client";
import { useAuth } from "../../context/AuthContext";
import { RefreshCcw } from "lucide-react";
import ResolutionForms from "../ResolutionForms"; 

const ProcessResolution = ({ table, id, isGarantia, onUpdate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reentryDate, setReentryDate] = useState(new Date().toISOString().split('T')[0]);
  const [resolutionType, setResolutionType] = useState("");
  const [formValues, setFormValues] = useState({});

  const opciones = isGarantia 
    ? [{ value: 'nota_credito', label: 'Nota de Crédito' }, { value: 'cambio_fisico', label: 'Cambio Físico' }, { value: 'reparacion', label: 'Reparación' }]
    : [{ value: 'nota_credito', label: 'Nota de Crédito' }, { value: 'cambio_fisico', label: 'Cambio Físico' }];

  const handleSubmit = async () => {
    if (!resolutionType) return alert("Selecciona una resolución.");
    
    setLoading(true);
    try {
        // CAMBIO AQUÍ: Usamos 'por_aprobar'
        const nextStatus = isGarantia ? 'por_aprobar' : 'pendiente_cierre';

        const updateData = {
            fecha_reingreso_tienda: reentryDate,
            tipo_resolucion: resolutionType,
            datos_resolucion: formValues,
            recibido_de_proveedor_por_id: user.id,
            estatus: nextStatus
        };

        const { error } = await supabase.from(table).update(updateData).eq('id', id);
        if (error) throw error;

        alert("✅ Resolución registrada. Enviada a validación del Administrador.");
        onUpdate();
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#0369a1', fontWeight: 'bold' }}>
            <RefreshCcw size={20} /> Paso 3: Reingreso y Resolución
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <label className="form-label">Fecha Reingreso</label>
                <input type="date" className="form-input" value={reentryDate} onChange={e => setReentryDate(e.target.value)} />
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Propuesta de Resolución</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {opciones.map(op => (
                        <label key={op.value} className={`btn ${resolutionType === op.value ? 'btn-primary' : 'btn-secondary'}`} style={{fontSize: '0.85rem', padding: '8px 12px'}}>
                            <input type="radio" name="resType" value={op.value} style={{display:'none'}} onChange={e => { setResolutionType(e.target.value); setFormValues({}); }} />
                            {op.label}
                        </label>
                    ))}
                </div>
            </div>

            <ResolutionForms isGarantia={isGarantia} resolutionType={resolutionType} onChange={e => setFormValues({...formValues, [e.target.name]: e.target.value})} />

            <button onClick={handleSubmit} disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '10px' }}>
                {loading ? "Procesando..." : "Enviar a Revisión"}
            </button>
        </div>
    </div>
  );
};
export default ProcessResolution;