import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase/client";
import { LayoutDashboard, ShieldCheck, Undo2, FileText, Settings, LogOut, UserCircle } from "lucide-react";
import "./Layout.css"; 

const Layout = () => {
  const { user } = useAuth();
  
  // 1. Estados para Rol y Nombre
  const [isAdmin, setIsAdmin] = useState(false);
  // Intentamos leer el nombre de los metadatos primero (rápido), si no, esperamos a la BD
  const [displayName, setDisplayName] = useState(user?.user_metadata?.nombre_completo || "Usuario");

  // 2. Efecto para consultar datos del perfil (Rol y Nombre real)
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('perfiles')
          .select('rol, nombre_completo') // <--- AQUI TRAEMOS EL NOMBRE TAMBIÉN
          .eq('id', user.id)
          .single();
        
        if (data) {
          // Lógica de Admin
          setIsAdmin(data.rol === 'admin');

          // Lógica de Nombre (Prioridad a la base de datos)
          if (data.nombre_completo) {
            setDisplayName(data.nombre_completo);
          }
        }
      } catch (error) {
        console.error("Error verificando perfil en Layout:", error);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="layout-container">
      {/* SIDEBAR OSCURO */}
      <aside className="sidebar">
        <div className="brand-area">
          <h1 className="brand-title">FERRETODO<span className="text-orange">.</span></h1>
          <p className="brand-subtitle">Gestión de Garantías</p>
        </div>
        
        <nav className="nav-links">
          {/* Dashboard */}
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          
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

          {/* Solo mostramos Admin si isAdmin es true */}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <Settings size={20} />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>

        {/* Footer del Sidebar */}
        <div className="sidebar-footer">
          <div className="user-info">
            <UserCircle size={32} className="user-avatar" />
            <div className="user-text">
                <small>Hola,</small>
                {/* CAMBIO AQUÍ: Usamos displayName en lugar de username */}
                <strong style={{ textTransform: 'capitalize' }}>{displayName}</strong>
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