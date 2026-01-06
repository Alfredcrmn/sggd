import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { QRCodeCanvas } from "qrcode.react";

const QuickQRUpload = ({ sessionId, onUploadComplete }) => {
  const [photoUrl, setPhotoUrl] = useState(null);

  // Construimos la URL para el móvil
  const mobileUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/mobile-upload/${sessionId}`;

  useEffect(() => {
    // Suscribirse al canal temporal de esta sesión
    const channel = supabase.channel(`room-${sessionId}`)
      .on('broadcast', { event: 'upload-complete' }, (payload) => {
        console.log("Foto recibida:", payload);
        setPhotoUrl(payload.payload.url);
        if (onUploadComplete) onUploadComplete(payload.payload.url);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, onUploadComplete]);

  return (
    <div className="form-group" style={{ textAlign: 'center', background: '#f0f9ff', padding: '1.5rem', borderRadius: '12px', border: '2px dashed #3b82f6' }}>
      <label className="form-label" style={{ marginBottom: '1rem', color: '#0369a1', fontSize: '1rem' }}>
        📸 Evidencia de Recepción (Escanea)
      </label>

      {!photoUrl ? (
        <>
          <div style={{ background: 'white', padding: '10px', display: 'inline-block', borderRadius: '8px' }}>
             {/* Usamos QRCodeCanvas en lugar de QRCode */}
             <QRCodeCanvas value={mobileUrl} size={140} />
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>
            Escanea con tu celular para subir la foto.<br/>
            <a href={mobileUrl} target="_blank" rel="noreferrer" style={{color:'#94a3b8'}}>Link manual (Pruebas)</a>
          </p>
        </>
      ) : (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <img 
            src={photoUrl} 
            alt="Evidencia" 
            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '2px solid #22c55e' }} 
          />
          <div style={{ marginTop: '10px', color: '#166534', fontWeight: 'bold' }}>
            ✅ ¡Foto vinculada!
          </div>
          <button 
            type="button"
            onClick={() => setPhotoUrl(null)}
            style={{ background: 'none', border: 'none', color: '#ef4444', textDecoration: 'underline', cursor: 'pointer', marginTop: '5px', fontSize: '0.85rem' }}>
            Cambiar foto
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickQRUpload;