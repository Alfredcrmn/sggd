import React from 'react';
import { CreditCard } from 'lucide-react'; // Opcional, para decorar

// Componentes de UI internos
const InputText = ({ label, icon, ...props }) => (
    <div style={{ marginBottom: '12px' }}>
        <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>{label}</label>
        <div style={{ position: 'relative' }}>
            {icon && <div style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }}>{icon}</div>}
            <input 
                type="text" 
                className="form-input" 
                style={{ fontSize: '0.9rem', padding: '10px', width: '100%', paddingLeft: icon ? '35px' : '10px' }} 
                {...props} 
            />
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
    
    // 1. GARANTÍA - NOTA DE CRÉDITO
    if (isGarantia && resolutionType === 'nota_credito') {
        return (
            <div className="sub-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <InputText name="folio_nc" label="Folio Nota Crédito" placeholder="Ej: NC-2024" onChange={onChange} />
                    {/* NUEVO CAMPO: VALOR */}
                    <InputText 
                        name="valor_nota_credito" 
                        label="Valor en Nota de Crédito" 
                        placeholder="0.00" 
                        type="number" 
                        icon="$"
                        onChange={onChange} 
                    />
                </div>
                
                <InputText name="facturas_afectadas" label="Facturas / Notas afectadas" placeholder="Ej: F-2030, F-2035" onChange={onChange} />
                <InputDate name="fecha_notificacion" label="Fecha notificación a Compras" onChange={onChange} />
                <InputText name="persona_notifica" label="Persona que notificó" placeholder="Nombre empleado" onChange={onChange} />
                <InputDate name="fecha_aplicacion" label="Fecha aplicación garantía" onChange={onChange} />
            </div>
        );
    }

    // 2. GARANTÍA - CAMBIO FÍSICO O REPARACIÓN
    if (isGarantia && ['cambio_fisico', 'reparacion'].includes(resolutionType)) {
        return (
            <div className="sub-form">
                <InputText name="persona_recibe" label="Recibe en sucursal" placeholder="Empleado" onChange={onChange} />
                <InputDate name="fecha_reingreso" label="Fecha reingreso a sucursal" onChange={onChange} />
                <InputText name="persona_entrega" label="Entrega al cliente" placeholder="Empleado" onChange={onChange} />
                <InputDate name="fecha_entrega" label="Fecha entrega al cliente" onChange={onChange} />
            </div>
        );
    }

    // 3. DEVOLUCIÓN - NOTA DE CRÉDITO
    if (!isGarantia && resolutionType === 'nota_credito') {
        return (
            <div className="sub-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <InputText name="folio_nc" label="Folio Nota Crédito" placeholder="Ej: NC-2024" onChange={onChange} />
                    {/* NUEVO CAMPO: VALOR */}
                    <InputText 
                        name="valor_nota_credito" 
                        label="Valor en Nota de Crédito" 
                        placeholder="0.00" 
                        type="number" 
                        icon="$"
                        onChange={onChange} 
                    />
                </div>

                <InputText name="facturas_afectadas" label="Facturas afectadas" placeholder="Ej: F-2030" onChange={onChange} />
                <InputDate name="fecha_notificacion" label="Fecha notificación a Compras" onChange={onChange} />
                <InputText name="persona_notifica" label="Persona que notificó" onChange={onChange} />
                <InputDate name="fecha_aplicacion" label="Fecha aplicación" onChange={onChange} />
            </div>
        );
    }

    // 4. DEVOLUCIÓN - CAMBIO FÍSICO
    if (!isGarantia && resolutionType === 'cambio_fisico') {
        return (
            <div className="sub-form">
                <InputText name="persona_recibe" label="Recibe en sucursal" placeholder="Empleado" onChange={onChange} />
                <InputDate name="fecha_reingreso" label="Fecha reingreso" onChange={onChange} />
            </div>
        );
    }

    return null;
};

export default ResolutionForms;