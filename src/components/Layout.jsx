import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase/client";
import "./Layout.css"; // Asegúrate de haber creado este archivo CSS también

const Layout = () => {
  const { user } = useAuth();
  
  // Extraemos el nombre de usuario o usamos "Usuario" por defecto
  const username = user?.user_metadata?.username || "Usuario";

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="layout-container">
      {/* SIDEBAR OSCURO */}
      <aside className="sidebar">
        <div className="brand-area">
          <h1 className="brand-title">FERRETODO <span style={{color: 'var(--color-brand-primary)'}}>.</span></h1>
          <p className="brand-subtitle">Gestión de Garantías</p>
        </div>
        
        <nav className="nav-links">
          {/* NavLink añade la clase "active" automáticamente */}
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>
          
          <NavLink to="/create" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">➕</span> Nuevo Proceso
          </NavLink>
          
          <NavLink to="/processes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">🔎</span> Historial
          </NavLink>
          
          <div style={{ height: '1px', background: '#333', margin: '10px 0' }}></div>

          <NavLink to="/admin" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon">🛡️</span> Admin
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <small>Logueado como:</small><br/>
            <strong>{username}</strong>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;