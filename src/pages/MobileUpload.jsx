import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Agregamos useNavigate
import { supabase } from "../supabase/client";
import { Loader2, MapPin, XCircle, Camera } from "lucide-react"; // Iconos para feedback visual

const MobileUpload = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  // Estados de carga y flujo
  const [verifying, setVerifying] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    checkLocationAccess();
  }, []);

  // --- LÓGICA DE SEGURIDAD (Copiada y adaptada del Login) ---
  const checkLocationAccess = async () => {
    try {
        // 1. Verificar si hay usuario logueado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // Si no hay sesión, guardar a donde quería ir y mandar a login
            // (El Login ya tiene su propio check de GPS)
            localStorage.setItem('redirectAfterLogin', `/mobile-upload/${id}`);
            navigate("/login");
            return;
        }

        // 2. Obtener coordenadas de la sucursal del usuario
        const { data: perfil, error } = await supabase
            .from('perfiles')
            .select('rol, sucursales(latitud, longitud, radio_permitido_metros)')
            .eq('id', user.id)
            .single();

        if (error || !perfil.sucursales) throw new Error("Error obteniendo datos de sucursal.");

        // Si es admin, pase VIP
        if (perfil.rol === 'admin') {
            setAccessGranted(true);
            setVerifying(false);
            return;
        }

        // Si la sucursal no tiene coordenadas configuradas, dejamos pasar (fallback)
        if (!perfil.sucursales.latitud || !perfil.sucursales.longitud) {
             setAccessGranted(true);
             setVerifying(false);
             return;
        }

        // 3. Verificar GPS del dispositivo actual
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const dist = getDistanceFromLatLonInMeters(
                    position.coords.latitude, position.coords.longitude,
                    perfil.sucursales.latitud, perfil.sucursales.longitud
                );
                
                const limite = perfil.sucursales.radio_permitido_metros || 20;
                console.log(`Distancia: ${Math.round(dist)}m | Límite: ${limite}m`);

                if (dist <= limite) {
                    setAccessGranted(true);
                } else {
                    setErrorMsg("Estás fuera de la sucursal. Acércate para subir evidencia.");
                }
                setVerifying(false);
            },
            (err) => {
                console.error(err);
                setErrorMsg("Es necesario permitir la ubicación para subir evidencia.");
                setVerifying(false);
            },
            { enableHighAccuracy: true }
        );

    } catch (error) {
        console.error(error);
        setErrorMsg("Error de validación.");
        setVerifying(false);
    }
  };

  // Función matemática de distancia
  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * (Math.PI/180);
    const dLon = (lon2 - lon1) * (Math.PI/180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  };

  // --- LÓGICA DE SUBIDA (Tu código original) ---
  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `proceso-${id}-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(fileName, file); // Quitamos la carpeta para simplificar, o ajusta según tu bucket

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('evidencias').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      const channel = supabase.channel(`room-${id}`);
      
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.send({
                type: 'broadcast',
                event: 'upload-complete',
                payload: { url: publicUrl }
            });
            supabase.removeChannel(channel);
            setCompleted(true);
        }
      });

    } catch (error) {
      alert("Error subiendo foto: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- RENDERIZADO CONDICIONAL ---

  if (verifying) {
      return (
          <div style={{ height:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', background:'#f8fafc', gap:'1rem' }}>
              <Loader2 className="animate-spin" size={48} color="#3b82f6"/>
              <p style={{color:'#64748b'}}>Verificando ubicación...</p>
          </div>
      );
  }

  if (errorMsg) {
      return (
          <div style={{ height:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', background:'#fef2f2', padding:'2rem', textAlign:'center' }}>
              <XCircle size={64} color="#ef4444" style={{marginBottom:'1rem'}}/>
              <h2 style={{color:'#991b1b'}}>Acceso Denegado</h2>
              <p style={{color:'#b91c1c'}}>{errorMsg}</p>
              <button onClick={() => window.location.reload()} style={{marginTop:'20px', padding:'10px 20px', border:'none', background:'#ef4444', color:'white', borderRadius:'8px'}}>Reintentar</button>
          </div>
      );
  }

  if (completed) {
    return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', height:'100vh', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <h1 style={{ fontSize: '3rem' }}>✅</h1>
            <h2>¡Listo!</h2>
            <p>La foto se ha enviado a la computadora.</p>
            <p style={{color:'#64748b', fontSize:'0.9rem'}}>Ya puedes cerrar esta ventana.</p>
        </div>
    );
  }

  // SI PASA TODAS LAS VALIDACIONES:
  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#1e293b', height: '100vh', display:'flex', flexDirection:'column', justifyContent:'center' }}>
      <h2 style={{ marginBottom: '1rem', color:'white' }}>Subir Evidencia</h2>
      <div style={{ marginBottom: '2rem', color: '#94a3b8', display:'flex', justifyContent:'center', alignItems:'center', gap:'6px', fontSize:'0.9rem' }}>
          <MapPin size={16}/> Ubicación verificada
      </div>
      
      <label style={{ 
          display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'10px',
          padding: '40px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', 
          borderRadius: '16px', border:'2px dashed #475569', cursor: 'pointer' 
      }}>
          {uploading ? (
             <><Loader2 className="animate-spin" size={32}/> Subiendo...</>
          ) : (
             <><Camera size={48} /> <span>Tocar para tomar foto</span></>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            disabled={uploading}
          />
      </label>
    </div>
  );
};

export default MobileUpload;