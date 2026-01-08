import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// Icons
import { 
  Undo2, 
  Save, 
  User, 
  Package, 
  FileText, 
  DollarSign, 
  Hash, 
  Ticket, 
  X,
  Store 
} from "lucide-react";

const CreateReturn = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  
  // Eliminado estado 'file'
  
  const [formData, setFormData] = useState({
    folio: "",
    sucursal_id: "",
    proveedor_id: "",
    producto_nombre: "",
    producto_clave: "",
    producto_costo: "",
    razon_devolucion: "",
    vendedor_nombre: "",
    vendedor_telefono: ""
  });
  
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const { data: sucs } = await supabase.from('sucursales').select('*');
        const { data: provs } = await supabase.from('proveedores').select('*');
        setSucursales(sucs || []);
        setProveedores(provs || []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCatalogos();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validaciones básicas (Ya no validamos 'file')
    if (!formData.folio || !formData.sucursal_id || !formData.proveedor_id || !formData.producto_nombre) {
        return alert("Por favor complete los campos obligatorios.");
    }

    setLoading(true);
    try {
        // Insertar registro DIRECTO (Sin subir imagen)
        const { error: insertError } = await supabase.from('devoluciones').insert({
            folio: formData.folio,
            sucursal_id: formData.sucursal_id,
            proveedor_id: formData.proveedor_id,
            producto_nombre: formData.producto_nombre,
            producto_clave: formData.producto_clave,
            factura_valor: formData.producto_costo ? parseFloat(formData.producto_costo) : 0,
            razon_devolucion: formData.razon_devolucion,
            vendedor_nombre: formData.vendedor_nombre,
            vendedor_telefono: formData.vendedor_telefono,
            // evidencia_entrega_url se omite (será NULL)
            estatus: 'creado',
            solicitado_por_id: user.id
        });

        if (insertError) throw insertError;
        alert("✅ Devolución registrada correctamente.");
        navigate("/processes");
    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  // ESTILOS UNIFICADOS
  const sectionTitleStyle = { fontSize: '1.1rem', fontWeight: '600', color: '#334155', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' };
  const inputGroupStyle = { marginBottom: '1rem' };
  const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '600' };
  const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.95rem', transition: 'border-color 0.2s', outline: 'none' };

  return (
    <div className="container" style={{ padding: '0 2rem 2rem 2rem', width: '100%' }}>
      
      {/* HEADER */}
      <div style={{ padding: '2rem 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '12px', color: '#0284c7' }}>
            <Undo2 size={28} strokeWidth={2} />
        </div>
        <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Nueva Devolución</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Reingreso de mercancía por cliente o error.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* ORIGEN */}
            <div className="card">
                <h3 style={sectionTitleStyle}><FileText size={20} color="#64748b"/> Datos del Origen</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Folio Ticket *</label>
                        <div style={{ position: 'relative' }}>
                            <Ticket size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
                            <input type="text" name="folio" className="form-input" style={{...inputStyle, paddingLeft: '34px'}} placeholder="Ej: F-99887" onChange={handleInputChange} required />
                        </div>
                    </div>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Sucursal *</label>
                        <select name="sucursal_id" style={inputStyle} onChange={handleInputChange} required>
                            <option value="">Seleccione...</option>
                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Proveedor *</label>
                        <select name="proveedor_id" style={inputStyle} onChange={handleInputChange} required>
                            <option value="">Seleccione...</option>
                            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* PRODUCTO */}
            <div className="card">
                <h3 style={sectionTitleStyle}><Package size={20} color="#64748b"/> Detalles del Producto</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem' }}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Producto *</label>
                        <input type="text" name="producto_nombre" style={inputStyle} placeholder="Nombre completo..." onChange={handleInputChange} required />
                    </div>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>SKU / Clave</label>
                        <div style={{ position: 'relative' }}>
                            <Hash size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
                            <input type="text" name="producto_clave" style={{...inputStyle, paddingLeft: '34px'}} placeholder="Clave..." onChange={handleInputChange} />
                        </div>
                    </div>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Valor</label>
                        <div style={{ position: 'relative' }}>
                            <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
                            <input type="number" name="producto_costo" style={{...inputStyle, paddingLeft: '34px'}} placeholder="0.00" onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
                <div style={inputGroupStyle}>
                     <label style={labelStyle}>Razón de Devolución *</label>
                     <textarea name="razon_devolucion" style={{...inputStyle, resize: 'vertical', minHeight: '80px'}} placeholder="Describa el motivo..." onChange={handleInputChange} required></textarea>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA (Sticky) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem' }}>
            
            {/* VENDEDOR */}
            <div className="card">
                <h3 style={sectionTitleStyle}><User size={20} color="#64748b"/> Datos del Vendedor</h3>
                <div style={inputGroupStyle}>
                    <label style={labelStyle}>Nombre Representante</label>
                    <input type="text" name="vendedor_nombre" style={inputStyle} placeholder="Nombre" onChange={handleInputChange} required />
                </div>
                <div style={inputGroupStyle}>
                    <label style={labelStyle}>Teléfono / Contacto</label>
                    <input type="tel" name="vendedor_telefono" style={inputStyle} placeholder="Teléfono" onChange={handleInputChange} required />
                </div>
            </div>

            {/* SE ELIMINÓ LA TARJETA DE EVIDENCIA */}

            {/* BOTONES */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => navigate('/processes')} className="btn btn-secondary" disabled={loading} style={{ flex: 1, justifyContent: 'center', height: '45px' }}>
                    <X size={18} /> Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, justifyContent: 'center', background: '#0284c7', border: 'none', height: '45px' }}>
                    {loading ? 'Guardando...' : <><Save size={18} /> Guardar Devolución</>}
                </button>
            </div>

        </div>
      </form>
    </div>
  );
};

export default CreateReturn;