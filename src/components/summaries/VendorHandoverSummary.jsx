import React from "react";
import { Truck, Hash, User, Phone, Calendar } from "lucide-react";

const VendorHandoverSummary = ({ data }) => {
  if (!data) return null;

  // Función robusta para formatear fecha (DD/MM/AAAA)
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const cleanDate = dateString.substring(0, 10);
    const [year, month, day] = cleanDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // --- ESTILOS ESTÁNDAR (Coincidentes con el resto del historial) ---
  // Usamos una paleta NARANJA para esta etapa
  const mainColor = '#f97316'; // Naranja vibrante para el título e iconos
  const innerBg = '#fff7ed';   // Fondo naranja muy claro para la caja interna
  const innerBorder = '#fed7aa'; // Borde naranja sutil

  // Estilos de tipografía estándar
  const detailLabelStyle = { fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' };
  const detailValueStyle = { fontSize: '0.95rem', color: '#1e293b', fontWeight: '500' };

  return (
    <div style={{ marginBottom: '2rem' }}>
      
      {/* 1. ENCABEZADO ESTÁNDAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: mainColor }}>
        <Truck size={18} /> <strong style={{ fontSize: '0.95rem' }}>Datos de Recolección</strong>
      </div>

      {/* 2. CAJA INTERNA ESTÁNDAR */}
      <div style={{ background: innerBg, padding: '15px', borderRadius: '8px', border: `1px solid ${innerBorder}` }}>
        
        {/* Sección Principal: Folio */}
        <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: `1px solid ${innerBorder}` }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Hash size={14} color={mainColor} style={{ opacity: 0.7 }} />
                <span style={detailLabelStyle}>Folio / Ticket Proveedor</span>
            </div>
            {/* Destacamos el folio un poco más */}
            <div style={{ ...detailValueStyle, fontSize: '1.1rem', fontWeight: 'bold' }}>
                {data.folio_recoleccion_proveedor || "---"}
            </div>
        </div>

        {/* Grid de Detalles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            
            {/* Vendedor */}
            <div>
                <div style={detailLabelStyle}>Vendedor</div>
                <div style={{ ...detailValueStyle, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={14} color={mainColor} style={{ opacity: 0.7 }} />
                    {data.vendedor_nombre || "No registrado"}
                </div>
            </div>

            {/* Contacto */}
            <div>
                 <div style={detailLabelStyle}>Contacto</div>
                 <div style={{ ...detailValueStyle, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Phone size={14} color={mainColor} style={{ opacity: 0.7 }} />
                    {data.vendedor_telefono || "---"}
                 </div>
            </div>

            {/* Fecha */}
            <div>
                <div style={detailLabelStyle}>Fecha Recolección</div>
                <div style={{ ...detailValueStyle, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} color={mainColor} style={{ opacity: 0.7 }} />
                    {formatDate(data.fecha_entrega_proveedor)}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default VendorHandoverSummary;