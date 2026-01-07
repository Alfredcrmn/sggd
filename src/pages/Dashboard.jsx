import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase/client";
import { 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Undo2, 
  ArrowRight,
  Truck // Icono para proveedor
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    pendientes: 0,
    activos: 0,
    totalHistorico: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Cargar contadores (KPIs)
      const { count: pendingG } = await supabase.from('garantias').select('*', { count: 'exact', head: true }).eq('estatus', 'pendiente_validacion');
      const { count: pendingD } = await supabase.from('devoluciones').select('*', { count: 'exact', head: true }).eq('estatus', 'pendiente_validacion');
      
      const { count: activeG } = await supabase.from('garantias').select('*', { count: 'exact', head: true }).eq('estatus', 'activo');
      const { count: activeD } = await supabase.from('devoluciones').select('*', { count: 'exact', head: true }).eq('estatus', 'activo');

      const { count: closedG } = await supabase.from('garantias').select('*', { count: 'exact', head: true }).eq('estatus', 'cerrado');
      const { count: closedD } = await supabase.from('devoluciones').select('*', { count: 'exact', head: true }).eq('estatus', 'cerrado');

      setStats({
        pendientes: (pendingG || 0) + (pendingD || 0),
        activos: (activeG || 0) + (activeD || 0),
        totalHistorico: (pendingG + pendingD + activeG + activeD + closedG + closedD)
      });

      // 2. Cargar Actividad Reciente (INCLUYENDO PROVEEDORES)
      // Agregamos 'proveedores(nombre)' a la consulta
      const { data: gData } = await supabase
        .from('garantias')
        .select('id, folio, producto_nombre, created_at, estatus, sucursales(nombre), proveedores(nombre)')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: dData } = await supabase
        .from('devoluciones')
        .select('id, folio, producto_nombre, created_at, estatus, sucursales(nombre), proveedores(nombre)')
        .order('created_at', { ascending: false })
        .limit(5);

      const combined = [
        ...(gData || []).map(i => ({ ...i, type: 'garantia' })),
        ...(dData || []).map(i => ({ ...i, type: 'devolucion' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
       .slice(0, 10);

      setRecentActivity(combined);

    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'cerrado') return 'badge-closed';
    if (status === 'pendiente_validacion') return 'badge-pending';
    return 'badge-active';
  };

  if (loading) return <div className="p-8">Cargando tablero...</div>;

  return (
    <div className="container">
      
      {/* Título de Sección */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Resumen Operativo</h2>
        <span className="text-sm" style={{ color: '#64748b' }}>Última actualización: {new Date().toLocaleTimeString()}</span>
      </div>

      {/* --- SECCIÓN 1: KPIs --- */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        
        {/* KPI 1 */}
        <div className="card" style={{ borderLeft: '4px solid var(--status-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-sm" style={{ fontWeight: '600', color: '#b45309' }}>POR VALIDAR</p>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--color-dark-bg)', margin: '5px 0' }}>{stats.pendientes}</h2>
            </div>
            <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '50%' }}>
              <AlertCircle size={24} color="#b45309" />
            </div>
          </div>
          <p className="text-sm">Solicitudes esperando aprobación.</p>
        </div>

        {/* KPI 2 */}
        <div className="card" style={{ borderLeft: '4px solid var(--status-info)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-sm" style={{ fontWeight: '600', color: '#1d4ed8' }}>EN PROCESO</p>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--color-dark-bg)', margin: '5px 0' }}>{stats.activos}</h2>
            </div>
            <div style={{ background: '#dbeafe', padding: '10px', borderRadius: '50%' }}>
              <Clock size={24} color="#1d4ed8" />
            </div>
          </div>
          <p className="text-sm">Casos abiertos en sucursales.</p>
        </div>

        {/* KPI 3 */}
        <div className="card" style={{ borderLeft: '4px solid var(--color-brand-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-sm" style={{ fontWeight: '600', color: 'var(--color-brand-hover)' }}>TOTAL HISTÓRICO</p>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--color-dark-bg)', margin: '5px 0' }}>{stats.totalHistorico}</h2>
            </div>
            <div style={{ background: 'var(--color-brand-light)', padding: '10px', borderRadius: '50%' }}>
              <TrendingUp size={24} color="var(--color-brand-primary)" />
            </div>
          </div>
          <p className="text-sm">Movimientos totales registrados.</p>
        </div>
      </div>

      {/* --- SECCIÓN 2: ACCESOS RÁPIDOS (Horizontal) --- */}
      <div className="card" style={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
          color: 'white', 
          border: 'none', 
          marginBottom: '2rem' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <h3 style={{ color: 'white', margin: 0 }}>Accesos Rápidos</h3>
             <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Selecciona una acción para comenzar</span>
        </div>
        
        {/* Grid de botones lado a lado */}
        <div className="grid-2">
            {/* BOTÓN GARANTÍA (Color Corregido y Leyenda Invertida) */}
            <Link to="/create-warranty" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid #334155', justifyContent: 'space-between', padding: '1.5rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                    <ShieldCheck size={28} color="white" /> {/* Icono blanco */}
                </div>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Nueva Garantía</div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '400' }}>Reingreso por cliente</div> {/* Leyenda Correcta */}
                </div>
            </div>
            <ArrowRight size={24} color="#64748b" />
            </Link>

            {/* BOTÓN DEVOLUCIÓN (Leyenda Invertida) */}
            <Link to="/create-return" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid #334155', justifyContent: 'space-between', padding: '1.5rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                    <Undo2 size={28} color="white" />
                </div>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Nueva Devolución</div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '400' }}>Registrar falla de producto</div> {/* Leyenda Correcta */}
                </div>
            </div>
            <ArrowRight size={24} color="#64748b" />
            </Link>
        </div>
      </div>

      {/* --- SECCIÓN 3: MOVIMIENTOS RECIENTES (Full Width + Proveedor + SCROLL) --- */}
      <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Movimientos Recientes</h3>
            <Link to="/processes" style={{ fontSize: '0.85rem', color: 'var(--color-brand-primary)', textDecoration: 'none', fontWeight: '600' }}>Ver historial completo →</Link>
          </div>

          {recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>No hay actividad reciente.</div>
          ) : (
            // 👇 NUEVO CONTENEDOR CON SCROLL 👇
            <div style={{ 
                maxHeight: '400px', // Altura máxima fija
                overflowY: 'auto',   // Activa el scroll vertical si se pasa
                paddingRight: '5px' // Un poco de espacio para la barra de scroll
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Encabezados de tabla */}
                <div style={{ display: 'grid', gridTemplateColumns: '50px 2fr 1.5fr 1fr 120px', padding: '0 1rem 10px 1rem', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 1 }}>
                    <span>Tipo</span>
                    <span>Folio / Producto</span>
                    <span>Proveedor / Sucursal</span>
                    <span>Fecha</span>
                    <span style={{textAlign: 'right'}}>Estatus</span>
                </div>

                {recentActivity.map((item) => (
                  <div key={`${item.type}-${item.id}`} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '50px 2fr 1.5fr 1fr 120px', 
                      alignItems: 'center', 
                      padding: '1rem',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* 1. Icono */}
                    <div style={{ color: item.type === 'garantia' ? 'var(--color-brand-primary)' : '#0ea5e9' }}>
                       {item.type === 'garantia' ? <ShieldCheck size={20} /> : <Undo2 size={20} />}
                    </div>
                    
                    {/* 2. Folio y Producto */}
                    <div>
                        <div style={{ fontWeight: '600', color: 'var(--color-dark-bg)' }}>{item.folio}</div>
                        <div className="text-sm" style={{ color: '#64748b' }}>{item.producto_nombre}</div>
                    </div>

                    {/* 3. Proveedor y Sucursal */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', fontWeight: '500', color: '#334155' }}>
                            <Truck size={14} color="#94a3b8" />
                            {item.proveedores?.nombre || "N/A"}
                        </div>
                        <div className="text-sm" style={{ color: '#94a3b8', marginLeft: '19px' }}>
                            {item.sucursales?.nombre}
                        </div>
                    </div>

                    {/* 4. Fecha */}
                    <div className="text-sm" style={{ color: '#64748b' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                        <br/>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>

                    {/* 5. Estado */}
                    <div style={{ textAlign: 'right' }}>
                        <span className={`badge ${getStatusColor(item.estatus)}`}>
                          {item.estatus.replace('_', ' ')}
                        </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default Dashboard;