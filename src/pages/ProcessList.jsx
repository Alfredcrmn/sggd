import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom"; 
import { 
  Filter, 
  ShieldCheck, 
  Undo2, 
  Eye, 
  XCircle,
  Building2
  // Eliminamos Calendar de aquí
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

  // --- FILTROS DE FECHA ---
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- ESTADO DE ROL ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [userBranchId, setUserBranchId] = useState(null);

  useEffect(() => {
    checkUserRole();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (userBranchId || isAdmin) {
        fetchData();
    }
  }, [statusFilter, isAdmin, userBranchId, startDate, endDate]);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: perfil } = await supabase.from('perfiles').select('rol, sucursal_id').eq('id', user.id).single();
        if (perfil) {
            const esAdmin = perfil.rol === 'admin';
            setIsAdmin(esAdmin);
            setUserBranchId(perfil.sucursal_id);

            if (!esAdmin && perfil.sucursal_id) {
                setBranchFilter(perfil.sucursal_id.toString());
            }
        }
    }
  };

  const fetchBranches = async () => {
    const { data } = await supabase.from('sucursales').select('id, nombre');
    if (data) setBranches(data);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let queryG = supabase.from('garantias').select('id, folio, producto_nombre, created_at, estatus, sucursales(id, nombre), proveedores(nombre)');
      let queryD = supabase.from('devoluciones').select('id, folio, producto_nombre, created_at, estatus, sucursales(id, nombre), proveedores(nombre)');

      if (statusFilter !== 'todos') {
        queryG = queryG.eq('estatus', statusFilter);
        queryD = queryD.eq('estatus', statusFilter);
      }

      if (!isAdmin && userBranchId) {
        queryG = queryG.eq('sucursal_id', userBranchId);
        queryD = queryD.eq('sucursal_id', userBranchId);
      }

      // Filtro de Fechas
      if (startDate) {
          queryG = queryG.gte('created_at', startDate);
          queryD = queryD.gte('created_at', startDate);
      }
      if (endDate) {
          const endDateTime = `${endDate}T23:59:59`;
          queryG = queryG.lte('created_at', endDateTime);
          queryD = queryD.lte('created_at', endDateTime);
      }

      const [resG, resD] = await Promise.all([queryG, queryD]);

      if (resG.error) throw resG.error;
      if (resD.error) throw resD.error;

      const combined = [
        ...(resG.data || []).map(i => ({ ...i, type: 'garantias', folio: i.folio })),
        ...(resD.data || []).map(i => ({ ...i, type: 'devoluciones', folio: i.folio }))
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

  const filteredData = data.filter(item => {
    const matchesText = 
      (item.folio || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.producto_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.proveedores?.nombre || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = isAdmin 
        ? (branchFilter === "todos" || item.sucursales?.id.toString() === branchFilter)
        : true; 

    const matchesType = typeFilter === "todos" || 
                        (typeFilter === "garantias" && item.type === "garantias") ||
                        (typeFilter === "devoluciones" && item.type === "devoluciones");

    return matchesText && matchesBranch && matchesType;
  });

  const getBadgeStyle = (status) => {
    const colors = {
        creado: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
        activo: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
        asignar_folio_sicar: { bg: '#e0e7ff', color: '#1e3a8a', border: '#c7d2fe' },
        con_proveedor: { bg: '#f3e8ff', color: '#7e22ce', border: '#d8b4fe' },
        por_aprobar: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
        pendiente_cierre: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
        listo_para_entrega: { bg: '#fef9c3', color: '#a16207', border: '#fde047' },
        cerrado: { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
    };

    const style = colors[status] || { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };

    return {
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
        textTransform: 'capitalize'
    };
  };

  // ESTILO COMÚN PARA TODOS LOS INPUTS (ALTURA FIJA)
  const commonInputStyle = { height: '42px', fontSize: '0.9rem' };

  return (
    <div className="container" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
        <div>
          <h1>Historial de Procesos</h1>
          <p className="text-sm">
            {isAdmin 
                ? "Gestión unificada de todas las sucursales." 
                : "Gestión de procesos de tu sucursal."}
          </p>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS */}
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flexShrink: 0 }}>
        
        {/* FILTROS SUPERIORES */}
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isAdmin ? '2fr 1fr 1fr 2fr' : '2fr 1fr 2fr', 
            gap: '1rem',
            alignItems: 'end'
        }}>
            {/* 1. BUSCADOR */}
            <div>
                <label className="text-sm font-bold text-gray-500 mb-1 block">Búsqueda</label>
                <input 
                  type="text" 
                  placeholder="Folio, producto..." 
                  className="form-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={commonInputStyle} // Altura forzada
                />
            </div>

            {/* 2. TIPO */}
            <div>
                <label className="text-sm font-bold text-gray-500 mb-1 block">Tipo</label>
                <select 
                    className="form-select" 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    style={commonInputStyle} // Altura forzada
                >
                    <option value="todos">Todos</option>
                    <option value="garantias">Garantías</option>
                    <option value="devoluciones">Devoluciones</option>
                </select>
            </div>
            
            {/* 3. SUCURSAL (Solo Admin) */}
            {isAdmin && (
                <div>
                    <label className="text-sm font-bold text-gray-500 mb-1 block">Sucursal</label>
                    <select 
                        className="form-select"
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        style={commonInputStyle} // Altura forzada
                    >
                        <option value="todos">Todas</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.nombre}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* 4. RANGO DE FECHAS */}
            <div>
                {/* Se eliminó el ícono <Calendar /> de aquí */}
                <label className="text-sm font-bold text-gray-500 mb-1 block">
                    Fechas
                </label>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <input 
                        type="date" 
                        className="form-input" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={commonInputStyle} // Altura forzada
                    />
                    <span style={{ color: '#94a3b8' }}>-</span>
                    <input 
                        type="date" 
                        className="form-input" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={commonInputStyle} // Altura forzada
                    />
                </div>
            </div>
        </div>

        {/* TABS ESTATUS */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px', borderBottom: '1px solid #f1f5f9' }}>
            {[
                { id: 'todos', label: 'Todos' },
                { id: 'creado', label: 'Creado' }, 
                { id: 'activo', label: 'Activo' }, 
                { id: 'asignar_folio_sicar', label: 'Folio SICAR' },
                { id: 'por_aprobar', label: 'Por Aprobar' },
                { id: 'con_proveedor', label: 'Con Proveedor' },
                { id: 'listo_para_entrega', label: 'Entrega' },
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
      <div className="card" style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {loading ? (
           <div className="p-8 text-center">Cargando historial...</div>
        ) : filteredData.length === 0 ? (
           <div className="p-8 text-center" style={{ color: '#94a3b8' }}>
              <XCircle size={48} style={{ margin: '0 auto 10px auto', opacity: 0.3 }} />
              <p>No se encontraron registros.</p>
              <button 
                  onClick={() => { 
                      setSearchTerm(""); 
                      setTypeFilter("todos"); 
                      setBranchFilter("todos"); 
                      setStartDate(""); 
                      setEndDate(""); 
                      handleStatusChange('todos'); 
                  }} 
                  className="btn btn-secondary" 
                  style={{ marginTop: '1rem' }}
              >
                  Limpiar Filtros
              </button>
           </div>
        ) : (
           <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
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
                    <td style={tdStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: '500', color: '#334155' }}>
                                {item.proveedores?.nombre || "N/A"}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
                                {isAdmin && <Building2 size={12} />}
                                <span>{item.sucursales?.nombre}</span>
                            </div>
                        </div>
                    </td>
                    <td style={{ ...tdStyle, color: '#64748b', fontSize: '0.85rem' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td style={tdStyle}>
                      <span className="badge" style={getBadgeStyle(item.estatus)}>
                        {item.estatus.replace(/_/g, ' ')}
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