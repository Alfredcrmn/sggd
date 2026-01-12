import React from 'react';

// Componentes internos simples
const InputText = ({ label, icon, ...props }) => (
    <div style={{ marginBottom: '12px' }}>
        <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>{label}</label>
        <div style={{ position: 'relative' }}>
            {icon && <div style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }}>{icon}</div>}
            <input type="text" className="form-input" style={{ fontSize: '0.9rem', padding: '10px', width: '100%', paddingLeft: icon ? '30px' : '10px' }} {...props} />
        </div>
    </div>
);

const InputDate = ({ label, ...props }) => (
    <div style={{ marginBottom: '12px' }}>
        <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>{label}</label>
        <input type="date" className="form-input" style={{ fontSize: '0.9rem', padding: '10px', width: '100%' }} {...props} />
    </div>
);

const ResolutionForms = ({ isGarantia, resolutionType, onChange }) => {
    
    // CASO 1: NOTA DE CRÉDITO
    if (resolutionType === 'nota_credito') {
        return (
            <div className="sub-form" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <InputText name="folio_nc" label="Folio Nota Crédito" placeholder="Ej: NC-2024" onChange={onChange} />
                    <InputText name="valor_nota_credito" label="Valor Devuelto" placeholder="0.00" type="number" icon="$" onChange={onChange} />
                </div>
                <InputText name="facturas_afectadas" label="Facturas Afectadas" placeholder="Ej: F-2030, F-2035" onChange={onChange} />
                <InputDate name="fecha_notificacion" label="Fecha Notificación" onChange={onChange} />
                <InputText name="persona_notifica" label="Persona que notificó" placeholder="Nombre empleado" onChange={onChange} />
            </div>
        );
    }

    // CASO 2: CAMBIO FÍSICO O REPARACIÓN
    if (['cambio_fisico', 'reparacion'].includes(resolutionType)) {
        return (
            <div className="sub-form" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                <InputText name="persona_recibe" label="Recibe en sucursal" placeholder="Empleado" onChange={onChange} />
            </div>
        );
    }

    return null;
};

export default ResolutionForms;