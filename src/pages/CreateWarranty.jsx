import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const CreateWarranty = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Catálogos
  const [sucursales, setSucursales] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [formData, setFormData] = useState({
    sucursal_id: "",
    proveedor_id: "",
    producto_nombre: "",
    producto_clave: "",
    factura_numero: "",
    factura_valor: "",
    // Campos específicos de Garantía
    defecto_descripcion: "",
    cliente_nombre: "",
    cliente_telefono: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: suc } = await supabase.from('sucursales').select('*');
      const { data: prov } = await supabase.from('proveedores').select('*');
      if (suc) setSucursales(suc);
      if (prov) setProveedores(prov);
      // Pre-seleccionar
      if (suc?.length) setFormData(prev => ({ ...prev, sucursal_id: suc[0].id }));
    };
    fetchData();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const comentarioCliente = `\n[Cliente: ${formData.cliente_nombre} - Tel: ${formData.cliente_telefono}]`;
    const descripcionFinal = formData.defecto_descripcion + comentarioCliente;

    try {
      const { error } = await supabase.from('garantias').insert([
        {
          sucursal_id: formData.sucursal_id,
          recibido_por_id: user.id, // Campo específico de garantías
          proveedor_id: formData.proveedor_id,
          producto_nombre: formData.producto_nombre,
          producto_clave: formData.producto_clave,
          factura_numero: formData.factura_numero,
          factura_valor: formData.factura_valor || 0,
          defecto_descripcion: descripcionFinal,
          estatus: 'activo',
          tipo_resolucion: 'pendiente'
        }
      ]);

      if (error) throw error;
      alert("Garantía registrada correctamente");
      navigate("/");
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>🛡️ Nueva Garantía</h2>
      <form onSubmit={handleSubmit} className="form-section">
        
        {/* SUCURSAL */}
        <div className="form-group">
            <label className="form-label">Sucursal</label>
            <select name="sucursal_id" className="form-select" value={formData.sucursal_id} onChange={handleChange} required>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
        </div>

        {/* PRODUCTO Y PROVEEDOR */}
        <div className="form-row">
            <div className="form-group">
                <label className="form-label">Producto *</label>
                <input required name="producto_nombre" className="form-input" onChange={handleChange} />
            </div>
            <div className="form-group">
                <label className="form-label">Proveedor *</label>
                <select name="proveedor_id" className="form-select" value={formData.proveedor_id} onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
            </div>
        </div>

        {/* FACTURACIÓN */}
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

        {/* DETALLE ESPECÍFICO GARANTÍA */}
        <div className="form-group">
            <label className="form-label">Descripción del Defecto *</label>
            <textarea required name="defecto_descripcion" className="form-textarea" onChange={handleChange} placeholder="¿Qué le falla al equipo?"></textarea>
        </div>

        {/* CLIENTE */}
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

        <button type="submit" className="btn btn-primary" disabled={loading} style={{marginTop: '1rem'}}>
            {loading ? "Guardando..." : "Crear Garantía"}
        </button>
      </form>
    </div>
  );
};

export default CreateWarranty;