import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { 
  AlertCircle, 
  ShieldCheck, 
  Undo2, 
  ArrowRight,
  Truck,
  Package,       
  ClipboardCheck,
  FileSignature
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  // 1. ESTADO PARA LOS 5 KPIs
  const [stats, setStats] = useState({
    asignarFolio: 0,
    conProveedor: 0,
    porAprobar: 0,
    listoEntrega: 0,
    pendienteCierre: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [userBranchName, setUserBranchName] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol, sucursal_id, sucursales(nombre)')
        .eq('id', user.id)
        .single();

      const esAdmin = perfil?.rol === 'admin';
      const miSucursalId = perfil?.sucursal_id;
      
      setIsAdmin(esAdmin);
      if (perfil?.sucursales) setUserBranchName(perfil.sucursales.nombre);

      // HELPER QUERY
      const buildCountQuery = (table, estatus) => {
        let q = supabase.from(table).select('*', { count: 'exact', head: true }).eq('estatus', estatus);
        if (!esAdmin && miSucursalId) {
            q = q.eq('sucursal_id', miSucursalId);
        }
        return q;
      };

      // EJECUTAR CONSULTAS
      const [
        { count: gAsignar }, { count: dAsignar },
        { count: gProv }, { count: dProv },
        { count: gAprob }, { count: dAprob },
        { count: gListo }, { count: dListo },
        { count: gCierre }, { count: dCierre }
      ] = await Promise.all([
        buildCountQuery('garantias', 'asignar_folio_sicar'),
        buildCountQuery('devoluciones', 'asignar_folio_sicar'),
        buildCountQuery('garantias', 'con_proveedor'),
        buildCountQuery('devoluciones', 'con_proveedor'),
        buildCountQuery('garantias', 'por_aprobar'),
        buildCountQuery('devoluciones', 'por_aprobar'),
        buildCountQuery('garantias', 'listo_para_entrega'),
        buildCountQuery('devoluciones', 'listo_para_entrega'),
        buildCountQuery('garantias', 'pendiente_cierre'),
        buildCountQuery('devoluciones', 'pendiente_cierre')
      ]);

      setStats({
        asignarFolio: (gAsignar || 0) + (dAsignar || 0),
        conProveedor: (gProv || 0) + (dProv || 0),
        porAprobar: (gAprob || 0) + (dAprob || 0),
        listoEntrega: (gListo || 0) + (dListo || 0),
        pendienteCierre: (gCierre || 0) + (dCierre || 0)
      });

      // CARGAR ACTIVIDAD RECIENTE
      let qRecentG = supabase
        .from('garantias')
        .select('id, folio, producto_nombre, created_at, estatus, sucursales(nombre), proveedores(nombre)')
        .order('created_at', { ascending: false })
        .limit(5);

      let qRecentD = supabase
        .from('devoluciones')
        .select('id, folio, producto_nombre, created_at, estatus, sucursales(nombre), proveedores(nombre)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!esAdmin && miSucursalId) {
        qRecentG = qRecentG.eq('sucursal_id', miSucursalId);
        qRecentD = qRecentD.eq('sucursal_id', miSucursalId);
      }

      const [{ data: gData }, { data: dData }] = await Promise.all([qRecentG, qRecentD]);

      const combined = [
        ...(gData || []).map(i => ({ ...i, type: 'garantia', folio: i.folio })),
        ...(dData || []).map(i => ({ ...i, type: 'devolucion', folio: i.folio }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
       .slice(0, 10);

      setRecentActivity(combined);

    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE COLORES EXACTA (Sin Tailwind) ---
  const getBadgeStyle = (status) => {
    // Colores base solicitados
    const colors = {
        creado: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' }, // Naranja
        activo: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' }, // Naranja
        asignar_folio_sicar: { bg: '#e0e7ff', color: '#1e3a8a', border: '#c7d2fe' }, // Azul Marino
        con_proveedor: { bg: '#f3e8ff', color: '#7e22ce', border: '#d8b4fe' }, // Morado
        por_aprobar: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' }, // Verde
        pendiente_cierre: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' }, // Verde
        listo_para_entrega: { bg: '#fef9c3', color: '#a16207', border: '#fde047' }, // Amarillo
        cerrado: { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' }, // Rojo
    };

    const style = colors[status] || { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };

    return {
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        // Aseguramos que se vea bien aunque la clase 'badge' falle
        whiteSpace: 'nowrap',
        textTransform: 'capitalize'
    };
  };

  const handleCardClick = (statusFilter) => {
    navigate(`/processes?status=${statusFilter}`);
  };

  const cardPointerStyle = { cursor: 'pointer', transition: 'transform 0.2s' };

  if (loading) return <div className="p-8">Cargando tablero...</div>;

  return (
    <div className="container" style={{ 
        height: 'calc(100vh - 65px)', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        paddingBottom: 0 
    }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
            <h2>Resumen Operativo</h2>
            <p className="text-sm" style={{ color: '#64748b' }}>
                {isAdmin ? "Vista Global (Todas las Sucursales)" : `Sucursal: ${userBranchName}`}
            </p>
        </div>
        <span className="text-sm" style={{ color: '#64748b' }}>Última actualización: {new Date().toLocaleTimeString()}</span>
      </div>

      {/* --- SECCIÓN 1: KPIs (5 Columnas) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem', flexShrink: 0 }}>
        
        {/* KPI 1: ASIGNAR FOLIO (Azul Marino) */}
        <div 
            className="card hover-scale" 
            style={{ ...cardPointerStyle, borderLeft: '4px solid #1e3a8a' }}
            onClick={() => handleCardClick('asignar_folio_sicar')}
        > 
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-sm" style={{ fontWeight: '600', color: '#1e3a8a', fontSize: '0.75rem' }}>FOLIO SICAR</p>
              <h2 style={{ fontSize: '2.2rem', color: 'var(--color-dark-bg)', margin: '5px 0' }}>{stats.asignarFolio}</h2>
            </div>
            <div style={{ background: '#e0e7ff', padding: '8px', borderRadius: '50%' }}>
              <FileSignature size={22} color="#1e3a8a" />
            </div>
          </div>
          <p className="text-sm" style={{ fontSize: '0.75rem' }}>Pendientes de sistema.</p>
        </div>

        {/* KPI 2: CON PROVEEDOR (Morado) */}
        <div 
            className="card hover-scale" 
            style={{ ...cardPointerStyle, borderLeft: '4px solid #9333ea' }}
            onClick={() => handleCardClick('con_proveedor')}
        > 
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-sm" style={{ fontWeight: '600', color: '#9333ea', fontSize: '0.75rem' }}>PROVEEDOR</p>
              <h2 style={{ fontSize: '2.2rem', color: 'var(--color-dark-bg)', margin: '5px 0' }}>{stats.conProveedor}</h2>
            </div>
            <div style={{ background: '#f3e8ff', padding: '8px', borderRadius: '50%' }}>
              <Truck size={22} color="#9333ea" />
            </div>
          </div>
          <p className="text-sm" style={{ fontSize: '0.75rem' }}>Revisión externa.</p>
        </div>

        {/* KPI 3: POR APROBAR (Verde) */}
        <div 
            className="card hover-scale" 
            style={{ ...cardPointerStyle, borderLeft: '4px solid #16a34a' }} 
            onClick={() => handleCardClick('por_aprobar')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-sm" style={{ fontWeight: '600', color: '#16a34a', fontSize: '0.75rem' }}>POR APROBAR</p>
              <h2 style={{ fontSize: '2.2rem', color: 'var(--color-dark-bg)', margin: '5px 0' }}>{stats.porAprobar}</h2>
            </div>
            <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '50%' }}>
              <AlertCircle size={22} color="#16a34a" />
            </div>
          </div>
          <p className="text-sm" style={{ fontSize: '0.75rem' }}>Autorización req.</p>
        </div>

        {/* KPI 4: LISTO ENTREGA (Amarillo) */}
        <div 
            className="card hover-scale" 
            style={{ ...cardPointerStyle, borderLeft: '4px solid #ca8a04' }}
            onClick={() => handleCardClick('listo_para_entrega')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-sm" style={{ fontWeight: '600', color: '#ca8a04', fontSize: '0.75rem' }}>ENTREGA</p>
              <h2 style={{ fontSize: '2.2rem', color: 'var(--color-dark-bg)', margin: '5px 0' }}>{stats.listoEntrega}</h2>
            </div>
            <div style={{ background: '#fef9c3', padding: '8px', borderRadius: '50%' }}>
              <Package size={22} color="#ca8a04" />
            </div>
          </div>
          <p className="text-sm" style={{ fontSize: '0.75rem' }}>En sucursal.</p>
        </div>

        {/* KPI 5: PENDIENTE CIERRE (Verde) */}
        <div 
            className="card hover-scale" 
            style={{ ...cardPointerStyle, borderLeft: '4px solid #059669' }}
            onClick={() => handleCardClick('pendiente_cierre')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-sm" style={{ fontWeight: '600', color: '#059669', fontSize: '0.75rem' }}>VALIDACIÓN</p>
              <h2 style={{ fontSize: '2.2rem', color: 'var(--color-dark-bg)', margin: '5px 0' }}>{stats.pendienteCierre}</h2>
            </div>
            <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '50%' }}>
              <ClipboardCheck size={22} color="#059669" />
            </div>
          </div>
          <p className="text-sm" style={{ fontSize: '0.75rem' }}>Cierre admin.</p>
        </div>
      </div>

      {/* --- SECCIÓN 2: ACCESOS RÁPIDOS --- */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', border: 'none', marginBottom: '2rem', flexShrink: 0 }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <h3 style={{ color: 'white', margin: 0 }}>Accesos Rápidos</h3>
        </div>
        
        <div className="grid-2">
            <Link to="/create-warranty" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid #334155', justifyContent: 'space-between', padding: '1.2rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                    <ShieldCheck size={24} color="white" />
                </div>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>Nueva Garantía</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '400' }}>Reingreso por cliente</div>
                </div>
            </div>
            <ArrowRight size={20} color="#64748b" />
            </Link>

            <Link to="/create-return" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid #334155', justifyContent: 'space-between', padding: '1.2rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                    <Undo2 size={24} color="white" />
                </div>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>Nueva Devolución</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '400' }}>Registrar falla de producto</div>
                </div>
            </div>
            <ArrowRight size={20} color="#64748b" />
            </Link>
        </div>
      </div>

      {/* --- SECCIÓN 3: MOVIMIENTOS RECIENTES --- */}
      <div className="card" style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <h3 style={{ margin: 0 }}>Movimientos Recientes</h3>
            <Link to="/processes" style={{ fontSize: '0.85rem', color: 'var(--color-brand-primary)', textDecoration: 'none', fontWeight: '600' }}>Ver historial completo →</Link>
          </div>

          {recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>No hay actividad reciente.</div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '50px 2fr 1.5fr 1fr 210px', padding: '0 1rem 10px 1rem', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 1 }}>
                    <span>Tipo</span>
                    <span>Folio / Producto</span>
                    <span>Proveedor / Sucursal</span>
                    <span>Fecha</span>
                    <span style={{textAlign: 'right'}}>Estatus</span>
                </div>

                {recentActivity.map((item) => (
                  <div 
                    key={`${item.type}-${item.id}`}
                    onClick={() => navigate(`/process/${item.id}?type=${item.type}`)}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} 
                    style={{ display: 'grid', gridTemplateColumns: '50px 2fr 1.5fr 1fr 210px', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'pointer' }}
                  >
                    <div style={{ color: item.type === 'garantia' ? 'var(--color-brand-primary)' : '#0ea5e9' }}>
                       {item.type === 'garantia' ? <ShieldCheck size={20} /> : <Undo2 size={20} />}
                    </div>
                    <div>
                        <div style={{ fontWeight: '600', color: 'var(--color-dark-bg)' }}>{item.folio}</div>
                        <div className="text-sm" style={{ color: '#64748b' }}>{item.producto_nombre}</div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', fontWeight: '500', color: '#334155' }}>
                            <Truck size={14} color="#94a3b8" />
                            {item.proveedores?.nombre || "N/A"}
                        </div>
                        <div className="text-sm" style={{ color: '#94a3b8', marginLeft: '19px' }}>
                            {item.sucursales?.nombre}
                        </div>
                    </div>
                    <div className="text-sm" style={{ color: '#64748b' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                        <br/>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        {/* USAMOS className="badge" PARA MANTENER TU DISEÑO ANTERIOR
                            Y style={...} PARA INYECTAR LOS COLORES NUEVOS EXACTOS
                        */}
                        <span 
                            className="badge"
                            style={getBadgeStyle(item.estatus)}
                        >
                          {item.estatus.replace(/_/g, ' ')}
                        </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default Dashboard;