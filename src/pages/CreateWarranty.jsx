import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthContext";
// Icons
import { ShieldCheck, Save, X, Store, Ticket, User, Package, FileText, DollarSign, Hash } from "lucide-react";

const CreateWarranty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Catálogos
  const [sucursales, setSucursales] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  
  // Estado para controlar bloqueo de sucursal
  const [isBranchLocked, setIsBranchLocked] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    folio_ticket: "",
    sucursal_id: "",
    proveedor_id: "",
    cliente_nombre: "",
    cliente_telefono: "",
    producto_nombre: "",
    producto_clave: "",
    factura_valor: "",
    defecto_descripcion: "",
  });

  // Cargar catálogos y perfil
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 1. Catálogos
        const { data: sucData } = await supabase.from("sucursales").select("*");
        setSucursales(sucData || []);

        const { data: provData } = await supabase.from("proveedores").select("*");
        setProveedores(provData || []);
        
        // 2. Perfil para Auto-asignar
        if (user) {
            const { data: perfil } = await supabase
                .from('perfiles')
                .select('rol, sucursal_id')
                .eq('id', user.id)
                .single();
            
            if (perfil) {
                // Si NO es admin y tiene sucursal, la asignamos y bloqueamos
                if (perfil.rol !== 'admin' && perfil.sucursal_id) {
                    setFormData(prev => ({ ...prev, sucursal_id: perfil.sucursal_id }));
                    setIsBranchLocked(true);
                }
            }
        }
      } catch (error) {
        console.error("Error general cargando datos:", error);
      }
    };
    fetchInitialData();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.folio_ticket || !formData.sucursal_id || !formData.proveedor_id || !formData.producto_nombre || !formData.defecto_descripcion) {
      alert("Por favor complete los campos obligatorios marcados con *");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("garantias").insert([
        {
          ...formData,
          factura_valor: formData.factura_valor ? parseFloat(formData.factura_valor) : 0,
          estatus: "creado",
          recibido_por_id: user.id,
        },
      ]);

      if (error) throw error;

      alert("✅ Garantía registrada correctamente");
      navigate("/processes"); 
    } catch (error) {
      console.error("Error al registrar:", error.message);
      alert("Error al registrar la garantía: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Estilos de UI Limpios
  const sectionTitleStyle = { fontSize: '1.1rem', fontWeight: '600', color: '#334155', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' };
  const inputGroupStyle = { marginBottom: '1rem' };
  const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '600' };
  const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.95rem', transition: 'border-color 0.2s', outline: 'none' };

  return (
    <div className="container" style={{ padding: '0 2rem 2rem 2rem', width: '100%' }}>
      
      {/* HEADER */}
      <div style={{ padding: '2rem 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: '#fff7ed', padding: '10px', borderRadius: '12px', color: '#ea580c' }}>
            <ShieldCheck size={28} strokeWidth={2} />
        </div>
        <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Nueva Garantía</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Registro inicial de producto defectuoso en tienda.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* DATOS DEL ORIGEN */}
            <div className="card">
                <h3 style={sectionTitleStyle}><FileText size={20} color="#64748b"/> Datos del Origen</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Folio Ticket *</label>
                        <div style={{ position: 'relative' }}>
                            <Ticket size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
                            <input type="text" name="folio_ticket" value={formData.folio_ticket} onChange={handleChange} style={{...inputStyle, paddingLeft: '34px'}} placeholder="Ej: A-12345" required />
                        </div>
                    </div>
                    
                    {/* SUCURSAL AUTO-ASIGNADA */}
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Sucursal *</label>
                        <div style={{ position: 'relative' }}>
                            <select 
                                name="sucursal_id" 
                                value={formData.sucursal_id} 
                                onChange={handleChange} 
                                style={{
                                    ...inputStyle, 
                                    paddingLeft: '34px',
                                    backgroundColor: isBranchLocked ? '#f1f5f9' : 'white',
                                    cursor: isBranchLocked ? 'not-allowed' : 'pointer'
                                }} 
                                disabled={isBranchLocked}
                                required
                            >
                                <option value="">Seleccione...</option>
                                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Proveedor *</label>
                        <select name="proveedor_id" value={formData.proveedor_id} onChange={handleChange} style={inputStyle} required>
                            <option value="">Seleccione...</option>
                            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>
                </div>
            </div>

             {/* DETALLES DEL PRODUCTO */}
             <div className="card">
                <h3 style={sectionTitleStyle}><Package size={20} color="#64748b"/> Detalles del Producto</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem' }}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Producto *</label>
                        <input type="text" name="producto_nombre" value={formData.producto_nombre} onChange={handleChange} style={inputStyle} placeholder="Nombre completo..." required />
                    </div>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>SKU / Clave</label>
                        <div style={{ position: 'relative' }}>
                            <Hash size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
                            <input type="text" name="producto_clave" value={formData.producto_clave} onChange={handleChange} style={{...inputStyle, paddingLeft: '34px'}} placeholder="Clave..." />
                        </div>
                    </div>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Valor</label>
                        <div style={{ position: 'relative' }}>
                            <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
                            <input type="number" name="factura_valor" value={formData.factura_valor} onChange={handleChange} style={{...inputStyle, paddingLeft: '34px'}} placeholder="0.00" step="0.01" />
                        </div>
                    </div>
                </div>
                 <div style={inputGroupStyle}>
                        <label style={labelStyle}>Falla Reportada *</label>
                        <textarea name="defecto_descripcion" value={formData.defecto_descripcion} onChange={handleChange} style={{...inputStyle, resize: 'vertical', minHeight: '100px'}} placeholder="Describa el defecto detalladamente..." required />
                    </div>
            </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem' }}>
            
            {/* DATOS CLIENTE */}
            <div className="card">
                 <h3 style={sectionTitleStyle}><User size={20} color="#64748b"/> Cliente</h3>
                 <div style={inputGroupStyle}>
                    <label style={labelStyle}>Nombre</label>
                    <input type="text" name="cliente_nombre" value={formData.cliente_nombre} onChange={handleChange} style={inputStyle} placeholder="Nombre del Cliente" />
                 </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Teléfono</label>
                    <input type="tel" name="cliente_telefono" value={formData.cliente_telefono} onChange={handleChange} style={inputStyle} placeholder="Teléfono del Cliente" />
                 </div>
            </div>

            {/* BOTONES */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => navigate('/processes')} className="btn btn-secondary" disabled={loading} style={{ flex: 1, justifyContent: 'center', height: '45px' }}>
                    <X size={18} /> Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, justifyContent: 'center', background: '#ea580c', border: 'none', height: '45px' }}>
                    {loading ? 'Registrando...' : <><Save size={18} /> Registrar Garantía</>}
                </button>
            </div>

        </div>
      </form>
    </div>
  );
};

export default CreateWarranty;