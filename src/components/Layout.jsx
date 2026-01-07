import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase/client";
// 1. Importamos los íconos profesionales
import { LayoutDashboard, ShieldCheck, Undo2, FileText, Settings, LogOut, UserCircle } from "lucide-react";
import "./Layout.css"; 

const Layout = () => {
  const { user } = useAuth();
  const username = user?.user_metadata?.username || "Usuario";

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="layout-container">
      {/* SIDEBAR OSCURO */}
      <aside className="sidebar">
        <div className="brand-area">
          {/* El punto naranja usa tu variable CSS */}
          <h1 className="brand-title">FERRETODO<span className="text-orange">.</span></h1>
          <p className="brand-subtitle">Gestión de Garantías</p>
        </div>
        
        <nav className="nav-links">
          {/* Dashboard */}
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          
          {/* Separador - Grupo "Registrar" */}
          <div className="nav-group-label">
            Registrar
          </div>

          {/* Garantía */}
          <NavLink to="/create-warranty" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <ShieldCheck size={20} />
            <span>Garantía</span>
          </NavLink>
          
          {/* Devolución */}
          <NavLink to="/create-return" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <Undo2 size={20} />
            <span>Devolución</span>
          </NavLink>
          
          <div className="nav-divider"></div>

          {/* Historial */}
          <NavLink to="/processes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <FileText size={20} />
            <span>Historial</span>
          </NavLink>

          {/* Admin */}
          <NavLink to="/admin" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <Settings size={20} />
            <span>Admin</span>
          </NavLink>
        </nav>

        {/* Footer del Sidebar */}
        <div className="sidebar-footer">
          <div className="user-info">
            <UserCircle size={32} className="user-avatar" />
            <div className="user-text">
                <small>Hola,</small>
                <strong>{username}</strong>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} />
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