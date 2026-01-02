import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";

const ProcessList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("garantias"); // 'garantias' o 'devoluciones'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Diccionario para mapear colores de estatus
  const statusColors = {
    'activo': 'bg-blue-100 text-blue-800',
    'pendiente': 'bg-yellow-100 text-yellow-800',
    'cerrado': 'bg-gray-100 text-gray-800',
    'En Taller': 'bg-purple-100 text-purple-800'
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]); // Se recarga cada vez que cambias de pestaña

  const fetchData = async () => {
    setLoading(true);
    try {
      // Magia: Elegimos la tabla según la pestaña activa
      const tabla = activeTab === "garantias" ? "garantias" : "devoluciones";

      let query = supabase
        .from(tabla)
        .select(`
          *,
          sucursales ( nombre, codigo_prefijo ),
          proveedores ( nombre )
        `)
        .order('created_at', { ascending: false });

      const { data: result, error } = await query;

      if (error) throw error;
      setData(result);

    } catch (error) {
      console.error("Error al cargar lista:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtro simple por Folio o Producto
  const filteredData = data.filter(item => 
    item.folio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.producto_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Historial de Procesos</h1>
        
        {/* BUSCADOR */}
        <input 
          type="text" 
          placeholder="🔍 Buscar por folio o producto..." 
          className="form-input"
          style={{ width: '300px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* PESTAÑAS (TABS) */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => setActiveTab("garantias")}
          style={{
            padding: '10px 20px',
            borderBottom: activeTab === "garantias" ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
            color: activeTab === "garantias" ? 'var(--color-brand-primary)' : '#64748b',
            fontWeight: activeTab === "garantias" ? 'bold' : 'normal',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          🛡️ Garantías
        </button>
        <button 
          onClick={() => setActiveTab("devoluciones")}
          style={{
            padding: '10px 20px',
            borderBottom: activeTab === "devoluciones" ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
            color: activeTab === "devoluciones" ? 'var(--color-brand-primary)' : '#64748b',
            fontWeight: activeTab === "devoluciones" ? 'bold' : 'normal',
            background: 'none',
            cursor: 'pointer'
          }}
        >
          ↩️ Devoluciones
        </button>
      </div>

      {/* TABLA DE DATOS */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={thStyle}>Folio</th>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}>Sucursal</th>
              <th style={thStyle}>Producto</th>
              <th style={thStyle}>Proveedor</th>
              <th style={thStyle}>Estatus</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No se encontraron registros.</td></tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 'bold', color: '#334155' }}>{item.folio}</span>
                  </td>
                  <td style={tdStyle}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td style={tdStyle}>
                    {item.sucursales?.nombre}
                  </td>
                  <td style={tdStyle}>
                    {item.producto_nombre}
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.producto_clave}</div>
                  </td>
                  <td style={tdStyle}>
                    {item.proveedores?.nombre}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      background: item.estatus === 'activo' ? '#dbeafe' : '#f1f5f9',
                      color: item.estatus === 'activo' ? '#1e40af' : '#475569'
                    }}>
                      {item.estatus?.toUpperCase()}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button 
                      onClick={() => navigate(`/process/${item.id}?type=${activeTab}`)}
                      style={{ 
                        border: '1px solid #cbd5e1', 
                        padding: '5px 10px', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontSize: '0.85rem' 
                      }}>
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Estilos rápidos para tablas
const thStyle = { textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' };
const tdStyle = { padding: '1rem', fontSize: '0.9rem', color: '#334155' };

export default ProcessList;