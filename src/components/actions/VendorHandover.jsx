import { useState } from "react";
import { supabase } from "../../supabase/client";
import { useAuth } from "../../context/AuthContext";
import { Truck, Upload, Save } from "lucide-react";

const VendorHandover = ({ table, id, onUpdate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  
  const [form, setForm] = useState({
    vendedor_nombre: "",
    vendedor_telefono: "",
    fecha: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("⚠️ Se requiere foto de la firma/evidencia.");
    
    setLoading(true);
    try {
      // 1. Subir firma
      const fileName = `firmas/${table}_${id}_${Date.now()}`;
      const { error: upError } = await supabase.storage.from('evidencias').upload(fileName, file);
      if (upError) throw upError;
      
      const { data: publicUrl } = supabase.storage.from('evidencias').getPublicUrl(fileName);

      // 2. Guardar en BD (CORREGIDO: Usamos 'evidencia_entrega_url')
      const updateData = {
        vendedor_nombre: form.vendedor_nombre,
        vendedor_telefono: form.vendedor_telefono,
        fecha_entrega_proveedor: form.fecha,
        
        evidencia_entrega_url: publicUrl.publicUrl, // <--- CORRECCIÓN AQUÍ
        
        entregado_por_id: user.id,
        estatus: 'con_proveedor'
      };

      const { error } = await supabase.from(table).update(updateData).eq('id', id);

      if (error) throw error;
      alert("✅ Entregado a proveedor correctamente.");
      onUpdate();
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#b45309', fontWeight: 'bold' }}>
        <Truck size={20} /> Paso 2: Entrega a Proveedor
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
            <label className="form-label">Nombre del Vendedor</label>
            <input required type="text" className="form-input" 
                placeholder="Nombre completo"
                value={form.vendedor_nombre}
                onChange={e => setForm({...form, vendedor_nombre: e.target.value})} 
            />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
                <label className="form-label">Teléfono</label>
                <input required type="tel" className="form-input" 
                    placeholder="Contacto"
                    value={form.vendedor_telefono}
                    onChange={e => setForm({...form, vendedor_telefono: e.target.value})} 
                />
            </div>
            <div>
                <label className="form-label">Fecha Recolección</label>
                <input required type="date" className="form-input" 
                    value={form.fecha}
                    onChange={e => setForm({...form, fecha: e.target.value})} 
                />
            </div>
        </div>
        
        <div style={{ border: '2px dashed #cbd5e1', padding: '15px', borderRadius: '8px', textAlign: 'center', background: '#f8fafc' }}>
            <input type="file" id="firma-upload" accept="image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
            <label htmlFor="firma-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <Upload size={24} color="#94a3b8" />
                    {file ? <span style={{color: '#16a34a', fontWeight: 'bold'}}>✅ {file.name}</span> : "Subir Foto de Firma"}
                </div>
            </label>
        </div>

        <button disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center' }}>
            {loading ? "Registrando..." : <><Save size={18} /> Confirmar Entrega</>}
        </button>
      </form>
    </div>
  );
};

export default VendorHandover;