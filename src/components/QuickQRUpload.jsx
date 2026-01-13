import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { QRCodeSVG } from "qrcode.react"; // OJO: Cambié a QRCodeSVG porque es más ligero, pero si tienes QRCodeCanvas está bien.

const QuickQRUpload = ({ sessionId, onUploadComplete }) => {
  const [photoUrl, setPhotoUrl] = useState(null);

  // MEJORA: Usamos window.location.origin para que funcione en Localhost y Vercel automáticamente
  const mobileUrl = `${window.location.origin}/mobile-upload/${sessionId}`;

  useEffect(() => {
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
      <label className="form-label" style={{ marginBottom: '1rem', color: '#0369a1', fontSize: '1rem', display:'block' }}>
        📸 Evidencia de Recepción
      </label>

      {!photoUrl ? (
        <>
          <div style={{ background: 'white', padding: '10px', display: 'inline-block', borderRadius: '8px' }}>
             <QRCodeSVG value={mobileUrl} size={140} />
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>
            Escanea para subir foto.
          </p>
        </>
      ) : (
        <div className="animate-fade-in">
          <img 
            src={photoUrl} 
            alt="Evidencia" 
            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '2px solid #22c55e' }} 
          />
          <div style={{ marginTop: '10px', color: '#166534', fontWeight: 'bold' }}>
            ✅ ¡Foto recibida!
          </div>
          <button 
            type="button"
            onClick={() => setPhotoUrl(null)}
            style={{ background: 'none', border: 'none', color: '#ef4444', textDecoration: 'underline', cursor: 'pointer', marginTop: '5px', fontSize: '0.85rem' }}>
            Tomar otra
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickQRUpload;