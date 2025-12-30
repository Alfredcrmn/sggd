import { useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // LÓGICA DE NEGOCIO:
    // Convertimos el usuario simple (ej: "cajero1") en el email falso para Supabase.
    const emailFalso = `${username}@ferretodo.local`;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailFalso,
        password: password,
      });

      if (error) throw error;
      
      // Si el login es exitoso, redirigimos al Dashboard
      navigate("/");
      
    } catch (error) {
      // Mensaje amigable para el usuario
      setError("Usuario o contraseña incorrectos. Intenta de nuevo.");
      console.error("Error de login:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Estilos locales para esta página (Layout centrado)
  const pageStyle = {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-canvas-bg)', // Gris pizarra claro
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={pageStyle}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        
        {/* Encabezado del Login */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--color-dark-bg)', fontSize: '1.8rem' }}>
            FERRETODO <span style={{ color: 'var(--color-brand-primary)' }}>.</span>
          </h1>
          <p className="text-sm">Sistema de Gestión de Garantías</p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div style={{ 
            backgroundColor: '#FEF2F2', 
            color: 'var(--status-error)', 
            padding: '10px', 
            borderRadius: '6px', 
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            textAlign: 'center',
            border: '1px solid #FECACA'
          }}>
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
              Usuario
            </label>
            <input
              type="text"
              placeholder="Ej: admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              required
              autoFocus // Pone el cursor aquí al abrir la página
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? "Entrando..." : "Iniciar Sesión"}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          ¿Olvidaste tu contraseña? <br/> Contacta al Administrador.
        </div>
      </div>
    </div>
  );
};

export default Login;