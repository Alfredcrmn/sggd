import { useState, useEffect } from "react";
import { supabase } from "../../supabase/client";
import { Save, Clock, ShieldAlert, Lock } from "lucide-react";

const AssignSicarFolio = ({ id, table, onUpdate }) => {
    const [folio, setFolio] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Estados para control de permisos
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingRole, setCheckingRole] = useState(true);

    // 1. VERIFICAR EL ROL AL MONTAR EL COMPONENTE
    useEffect(() => {
        const checkUserRole = async () => {
            try {
                // Obtener usuario autenticado
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Consultar su rol en la tabla perfiles
                const { data, error } = await supabase
                    .from('perfiles')
                    .select('rol')
                    .eq('id', user.id)
                    .single();

                if (data && data.rol === 'admin') {
                    setIsAdmin(true);
                }
            } catch (error) {
                console.error("Error verificando permisos:", error);
            } finally {
                setCheckingRole(false);
            }
        };

        checkUserRole();
    }, []);

    const handleSave = async () => {
        if (!folio.trim()) return alert("Por favor ingresa el Folio SICAR.");
        setLoading(true);
        try {
            const { error } = await supabase
                .from(table)
                .update({ 
                    folio_sicar: folio,
                    estatus: 'activo' 
                })
                .eq('id', id);

            if (error) throw error;
            onUpdate();
        } catch (error) {
            console.error("Error completo:", error);
            alert(`Error al guardar: ${error.message || "Error desconocido"}`);
        } finally {
            setLoading(false);
        }
    };

    if (checkingRole) {
        return <div className="p-4 text-center text-sm text-gray-500">Verificando permisos...</div>;
    }

    // 2. VISTA PARA CAJEROS (SOLO LECTURA / ESPERA)
    if (!isAdmin) {
        return (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <div style={{ background: '#ffedd5', padding: '10px', borderRadius: '50%' }}>
                        <Clock size={32} color="#c2410c" />
                    </div>
                </div>
                <h3 style={{ fontSize: '1.1rem', color: '#9a3412', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Esperando Asignación de Folio
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#c2410c', lineHeight: '1.5' }}>
                    La solicitud ha sido enviada correctamente. <br/>
                    Un <strong>Administrador</strong> debe ingresar el folio de SICAR para que puedas continuar con la entrega al proveedor.
                </p>
                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', color: '#9a3412', opacity: 0.8 }}>
                    <Lock size={12} /> Esperando autorización administrativa
                </div>
            </div>
        );
    }

    // 3. VISTA PARA ADMINISTRADORES (FORMULARIO DE EDICIÓN)
    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <ShieldAlert size={20} color="var(--color-brand-primary)" />
                <h3 style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 'bold' }}>Asignación de Folio SICAR</h3>
            </div>
            
            <p className="text-sm" style={{ marginBottom: '1.5rem', color: '#64748b' }}>
                Ingresa el folio generado en el sistema SICAR para desbloquear el proceso y permitir la entrega.
            </p>
            
            <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Folio SICAR
                </label>
                <input 
                    type="text" 
                    className="form-input" 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                    placeholder="Ej. GAR-2024-001"
                    value={folio}
                    onChange={(e) => setFolio(e.target.value)}
                    autoFocus
                />
            </div>
            
            <button 
                onClick={handleSave} 
                disabled={loading}
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem', backgroundColor: '#0f172a', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
            >
                {loading ? "Guardando..." : <><Save size={18}/> Guardar y Desbloquear Proceso</>}
            </button>
        </div>
    );
};

export default AssignSicarFolio;