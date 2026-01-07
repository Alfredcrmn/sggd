import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  ShieldCheck, 
  Save, 
  Upload, 
  User, 
  Package, 
  FileText, 
  CreditCard,
  X 
} from "lucide-react";

const CreateWarranty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [file, setFile] = useState(null);
  
  const [formData, setFormData] = useState({
    folio: "",
    sucursal_id: "",
    proveedor_id: "",
    producto_nombre: "",
    producto_clave: "",
    producto_costo: "",
    defecto_descripcion: "",
    cliente_nombre: "",
    cliente_telefono: ""
  });
  
  useEffect(() => {
    const fetchCatalogos = async () => {
      const { data: sucs } = await supabase.from('sucursales').select('*');
      const { data: provs } = await supabase.from('proveedores').select('*');
      if (sucs) setSucursales(sucs);
      if (provs) setProveedores(provs);
    };
    fetchCatalogos();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("⚠️ Es obligatorio adjuntar la foto de evidencia (QR).");

    setLoading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `garantias/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('evidencias').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('evidencias').getPublicUrl(filePath);

        const { error: insertError } = await supabase.from('garantias').insert({
            ...formData,
            evidencia_entrega_url: publicUrlData.publicUrl,
            estatus: 'activo',
            recibido_por_id: user.id
        });

        if (insertError) throw insertError;
        alert("✅ Garantía registrada correctamente.");
        navigate("/processes");
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', padding: '0 1rem', paddingBottom: '3rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fff7ed', padding: '8px', borderRadius: '8px' }}>
            <ShieldCheck size={28} className="text-orange" />
        </div>
        <div>
            <h1 style={{ fontSize: '1.5rem' }}>Nueva Garantía</h1>
            <p className="text-sm">Registro de producto defectuoso.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* GRID PRINCIPAL */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'stretch' }}>
            
            {/* COLUMNA IZQUIERDA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* ORIGEN */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                        <FileText size={16} /> Datos del Origen
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="form-label">Folio Ticket</label>
                            <input required name="folio" type="text" className="form-input" placeholder="Ej: A-12345" onChange={handleInputChange} />
                        </div>
                        <div>
                            <label className="form-label">Sucursal</label>
                            <select required name="sucursal_id" className="form-select" onChange={handleInputChange}>
                                <option value="">Seleccione...</option>
                                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Proveedor</label>
                            <select required name="proveedor_id" className="form-select" onChange={handleInputChange}>
                                <option value="">Seleccione...</option>
                                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* PRODUCTO */}
                <div className="card" style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                        <Package size={16} /> Detalles del Producto
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="form-label">Producto</label>
                            <input required name="producto_nombre" type="text" className="form-input" placeholder="Nombre completo..." onChange={handleInputChange} />
                        </div>
                        <div>
                            <label className="form-label">SKU</label>
                            <input required name="producto_clave" type="text" className="form-input" placeholder="Clave..." onChange={handleInputChange} />
                        </div>
                        <div>
                            <label className="form-label">Costo</label>
                            <div style={{ position: 'relative' }}>
                                <CreditCard size={16} style={{ position: 'absolute', left: '8px', top: '10px', color: '#94a3b8' }} />
                                <input required name="producto_costo" type="number" className="form-input" style={{ paddingLeft: '2rem' }} placeholder="0.00" onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                    <div>
                         <label className="form-label">Falla Reportada</label>
                         <textarea required name="defecto_descripcion" className="form-input" rows="5" placeholder="Describe el defecto..." onChange={handleInputChange} style={{ resize: 'none' }}></textarea>
                    </div>
                </div>
            </div>

            {/* COLUMNA DERECHA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* CLIENTE */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                        <User size={16} /> Cliente
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                            <label className="form-label">Nombre</label>
                            <input required name="cliente_nombre" type="text" className="form-input" onChange={handleInputChange} />
                        </div>
                        <div>
                            <label className="form-label">Teléfono</label>
                            <input required name="cliente_telefono" type="tel" className="form-input" onChange={handleInputChange} />
                        </div>
                    </div>
                </div>

                {/* EVIDENCIA (Expandida con flex: 1) */}
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                        <Upload size={16} /> Evidencia
                    </h3>
                    
                    {/* El contenedor dashed también crece con flex: 1 */}
                    <div style={{ 
                        border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '1rem', 
                        textAlign: 'center', background: '#f8fafc', flex: 1, 
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                    }}>
                        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="file-upload" />
                        <label htmlFor="file-upload" style={{ cursor: 'pointer', width: '100%' }}>
                            <div style={{ marginBottom: '15px' }}>
                                {file ? (
                                    <div style={{background: '#dcfce7', color: '#166534', padding: '8px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px'}}>
                                        ✅ Imagen Cargada
                                    </div>
                                ) : (
                                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Haz clic para subir foto</span>
                                )}
                            </div>
                            <div className="btn btn-secondary" style={{ width: '100%' }}>
                                {file ? "Cambiar Archivo" : "Seleccionar Archivo"}
                            </div>
                        </label>
                    </div>
                </div>

            </div>
        </div>

        {/* BOTONES INFERIORES GRANDES */}
        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
            <button 
                type="button" 
                onClick={() => navigate('/')} 
                className="btn"
                style={{ 
                    padding: '1rem', 
                    fontSize: '1rem', 
                    background: 'white', 
                    border: '1px solid #cbd5e1',
                    color: '#64748b'
                }}
            >
                <X size={20} /> Cancelar
            </button>
            
            <button 
                type="submit" 
                disabled={loading} 
                className="btn btn-primary"
                style={{ padding: '1rem', fontSize: '1rem', justifyContent: 'center' }}
            >
                {loading ? "Registrando..." : (
                    <>
                        <Save size={20} /> Registrar Garantía
                    </>
                )}
            </button>
        </div>

      </form>
    </div>
  );
};

export default CreateWarranty;