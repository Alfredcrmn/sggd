import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthContext";
import ActionButton from "../components/dashboard/ActionButton"; // Asegúrate de que la ruta sea correcta
import StatCard from "../components/dashboard/StatCard"; // Si tienes un componente para las tarjetas, úsalo, si no, usa el div directo.

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    garantias: 0,
    devoluciones: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Contar Garantías Activas (todo lo que no esté 'cerrado')
        const { count: countGarantias } = await supabase
          .from('garantias')
          .select('*', { count: 'exact', head: true })
          .neq('estatus', 'cerrado'); // neq = Not Equal (No igual a cerrado)

        // 2. Contar Devoluciones Activas
        const { count: countDevoluciones } = await supabase
          .from('devoluciones')
          .select('*', { count: 'exact', head: true })
          .neq('estatus', 'cerrado');

        setStats({
          garantias: countGarantias || 0,
          devoluciones: countDevoluciones || 0,
          total: (countGarantias || 0) + (countDevoluciones || 0)
        });

      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--color-text-main)' }}>
          Panel de Control
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Bienvenido, {user?.user_metadata?.username || "Usuario"}
        </p>
      </header>

      {/* SECCIÓN DE TARJETAS DE ESTADÍSTICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Tarjeta 1: Total Activos */}
        <div style={cardStyle}>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '600' }}>
            PROCESOS ACTIVOS
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-brand-primary)' }}>
            {loading ? "..." : stats.total}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Pendientes de solución
          </div>
        </div>

        {/* Tarjeta 2: Garantías */}
        <div style={cardStyle}>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '600' }}>
            GARANTÍAS
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-text-main)' }}>
            {loading ? "..." : stats.garantias}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            En taller o proveedor
          </div>
        </div>

        {/* Tarjeta 3: Devoluciones */}
        <div style={cardStyle}>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '600' }}>
            DEVOLUCIONES
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-text-main)' }}>
            {loading ? "..." : stats.devoluciones}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Por validar o abonar
          </div>
        </div>
      </div>

      {/* SECCIÓN DE ACCIONES RÁPIDAS */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>
        Acciones Rápidas
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        <ActionButton 
          to="/create-warranty" 
          icon="🛡️" 
          title="Nueva Garantía" 
          description="Registrar equipo fallado" 
        />

        <ActionButton 
          to="/create-return" 
          icon="↩️" 
          title="Nueva Devolución" 
          description="Retorno de mercancía" 
        />

        <ActionButton 
          to="/processes" 
          icon="🔎" 
          title="Buscar Folio" 
          description="Ver historial completo" 
        />

      </div>
    </div>
  );
};

// Estilos rápidos en línea (puedes moverlos a CSS si prefieres)
const cardStyle = {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid var(--color-border)',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

export default Dashboard;