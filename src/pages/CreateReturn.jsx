import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const CreateReturn = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [sucursales, setSucursales] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [formData, setFormData] = useState({
    sucursal_id: "",
    proveedor_id: "",
    producto_nombre: "",
    producto_clave: "",
    factura_numero: "",
    factura_valor: "",
    // Campos específicos de Devolución
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
    setLoading(true);

    const comentarioCliente = `\n[Cliente: ${formData.cliente_nombre} - Tel: ${formData.cliente_telefono}]`;
    const razonFinal = formData.razon_devolucion + comentarioCliente;

    try {
      const { error } = await supabase.from('devoluciones').insert([
        {
          sucursal_id: formData.sucursal_id,
          solicitado_por_id: user.id, // <--- OJO: Campo diferente a garantías
          proveedor_id: formData.proveedor_id,
          producto_nombre: formData.producto_nombre,
          producto_clave: formData.producto_clave,
          factura_numero: formData.factura_numero,
          factura_valor: formData.factura_valor || 0,
          razon_devolucion: razonFinal, // <--- OJO: Campo diferente
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
      <h2 style={{ marginBottom: '1.5rem' }}>↩️ Nueva Devolución</h2>
      <form onSubmit={handleSubmit} className="form-section">
        {/* Puedes copiar la estructura visual de Garantía, es casi idéntica */}
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
                <label className="form-label">Proveedor *</label>
                <select name="proveedor_id" className="form-select" value={formData.proveedor_id} onChange={handleChange} required>
                    <option value="">Seleccione...</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
            </div>
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

        {/* CAMPO ESPECÍFICO DEVOLUCIÓN */}
        <div className="form-group">
            <label className="form-label">Razón de la Devolución *</label>
            <textarea required name="razon_devolucion" className="form-textarea" onChange={handleChange} placeholder="¿Por qué se devuelve? (Ej: Pedido incorrecto, exceso de stock)"></textarea>
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

        <button type="submit" className="btn btn-primary" disabled={loading} style={{marginTop: '1rem'}}>
            {loading ? "Guardando..." : "Crear Devolución"}
        </button>
      </form>
    </div>
  );
};

export default CreateReturn;