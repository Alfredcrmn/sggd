import { useState } from "react";
import { supabase } from "../../supabase/client";
import { useAuth } from "../../context/AuthContext";
import { Truck, Save, Upload, AlertCircle, Hash } from "lucide-react"; // Agregué el icono Hash para el folio
import QuickQRUpload from "../QuickQRUpload"; 

const VendorHandover = ({ table, id, onUpdate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Opción A: URL recibida por QR
  const [evidenceUrl, setEvidenceUrl] = useState(null);
  // Opción B: Archivo manual
  const [manualFile, setManualFile] = useState(null);

  const [sessionId] = useState(() => crypto.randomUUID());

  const [form, setForm] = useState({
    vendedor_nombre: "",
    vendedor_telefono: "",
    fecha: new Date().toISOString().split('T')[0],
    folio_recoleccion: "" // 1. NUEVO CAMPO EN EL ESTADO
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!evidenceUrl && !manualFile) {
        return alert("⚠️ Se requiere evidencia. Escanea el QR o sube una foto manualmente.");
    }
    
    setLoading(true);
    try {
      let finalUrl = evidenceUrl;

      // Subida manual si no hay QR
      if (!finalUrl && manualFile) {
          const fileName = `firmas/${table}_${id}_${Date.now()}`;
          const { error: upError } = await supabase.storage.from('evidencias').upload(fileName, manualFile);
          if (upError) throw upError;
          
          const { data } = supabase.storage.from('evidencias').getPublicUrl(fileName);
          finalUrl = data.publicUrl;
      }

      const updateData = {
        vendedor_nombre: form.vendedor_nombre,
        vendedor_telefono: form.vendedor_telefono,
        fecha_entrega_proveedor: form.fecha,
        folio_recoleccion_proveedor: form.folio_recoleccion, // 2. ENVIAR A LA BASE DE DATOS
        evidencia_entrega_url: finalUrl,
        entregado_por_id: user.id,
        estatus: 'con_proveedor'
      };

      const { error } = await supabase.from(table).update(updateData).eq('id', id);

      if (error) throw error;
      alert("✅ Entregado a proveedor correctamente.");
      onUpdate();

    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ESTILOS VISUALES LIMPIOS ---
  return (
    <div style={{ padding: '5px' }}> 
      
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
        <Truck size={22} color="#b45309" /> 
        Paso 2: Entrega a Proveedor
      </h3>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* 3. CAMPO DE FOLIO */}
        <div>
            <label className="form-label" style={{display:'block', marginBottom:'5px', fontSize:'0.9rem', color:'#64748b'}}>
                Folio de Recolección
            </label>
            <div style={{ position: 'relative' }}>
                <Hash size={18} style={{ position: 'absolute', top: '12px', left: '10px', color: '#94a3b8' }} />
                <input required type="text" className="form-input" 
                    placeholder="Ej. RA-88420"
                    value={form.folio_recoleccion}
                    onChange={e => setForm({...form, folio_recoleccion: e.target.value})} 
                    style={{width: '100%', padding: '10px', paddingLeft: '35px', borderRadius: '6px', border: '1px solid #cbd5e1'}}
                />
            </div>
        </div>

        {/* DATOS DEL VENDEDOR */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{display:'block', marginBottom:'5px', fontSize:'0.9rem', color:'#64748b'}}>Nombre del Vendedor</label>
                <input required type="text" className="form-input" 
                    placeholder="Nombre completo"
                    value={form.vendedor_nombre}
                    onChange={e => setForm({...form, vendedor_nombre: e.target.value})} 
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1'}}
                />
            </div>
            <div>
                <label className="form-label" style={{display:'block', marginBottom:'5px', fontSize:'0.9rem', color:'#64748b'}}>Teléfono</label>
                <input required type="tel" className="form-input" 
                    placeholder="Contacto"
                    value={form.vendedor_telefono}
                    onChange={e => setForm({...form, vendedor_telefono: e.target.value})} 
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1'}}
                />
            </div>
            <div>
                <label className="form-label" style={{display:'block', marginBottom:'5px', fontSize:'0.9rem', color:'#64748b'}}>Fecha Recolección</label>
                <input required type="date" className="form-input" 
                    value={form.fecha}
                    onChange={e => setForm({...form, fecha: e.target.value})} 
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1'}}
                />
            </div>
        </div>
        
        {/* SECCIÓN DE EVIDENCIA (QR + Manual) */}
        <div>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontSize:'0.9rem', color:'#64748b' }}>Evidencia de Entrega (Foto de Firma)</label>
            
            <QuickQRUpload 
                sessionId={sessionId} 
                onUploadComplete={(url) => {
                    setEvidenceUrl(url);
                    setManualFile(null); 
                }} 
            />

            {!evidenceUrl && (
                <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    <input 
                        type="file" 
                        id="manual-upload" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={e => setManualFile(e.target.files[0])} 
                    />
                    <label htmlFor="manual-upload" style={{ fontSize: '0.85rem', color: '#64748b', cursor: 'pointer', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Upload size={14}/> 
                        {manualFile ? `Archivo seleccionado: ${manualFile.name}` : "O subir archivo desde esta PC"}
                    </label>
                </div>
            )}
        </div>

        <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', color: '#b45309', display: 'flex', gap: '8px', border: '1px solid #fef3c7' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>Al confirmar, el estatus cambiará a "Con Proveedor" y se notificará el seguimiento.</span>
        </div>

        <button disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', backgroundColor: '#b45309', border: 'none', padding: '12px', fontSize: '1rem' }}>
            {loading ? "Registrando..." : <><Save size={18} /> Confirmar Entrega</>}
        </button>
      </form>
    </div>
  );
};

export default VendorHandover;