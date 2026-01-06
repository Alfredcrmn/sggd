import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import QuickQRUpload from "../components/QuickQRUpload"; 

const CreateReturn = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Lógica QR
  const [showQr, setShowQr] = useState(false);
  const [tempSessionId] = useState(crypto.randomUUID());
  const [evidenciaUrl, setEvidenciaUrl] = useState(null);

  const [sucursales, setSucursales] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [formData, setFormData] = useState({
    sucursal_id: "",
    proveedor_id: "",
    recibido_por_proveedor_nombre: "", // <--- NUEVO CAMPO
    producto_nombre: "",
    producto_clave: "",
    factura_numero: "",
    factura_valor: "",
    razon_devolucion: "",
    cliente_nombre: "", 
    cliente_telefono: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: suc } = await supabase.from('sucursales').select('*');
      const { data: prov } = await supabase.from('proveedores').select('*');
      if (suc) setSucursales(suc);
      if (prov) setProveedores(prov);
      if (suc?.length) setFormData(prev => ({ ...prev, sucursal_id: suc[0].id }));
    };
    fetchData();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!evidenciaUrl) {
      alert("Es obligatorio adjuntar la evidencia de recibido por el proveedor.");
      return;
    }

    setLoading(true);

    const comentarioCliente = `\n[Cliente: ${formData.cliente_nombre} - Tel: ${formData.cliente_telefono}]`;
    const razonFinal = formData.razon_devolucion + comentarioCliente;

    try {
      const { error } = await supabase.from('devoluciones').insert([
        {
          sucursal_id: formData.sucursal_id,
          solicitado_por_id: user.id,
          proveedor_id: formData.proveedor_id,
          recibido_por_proveedor_nombre: formData.recibido_por_proveedor_nombre, // <--- GUARDAR CAMPO
          producto_nombre: formData.producto_nombre,
          producto_clave: formData.producto_clave,
          factura_numero: formData.factura_numero,
          factura_valor: formData.factura_valor || 0,
          razon_devolucion: razonFinal,
          evidencia_entrega_url: evidenciaUrl, 
          estatus: 'activo',
          tipo_resolucion: 'pendiente'
        }
      ]);

      if (error) throw error;
      alert("Devolución registrada correctamente");
      navigate("/");
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        ↩️ Nueva Devolución
      </h2>
      
      <div style={{ 
          display: 'grid', 
          gridTemplateColumns: showQr ? '1fr 350px' : '1fr', 
          gap: '2rem',
          transition: 'all 0.3s ease'
      }}>

        <form onSubmit={handleSubmit} className="form-section">
            <div className="form-group">
                <label className="form-label">Sucursal</label>
                <select name="sucursal_id" className="form-select" value={formData.sucursal_id} onChange={handleChange} required>
                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Producto *</label>
                    <input required name="producto_nombre" className="form-input" onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Proveedor (Empresa) *</label>
                    <select name="proveedor_id" className="form-select" value={formData.proveedor_id} onChange={handleChange} required>
                        <option value="">Seleccione...</option>
                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                </div>
            </div>

            {/* NUEVO INPUT PARA EL NOMBRE DEL REPRESENTANTE */}
            <div className="form-group">
                <label className="form-label">Nombre Nombre del Vendedor</label>
                <input 
                    name="recibido_por_proveedor_nombre" 
                    className="form-input" 
                    placeholder="Persona de contacto / Chofer"
                    onChange={handleChange} 
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Factura #</label>
                    <input name="factura_numero" className="form-input" onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Valor $</label>
                    <input type="number" name="factura_valor" className="form-input" onChange={handleChange} />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Razón de la Devolución *</label>
                <textarea required name="razon_devolucion" className="form-textarea" onChange={handleChange} placeholder="¿Por qué se devuelve?"></textarea>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Nombre Cliente</label>
                    <input name="cliente_nombre" className="form-input" onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input name="cliente_telefono" className="form-input" onChange={handleChange} />
                </div>
            </div>

            {/* BOTONES */}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '10px', flexDirection: 'column' }}>
                <button 
                    type="button" 
                    onClick={() => setShowQr(!showQr)}
                    style={{
                        padding: '10px',
                        background: evidenciaUrl ? '#dcfce7' : '#f1f5f9',
                        color: evidenciaUrl ? '#166534' : '#475569',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {evidenciaUrl ? "✅ Foto Adjuntada (Ver/Cambiar)" : "📸 Adjuntar Evidencia con Celular"}
                </button>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Guardando..." : "Crear Devolución"}
                </button>
            </div>
        </form>

        {showQr && (
            <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                <div style={{ position: 'sticky', top: '20px' }}>
                    <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>Escanear QR</h3>
                        <button onClick={() => setShowQr(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                    </div>
                    <QuickQRUpload sessionId={tempSessionId} onUploadComplete={(url) => setEvidenciaUrl(url)} />
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default CreateReturn;