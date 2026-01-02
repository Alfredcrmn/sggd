import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

// Importamos las páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
// Asegúrate de tener estos archivos creados (aunque sea con contenido básico)
// Si alguno no existe, coméntalo temporalmente para que no de error.
import CreateWarranty from "./pages/CreateWarranty";
import CreateReturn from "./pages/CreateReturn";
import ProcessList from "./pages/ProcessList";
import ProcessDetail from "./pages/ProcessDetail";
import AdminPanel from "./pages/AdminPanel";
import MobileUpload from "./pages/MobileUpload";

// Componente para proteger rutas (si no hay usuario, manda al Login)
const RutaPrivada = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div style={{display:'flex', justifyContent:'center', marginTop:'50px'}}>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  
  // Si está logueado, renderiza el Layout (que contiene el Outlet con la página)
  return <Layout />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta Pública: Login */}
          <Route path="/login" element={<Login />} />

          {/* Rutas Privadas: Todas viven dentro del Layout */}
          <Route element={<RutaPrivada />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-warranty" element={<CreateWarranty />} />
            <Route path="/create-return" element={<CreateReturn />} />
            <Route path="/processes" element={<ProcessList />} />
            <Route path="/process/:id" element={<ProcessDetail />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/mobile-upload/:id" element={<MobileUpload />} />
          </Route>

          {/* Cualquier ruta desconocida te manda al inicio */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;