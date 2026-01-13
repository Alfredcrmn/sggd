import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase/client";
import { Camera, UploadCloud, CheckCircle, Loader2 } from "lucide-react";

const MobileUpload = () => {
  const { id } = useParams(); // Este es el sessionId temporal
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    // Usamos el ID de la sesión para el nombre del archivo
    const fileName = `temp_${id}_${Date.now()}.${fileExt}`;

    try {
      // 1. SUBIR FOTO (Sin restricciones de Auth)
      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(fileName, file);

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
      alert("Error al subir imagen: " + error.message);
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
          color: 'white', cursor: 'pointer', background: 'rgba(255,255,255,0.05)',
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
                <span style={{fontWeight:'bold', fontSize:'1.1rem'}}>Tocar para foto</span>
                <span style={{fontSize:'0.8rem', color:'#94a3b8', marginTop:'5px'}}>Se abrirá la cámara</span>
                
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" // Fuerza cámara trasera
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                />
            </>
        )}
      </label>
    </div>
  );
};

export default MobileUpload;