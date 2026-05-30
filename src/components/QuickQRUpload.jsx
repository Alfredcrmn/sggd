import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { QRCodeSVG } from "qrcode.react"; // OJO: Cambié a QRCodeSVG porque es más ligero, pero si tienes QRCodeCanvas está bien.

const QuickQRUpload = ({ sessionId, onUploadComplete, recordId, table }) => {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [token, setToken] = useState(null);
  const [tokenPrefix, setTokenPrefix] = useState(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);
  const [tokenError, setTokenError] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  // Usamos hash para reducir exposición del token en logs/referer.
  // MobileUpload soporta hash y query para compatibilidad.
  const mobileUrl = `${window.location.origin}/mobile-upload/${sessionId}${token ? `#token=${encodeURIComponent(token)}&prefix=${encodeURIComponent(tokenPrefix || '')}${tokenExpiresAt ? `&expires_at=${encodeURIComponent(tokenExpiresAt)}` : ''}` : ''}`;

  const generateToken = useCallback(async () => {
    if (!recordId || !table) return;
    setTokenLoading(true);
    setTokenError(null);

    try {
      const { data, error } = await supabase.rpc('generate_evidencia_upload_token', {
        p_table: table,
        p_record_id: String(recordId),
        p_session_id: sessionId,
        p_ttl_seconds: 900
      });

      if (error) throw error;

      const payload = Array.isArray(data) ? data[0] : data;
      setToken(payload?.token || payload?.token?.token || null);
      setTokenPrefix(payload?.object_prefix || payload?.objectPrefix || payload?.object_prefix?.object_prefix || null);
      setTokenExpiresAt(payload?.expires_at || payload?.expiresAt || payload?.expires_at?.expires_at || null);
    } catch (error) {
      console.error(error);
      const detail = error?.message ? ` Detalle: ${error.message}` : "";
      setTokenError(`No se pudo generar el token de carga.${detail}`);
      setToken(null);
      setTokenPrefix(null);
      setTokenExpiresAt(null);
    } finally {
      setTokenLoading(false);
    }
  }, [recordId, sessionId, table]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void generateToken();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [generateToken]);

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
          {token ? (
            <>
              <div style={{ background: 'white', padding: '10px', display: 'inline-block', borderRadius: '8px' }}>
                 <QRCodeSVG value={mobileUrl} size={140} />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>
                Escanea para subir foto.
              </p>
            </>
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Generando QR seguro...</div>
          )}
          {tokenLoading && <div style={{ marginTop: '6px', color: '#64748b', fontSize: '0.75rem' }}>Preparando enlace...</div>}
          {tokenError && (
            <div style={{ marginTop: '8px', color: '#b91c1c', fontSize: '0.8rem' }}>
              {tokenError}
              <div style={{ marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={generateToken}
                  style={{ background: 'none', border: 'none', color: '#0369a1', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="animate-fade-in">
          <img 
            src={photoUrl} 
            alt="Evidencia" 
            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '2px solid #22c55e' }} 
          />
          <div style={{ marginTop: '10px', color: '#166534', fontWeight: 'bold' }}>
            ¡Foto recibida!
          </div>
          <button 
            type="button"
            onClick={async () => {
              setPhotoUrl(null);
              await generateToken();
            }}
            style={{ background: 'none', border: 'none', color: '#ef4444', textDecoration: 'underline', cursor: 'pointer', marginTop: '5px', fontSize: '0.85rem' }}>
            Tomar otra
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickQRUpload;
