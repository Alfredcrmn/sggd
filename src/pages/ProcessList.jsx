import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom"; 
import { 
  Filter, 
  ShieldCheck, 
  Undo2, 
  Eye, 
  XCircle
} from "lucide-react";

const ProcessList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- FILTROS ---
  const [searchTerm, setSearchTerm] = useState("");
  const initialFilter = searchParams.get("status") || "todos";
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  
  const [branchFilter, setBranchFilter] = useState("todos");
  const [branches, setBranches] = useState([]);
  const [typeFilter, setTypeFilter] = useState("todos");

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchBranches = async () => {
    const { data } = await supabase.from('sucursales').select('id, nombre');
    if (data) setBranches(data);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let queryG = supabase
        .from('garantias')
        .select('id, folio, producto_nombre, created_at, estatus, sucursales(id, nombre), proveedores(nombre)');
      
      let queryD = supabase
        .from('devoluciones')
        .select('id, folio, producto_nombre, created_at, estatus, sucursales(id, nombre), proveedores(nombre)');

      if (statusFilter !== 'todos') {
        queryG = queryG.eq('estatus', statusFilter);
        queryD = queryD.eq('estatus', statusFilter);
      }

      const [resG, resD] = await Promise.all([queryG, queryD]);

      if (resG.error) throw resG.error;
      if (resD.error) throw resD.error;

      const combined = [
        ...(resG.data || []).map(i => ({ ...i, type: 'garantias' })),
        ...(resD.data || []).map(i => ({ ...i, type: 'devoluciones' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setData(combined);

    } catch (error) {
      console.error("Error al cargar lista:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
    setSearchParams({ status: newStatus });
  };

  // --- LÓGICA DE FILTRADO ---
  const filteredData = data.filter(item => {
    const matchesText = 
      item.folio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.producto_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.proveedores?.nombre || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = branchFilter === "todos" || item.sucursales?.id.toString() === branchFilter;
    const matchesType = typeFilter === "todos" || item.type === typeFilter;

    return matchesText && matchesBranch && matchesType;
  });

  const getStatusColor = (status) => {
    if (status === 'cerrado') return 'badge-closed';
    if (status === 'pendiente_validacion') return 'badge-pending';
    return 'badge-active';
  };

  return (
    <div className="container">
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Historial de Procesos</h1>
          <p className="text-sm">Gestión unificada de garantías y devoluciones.</p>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* FILA 1: FILTROS (Distribución equitativa para evitar amontonamiento) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            
            {/* Buscador (Sin Lupa) */}
            <div>
                <input 
                  type="text" 
                  placeholder="Buscar por folio, producto..." 
                  className="form-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filtro Tipo (Limpio) */}
            <div>
                <select 
                    className="form-select" 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="todos">Todos los Tipos</option>
                    <option value="garantias">Solo Garantías</option>
                    <option value="devoluciones">Solo Devoluciones</option>
                </select>
            </div>

            {/* Filtro Sucursal (Limpio) */}
            <div>
                <select 
                    className="form-select"
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                >
                    <option value="todos">Todas las Sucursales</option>
                    {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* FILA 2: TABS DE ESTATUS */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px', borderBottom: '1px solid #f1f5f9' }}>
            {[
                { id: 'todos', label: 'Todos' },
                { id: 'pendiente_validacion', label: 'Por Validar' },
                { id: 'activo', label: 'En Proceso' },
                { id: 'cerrado', label: 'Cerrados' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => handleStatusChange(tab.id)}
                    className="btn"
                    style={{ 
                        background: statusFilter === tab.id ? 'var(--color-dark-bg)' : 'white',
                        color: statusFilter === tab.id ? 'white' : 'var(--color-text-main)',
                        border: statusFilter === tab.id ? 'none' : '1px solid #e2e8f0',
                        fontSize: '0.85rem',
                        padding: '8px 16px',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {statusFilter === tab.id && <Filter size={14} />}
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
           <div className="p-8 text-center">Cargando historial...</div>
        ) : filteredData.length === 0 ? (
           <div className="p-8 text-center" style={{ color: '#94a3b8' }}>
              <XCircle size={48} style={{ margin: '0 auto 10px auto', opacity: 0.3 }} />
              <p>No se encontraron registros.</p>
              <button 
                  onClick={() => { setSearchTerm(""); setTypeFilter("todos"); setBranchFilter("todos"); handleStatusChange('todos'); }} 
                  className="btn btn-secondary" 
                  style={{ marginTop: '1rem' }}
              >
                  Limpiar Filtros
              </button>
           </div>
        ) : (
           <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Folio</th>
                  <th style={thStyle}>Producto</th>
                  <th style={thStyle}>Info</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Estatus</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={`${item.type}-${item.id}`} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                    <td style={tdStyle}>
                       <div style={{ 
                          width: '32px', height: '32px', borderRadius: '8px', 
                          background: item.type === 'garantias' ? '#fff7ed' : '#f0f9ff',
                          color: item.type === 'garantias' ? 'var(--color-brand-primary)' : '#0ea5e9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                       }}>
                          {item.type === 'garantias' ? <ShieldCheck size={18} /> : <Undo2 size={18} />}
                       </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '600', color: 'var(--color-dark-bg)' }}>
                      {item.folio}
                    </td>
                    <td style={tdStyle}>
                      {item.producto_nombre}
                    </td>
                    {/* INFO sin icono de camión */}
                    <td style={tdStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: '500', color: '#334155' }}>
                                {item.proveedores?.nombre || "N/A"}
                            </div>
                            <span style={{ color: '#94a3b8' }}>{item.sucursales?.nombre}</span>
                        </div>
                    </td>
                    {/* FECHA sin icono de calendario */}
                    <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.85rem' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td style={tdStyle}>
                      <span className={`badge ${getStatusColor(item.estatus)}`}>
                        {item.estatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button 
                        onClick={() => navigate(`/process/${item.id}?type=${item.type}`)}
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px' }}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
        )}
      </div>
    </div>
  );
};

const thStyle = { padding: '12px 16px' };
const tdStyle = { padding: '12px 16px' };

export default ProcessList;