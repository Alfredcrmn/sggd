import { useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  // Cambiamos 'email' por 'username' para que solo escriban el nombre
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("Autenticando...");

    // Construimos el email completo internamente
    const finalEmail = `${username.trim()}@ferretodo.local`;

    try {
      // 1. Login básico con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password,
      });

      if (authError) throw new Error("Credenciales incorrectas.");

      // 2. Obtener Perfil y Coordenadas de la Sucursal
      setStatusMsg("Verificando acceso...");
      const user = authData.user;

      const { data: perfil, error: profileError } = await supabase
        .from('perfiles')
        .select(`
            rol, 
            sucursales (
                id, latitud, longitud, radio_permitido_metros
            )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) throw new Error("Error de perfil.");

      // === VALIDACIONES DE ACCESO ===
      
      // CASO A: ADMIN -> Pasa directo
      if (perfil.rol === 'admin') {
          navigate("/");
          return;
      }

      // CASO B: CAJERO -> Verificamos GPS
      if (!perfil.sucursales) {
          throw new Error("Sin sucursal asignada.");
      }

      // Si la sucursal no tiene coordenadas, dejamos pasar (falla administrativa, no del usuario)
      if (!perfil.sucursales.latitud || !perfil.sucursales.longitud) {
          navigate("/");
          return;
      }

      // Pedimos ubicación al navegador
      navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            // Calculamos distancia
            const distancia = getDistanceFromLatLonInMeters(
                userLat, userLng, 
                perfil.sucursales.latitud, perfil.sucursales.longitud
            );

            const limite = perfil.sucursales.radio_permitido_metros || 20;

            // Log para ver la distancia del usuario
            console.log(`Distancia: ${Math.round(distancia)}m (Límite: ${limite}m)`);

            if (distancia <= limite) {
                // DENTRO DEL RANGO -> ACCESO CONCEDIDO
                navigate("/");
            } else {
                // FUERA DEL RANGO -> BLOQUEO SILENCIOSO
                supabase.auth.signOut(); 
                // Mensaje genérico para no dar pistas
                alert("Error al iniciar sesión.");
                setLoading(false);
                setStatusMsg("");
            }
        },
        (geoError) => {
            // Si niegan el permiso o falla el GPS
            console.error(geoError);
            supabase.auth.signOut();
            // Mensaje genérico
            alert("Error al iniciar sesión.");
            setLoading(false);
            setStatusMsg("");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

    } catch (error) {
      console.error(error);
      // Mensaje genérico para cualquier error (password, usuario no existe, etc)
      alert("Credenciales incorrectas o error de conexión.");
      setLoading(false);
      setStatusMsg("");
    }
  };

  // Función matemática (Haversine)
  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }

  const deg2rad = (deg) => deg * (Math.PI/180);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
      <div className="card" style={{ width: '400px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', color: '#1e293b' }}>Ferretodo<span style={{color:'#ea580c'}}>.</span></h1>
            <p className="text-sm">Sistema de Garantías</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <label className="form-label">Usuario</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={18} style={{ position:'absolute', left:'10px', color:'#94a3b8', zIndex: 1 }}/>
                    <input 
                        type="text" 
                        className="form-input" 
                        style={{ paddingLeft: '2.2rem', paddingRight: '120px' }} // Espacio para el sufijo
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        placeholder="ej. juan.perez"
                        required 
                    />
                    {/* Sufijo visual para que el usuario sepa que no debe escribir el dominio */}
                    <span style={{ 
                        position: 'absolute', 
                        right: '10px', 
                        color: '#94a3b8', 
                        fontSize: '0.85rem',
                        userSelect: 'none',
                        pointerEvents: 'none'
                    }}>
                        @ferretodo.local
                    </span>
                </div>
            </div>
            <div>
                <label className="form-label">Contraseña</label>
                <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position:'absolute', top:'12px', left:'10px', color:'#94a3b8' }}/>
                    <input 
                        type="password" 
                        className="form-input" 
                        style={{ paddingLeft: '2.2rem' }} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                    />
                </div>
            </div>

            <button disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '10px' }}>
                {loading ? statusMsg : "Iniciar Sesión"}
            </button>
        </form>
      </div>
    </div>
  );
};

export default Login;