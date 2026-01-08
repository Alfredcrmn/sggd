import { useState } from "react";
import { ImageIcon, Maximize2, X } from "lucide-react";

const EvidenceCard = ({ url }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={18} /> Evidencia
          </h3>
          
          {url ? (
              <button 
                  onClick={() => setShowModal(true)}
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', border: '1px solid #cbd5e1' }}
              >
                  <Maximize2 size={18} /> Ver Evidencia Completa
              </button>
          ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '6px', fontSize: '0.9rem' }}>
                  Sin evidencia adjunta
              </div>
          )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.9)', zIndex: 9999, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }} onClick={() => setShowModal(false)}>
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={() => setShowModal(false)}
                    style={{ 
                        position: 'absolute', top: '-50px', right: 0, 
                        background: 'white', border: 'none', color: 'black', cursor: 'pointer',
                        borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <X size={24} />
                </button>
                <img src={url} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px' }} />
            </div>
        </div>
      )}
    </>
  );
};

export default EvidenceCard;