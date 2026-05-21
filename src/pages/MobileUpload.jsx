import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase/client";
import { Camera, CheckCircle, Loader2 } from "lucide-react";

const getLinkValidationError = (sessionId, uploadToken, objectPrefix, expiresAt) => {
  if (!uploadToken || !objectPrefix) {
    return "El enlace de carga no es valido o expiro. Solicita un QR nuevo.";
  }

  if (!/^[a-f0-9]{64}$/i.test(uploadToken)) {
    return "El enlace de carga no es valido o expiro. Solicita un QR nuevo.";
  }

  const prefixMatch = objectPrefix.match(/^(garantias|devoluciones)\/([^/]+)\/([^/]+)\/$/);
  if (!prefixMatch) {
    return "El enlace de carga no es valido o expiro. Solicita un QR nuevo.";
  }

  const prefixSessionId = prefixMatch[3];
  if (prefixSessionId !== sessionId) {
    return "El enlace de carga no coincide con esta sesion. Solicita un QR nuevo.";
  }

  if (expiresAt) {
    const expiresAtMs = Date.parse(expiresAt);
    if (Number.isNaN(expiresAtMs)) {
      return "El enlace de carga no es valido o expiro. Solicita un QR nuevo.";
    }

    if (Date.now() >= expiresAtMs) {
      return "El enlace de carga expiro. Solicita un QR nuevo.";
    }
  }

  return null;
};

const MobileUpload = () => {
  const { id } = useParams(); // Este es el sessionId temporal
  const [searchParams] = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Compatibilidad: primero hash (#token=...), luego query (?token=...)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const uploadToken = hashParams.get('token') || searchParams.get('token');
  const objectPrefix = hashParams.get('prefix') || searchParams.get('prefix');
  const expiresAt = hashParams.get('expires_at') || searchParams.get('expires_at');
  const linkValidationError = getLinkValidationError(id, uploadToken, objectPrefix, expiresAt);
  const isLinkReady = !linkValidationError;
  const activeErrorMessage = errorMessage || linkValidationError;

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (!isLinkReady) {
      setErrorMessage(activeErrorMessage || "Validando enlace de carga...");
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    const file = e.target.files[0];

    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
    if (!file.type.startsWith('image/')) {
      setUploading(false);
      setErrorMessage("Solo se permiten archivos de imagen.");
      return;
    }

    if (file.size > maxSizeBytes) {
      setUploading(false);
      setErrorMessage("La imagen excede 10 MB. Toma una foto con menor resolución.");
      return;
    }

    const fileExt = file.name.split('.').pop();
    const safeExt = fileExt || 'jpg';
    const fileName = `${objectPrefix}temp_${id}_${Date.now()}.${safeExt}`;

    try {
      // 1. SUBIR FOTO (Sin restricciones de Auth)
      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(fileName, file, {
          metadata: { upload_token: uploadToken }
        });

      if (uploadError) throw uploadError;

      // 2. OBTENER URL
      const { data } = supabase.storage.from('evidencias').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      // 3. AVISAR AL ESCRITORIO (Realtime)
      const channel = supabase.channel(`room-${id}`);
      
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.send({
                type: 'broadcast',
                event: 'upload-complete',
                payload: { url: publicUrl }
            });
            
            // Limpieza y éxito
            supabase.removeChannel(channel);
            setCompleted(true);
        }
      });

    } catch (error) {
      console.error(error);
      setErrorMessage("Error al subir imagen: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (completed) {
    return (
        <div style={{ height:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', background:'#f0fdf4', color:'#15803d', gap:'1rem', textAlign:'center', padding:'1rem' }}>
            <CheckCircle size={80} />
            <h1 style={{fontSize:'2rem', margin:0}}>¡Listo!</h1>
            <p>La foto apareció en tu pantalla.</p>
            <p style={{fontSize:'0.9rem', color:'#166534'}}>Ya puedes cerrar esta ventana.</p>
        </div>
    );
  }

  return (
    <div style={{ padding: '2rem', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#1e293b' }}>
      <h2 style={{ color: 'white', marginBottom: '2rem', textAlign:'center' }}>Subir Evidencia</h2>
      
      <label style={{ 
          width: '100%', maxWidth: '300px', height: '250px', 
          border: '3px dashed #475569', borderRadius: '16px', 
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
          color: 'white', cursor: isLinkReady ? 'pointer' : 'not-allowed', background: 'rgba(255,255,255,0.05)',
          transition: 'background 0.2s'
      }}>
        {uploading ? (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'10px'}}>
                <Loader2 size={48} className="animate-spin" color="#3b82f6"/> 
                <p>Enviando...</p>
            </div>
        ) : (
            <>
                <Camera size={64} style={{ marginBottom: '15px', color:'#cbd5e1' }} />
                <span style={{fontWeight:'bold', fontSize:'1.1rem'}}>
                  {activeErrorMessage ? 'Enlace no disponible' : 'Tocar para foto'}
                </span>
                <span style={{fontSize:'0.8rem', color:'#94a3b8', marginTop:'5px'}}>
                  {activeErrorMessage ? 'Solicita un QR o enlace nuevo' : 'Se abrirá la cámara'}
                </span>
                
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" // Fuerza cámara trasera
                    onChange={handleFileChange} 
                    disabled={!isLinkReady}
                    style={{ display: 'none' }} 
                />
            </>
        )}
      </label>
      {activeErrorMessage && (
        <div style={{ marginTop: '1.5rem', color: '#fecaca', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '10px 14px', borderRadius: '8px', textAlign: 'center', maxWidth: '320px' }}>
          {activeErrorMessage}
        </div>
      )}
    </div>
  );
};

export default MobileUpload;
