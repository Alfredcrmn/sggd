import StatCard from "../components/dashboard/StatCard";
import ActionButton from "../components/dashboard/ActionButton";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const username = user?.user_metadata?.username || "Usuario";

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. ENCABEZADO DE BIENVENIDA */}
      <div style={{ marginBottom: '2rem' }}>
        <h1>Hola, {username} 👋</h1>
        <p>Bienvenido al Sistema de Gestión de Garantías y Devoluciones.</p>
      </div>

      {/* 2. ACCIONES PRINCIPALES (Lo que más usarán) */}
      <h3 style={{ marginBottom: '1rem' }}>Acciones Rápidas</h3>
      <div className="grid-2" style={{ marginBottom: '3rem' }}>
        <ActionButton 
          to="/create?type=garantia"
          icon="🛡️"
          title="Nueva Garantía"
          description="Registrar recepción de producto por falla o defecto."
        />
        <ActionButton 
          to="/create?type=devolucion"
          icon="↩️"
          title="Nueva Devolución"
          description="Registrar retorno de mercancía al proveedor."
        />
      </div>

      {/* 3. RESUMEN DE ESTADO (KPIs) */}
      <h3 style={{ marginBottom: '1rem' }}>Resumen Operativo</h3>
      <div className="grid-4" style={{ marginBottom: '3rem' }}>
        <StatCard 
          title="Garantías Activas" 
          value="12" 
          icon="🔧" 
          color="#3B82F6" 
        />
        <StatCard 
          title="Devoluciones Activas" 
          value="5" 
          icon="📦" 
          color="#8B5CF6" 
        />
        <StatCard 
          title="Por Validar (Cierres)" 
          value="3" 
          icon="⚠️" 
          color="#F59E0B" 
        />
        <StatCard 
          title="Completados este mes" 
          value="45" 
          icon="✅" 
          color="#10B981" 
        />
      </div>

      {/* 4. LISTA DE ACTIVIDAD RECIENTE (Placeholder) */}
      <h3 style={{ marginBottom: '1rem' }}>Actividad Reciente</h3>
      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: '10px' }}>Folio</th>
              <th style={{ padding: '10px' }}>Tipo</th>
              <th style={{ padding: '10px' }}>Producto</th>
              <th style={{ padding: '10px' }}>Estado</th>
              <th style={{ padding: '10px' }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {/* Fila de ejemplo estática */}
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px', fontWeight: '600' }}>FCG-45</td>
              <td style={{ padding: '12px' }}><span style={{ padding: '4px 8px', borderRadius: '4px', background: '#DBEAFE', color: '#1E40AF', fontSize: '0.8rem' }}>Garantía</span></td>
              <td style={{ padding: '12px' }}>Taladro Percutor 1/2"</td>
              <td style={{ padding: '12px' }}>Enviado a Prov.</td>
              <td style={{ padding: '12px', color: '#64748B' }}>Hoy, 10:30 AM</td>
            </tr>
            {/* Otra fila de ejemplo */}
            <tr>
              <td style={{ padding: '12px', fontWeight: '600' }}>FBD-12</td>
              <td style={{ padding: '12px' }}><span style={{ padding: '4px 8px', borderRadius: '4px', background: '#F3E8FF', color: '#6B21A8', fontSize: '0.8rem' }}>Devolución</span></td>
              <td style={{ padding: '12px' }}>Juego de Llaves Allen</td>
              <td style={{ padding: '12px' }}>Pendiente Entrega</td>
              <td style={{ padding: '12px', color: '#64748B' }}>Ayer, 04:15 PM</td>
            </tr>
          </tbody>
        </table>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <a href="/processes" className="btn btn-secondary text-sm">Ver todo el historial</a>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;