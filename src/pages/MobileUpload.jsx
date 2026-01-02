import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase/client";

const MobileUpload = () => {
  const { id } = useParams(); // Este ID es el ID del proceso (Garantía)
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    // Nombre único: proceso-ID-timestamp.jpg
    const fileName = `proceso-${id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      // 1. SUBIR LA FOTO AL BUCKET
      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. OBTENER LA URL PÚBLICA
      const { data } = supabase.storage.from('evidencias').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // 3. AVISAR AL DESKTOP (REALTIME MAGIC ✨)
      // Enviamos un mensaje al canal específico de este proceso
      const channel = supabase.channel(`room-${id}`);
      
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.send({
                type: 'broadcast',
                event: 'upload-complete',
                payload: { url: publicUrl }
            });
            // Nos desconectamos y mostramos éxito
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

  if (completed) {
    return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h1 style={{ fontSize: '3rem' }}>✅</h1>
            <h2>¡Listo!</h2>
            <p>La foto se ha enviado a la computadora.</p>
            <p>Ya puedes cerrar esta ventana.</p>
        </div>
    );
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', height: '100vh' }}>
      <h2 style={{ marginBottom: '2rem' }}>Subir Evidencia</h2>
      <p style={{ marginBottom: '2rem', color: '#64748b' }}>Toma una foto de la firma o del producto entregado.</p>
      
      <label style={{ 
          display: 'block', padding: '20px', backgroundColor: '#3b82f6', color: 'white', 
          borderRadius: '12px', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer' 
      }}>
          📸 Tomar Foto
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" // Esto fuerza a abrir la cámara trasera en móviles
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            disabled={uploading}
          />
      </label>

      {uploading && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>Subiendo imagen...</p>}
    </div>
  );
};

export default MobileUpload;