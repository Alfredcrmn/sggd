import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthContext";

const ProcessDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Necesitamos al usuario actual para registrar quién hizo la acción
  
  const tipoTabla = searchParams.get("type") || "garantias";
  const esGarantia = tipoTabla === "garantias";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- LÓGICA DE RESOLUCIÓN ---
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionType, setResolutionType] = useState("");
  
  // Estado único que almacenará los datos variables del JSON
  const [formValues, setFormValues] = useState({});

  // DEFINICIÓN DE LAS 5 ESTRUCTURAS (ESQUEMAS)
  const renderFormularioDinamico = () => {
    
    // 1. GARANTÍA - NOTA DE CRÉDITO
    if (esGarantia && resolutionType === 'nota_credito') {
        return (
            <div style={subFormStyle}>
                <InputText name="folio_nc" label="Folio Nota Crédito" onChange={handleInputChange} />
                <InputText name="facturas_afectadas" label="Facturas / Notas afectadas" placeholder="Ej: F-2030, F-2035" onChange={handleInputChange} />
                <InputDate name="fecha_notificacion" label="Fecha en que se le notificó al encargado de compras que se realizó una nota de crédito" onChange={handleInputChange} />
                <InputText name="persona_notifica" label="Persona que notificó" placeholder="Nombre del empleado" onChange={handleInputChange} />
                <InputDate name="fecha_aplicacion" label="Fecha en la que se aplicó la garantía" onChange={handleInputChange} />
            </div>
        );
    }

    // 2. GARANTÍA - CAMBIO FÍSICO
    if (esGarantia && resolutionType === 'cambio_fisico') {
        return (
            <div style={subFormStyle}>
                <InputText name="persona_recibe" label="Persona que recibe en surcursal" placeholder="Nombre del empleado" onChange={handleInputChange} />
                <InputDate name="fecha_reingreso" label="Fecha en que el producto reingresó a sucursal" onChange={handleInputChange} />
                <InputText name="persona_entrega" label="Persona que entrega al cliente" placeholder="Nombre del empleado" onChange={handleInputChange} />
                <InputDate name="fecha_entrega" label="Fecha en que se entrega el producto de vuelta al cliente" onChange={handleInputChange} />

            </div>
        );
    }

    // 3. GARANTÍA - REPARACIÓN
    if (esGarantia && resolutionType === 'reparacion') {
        return (
            <div style={subFormStyle}>
                <InputText name="persona_recibe" label="Persona que recibe en surcursal" placeholder="Nombre del empleado" onChange={handleInputChange} />
                <InputDate name="fecha_reingreso" label="Fecha en que el producto reingresó a sucursal" onChange={handleInputChange} />
                <InputText name="persona_entrega" label="Persona que entrega al cliente" placeholder="Nombre del empleado" onChange={handleInputChange} />
                <InputDate name="fecha_entrega" label="Fecha en que se entrega el producto de vuelta al cliente" onChange={handleInputChange} />
            </div>
        );
    }

    // 4. DEVOLUCIÓN - NOTA DE CRÉDITO
    if (!esGarantia && resolutionType === 'nota_credito') {
        return (
            <div style={subFormStyle}>
                <InputText name="folio_nc" label="Folio Nota Crédito" onChange={handleInputChange} />
                <InputText name="facturas_afectadas" label="Facturas / Notas afectadas" placeholder="Ej: F-2030, F-2035" onChange={handleInputChange} />
                <InputDate name="fecha_notificacion" label="Fecha en que se le notificó al encargado de compras que se realizó una nota de crédito" onChange={handleInputChange} />
                <InputText name="persona_notifica" label="Persona que notificó" placeholder="Nombre del empleado" onChange={handleInputChange} />
                <InputDate name="fecha_aplicacion" label="Fecha en la que se aplicó la garantía" onChange={handleInputChange} />
            </div>
        );
    }

    // 5. DEVOLUCIÓN - CAMBIO FÍSICO
    if (!esGarantia && resolutionType === 'cambio_fisico') {
        return (
            <div style={subFormStyle}>
                <InputText name="persona_recibe" label="Persona que recibe en surcursal" placeholder="Nombre del empleado" onChange={handleInputChange} />
                <InputDate name="fecha_reingreso" label="Fecha en que el producto reingresó a sucursal" onChange={handleInputChange} />
            </div>
        );
    }

    return null;
  };

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const userColumn = esGarantia ? "recibido_por_id" : "solicitado_por_id";
        const { data: record, error } = await supabase
          .from(tipoTabla)
          .select(`
            *,
            sucursales ( nombre ),
            proveedores ( nombre ),
            perfiles:${userColumn} ( nombre_completo )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setData({ ...record, usuario_responsable: record[userColumn] });
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, tipoTabla, esGarantia]);

  const handleInputChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  // --- GUARDADO INTELIGENTE ---
  const handleConfirmarResolucion = async () => {
    if (!resolutionType) return alert("Selecciona una resolución.");
    
    const valoresActuales = Object.values(formValues);
    if (valoresActuales.length === 0 && resolutionType === 'nota_credito') {
        return alert("Por favor completa los campos requeridos.");
    }

    const confirmar = window.confirm(`¿Cerrar caso como ${resolutionType.replace('_', ' ').toUpperCase()}?`);
    if (!confirmar) return;

    const fechaHoy = new Date();

    // 1. PREPARAMOS EL JSON
    const jsonDetalles = {
        ...formValues,
        resolucion_aplicada: resolutionType,
        fecha_registro_resolucion: fechaHoy
    };

    // 2. PREPARAMOS LAS COLUMNAS SQL
    const updatePayload = {
        estatus: 'cerrado',
        tipo_resolucion: resolutionType,
        fecha_cierre: fechaHoy,
        cerrado_por_id: user.id, 
        datos_resolucion: jsonDetalles 
    };

    // LOGICA DE COLUMNAS ESPECÍFICAS
    if (esGarantia) {
        if (resolutionType === 'nota_credito') {
            updatePayload.nc_fecha_notificacion = fechaHoy;
            updatePayload.nc_notificado_por = formValues.persona_notifica || "Sistema"; 
        } 
        else if (resolutionType === 'cambio_fisico' || resolutionType === 'reparacion') {
            updatePayload.fecha_reingreso_tienda = fechaHoy;
            updatePayload.recibido_de_proveedor_por_id = user.id; // CORREGIDO AL NUEVO NOMBRE
            updatePayload.fecha_entrega_cliente = fechaHoy;
            updatePayload.entregado_cliente_por_id = user.id; 
        }
    } else {
        if (resolutionType === 'nota_credito') updatePayload.nc_fecha_notificacion = fechaHoy;
    }

    try {
      const { error } = await supabase.from(tipoTabla).update(updatePayload).eq('id', id);

      if (error) throw error;
      alert("Proceso cerrado y documentación guardada.");
      navigate("/processes"); 
    } catch (error) {
      alert("Error al cerrar: " + error.message);
    }
  };

  // Helper para mostrar JSON bonito
  const renderDatosJson = (json) => {
      if (!json) return null;
      const keysToShow = Object.keys(json).filter(k => k !== 'resolucion_aplicada' && k !== 'fecha_registro_resolucion');
      
      return (
          <div style={{ marginTop: '10px', fontSize: '0.85rem', background: '#f0fdf4', padding: '10px', borderRadius: '6px' }}>
              {keysToShow.map(k => (
                  <div key={k} style={{marginBottom: '4px'}}>
                      <strong style={{textTransform: 'capitalize'}}>{k.replace(/_/g, ' ')}:</strong> {json[k]}
                  </div>
              ))}
          </div>
      );
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (!data) return <div className="p-8 text-center">No encontrado.</div>;

  const opciones = esGarantia 
    ? [
        { value: 'nota_credito', label: '📄 Nota de Crédito' },
        { value: 'cambio_fisico', label: '🔄 Cambio Físico' },
        { value: 'reparacion', label: '🛠️ Reparación' }
      ]
    : [
        { value: 'nota_credito', label: '📄 Nota de Crédito' },
        { value: 'cambio_fisico', label: '🔄 Cambio Físico' }
      ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>⬅️</button>
        <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>{data.folio}</h1>
            <span style={{ background: data.estatus === 'activo' ? '#dbeafe' : '#f1f5f9', color: data.estatus === 'activo' ? '#1e40af' : '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {data.estatus?.toUpperCase()}
            </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* COLUMNA IZQUIERDA */}
        <div className="form-section">
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '1rem', color: '#64748b' }}>📦 Información</h3>
            <DetailRow label="Producto" value={data.producto_nombre} />
            <DetailRow label="Proveedor" value={data.proveedores?.nombre} />
            
            {/* AQUÍ ESTÁ EL CAMPO NUEVO VISIBLE */}
            <DetailRow label="Nombre del Vendedor" value={data.recibido_por_proveedor_nombre} />
            
            <DetailRow label="Registrado por" value={data.usuario_responsable?.nombre_completo} />
            
            <div style={{ marginTop: '2rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Razón / Falla</h4>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                    {esGarantia ? data.defecto_descripcion : data.razon_devolucion}
                </div>
            </div>

            {/* FOTO EVIDENCIA */}
            {data.evidencia_entrega_url && (
                <div style={{ marginTop: '2rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>📸 Evidencia Adjunta</h4>
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <img 
                            src={data.evidencia_entrega_url} 
                            alt="Evidencia Inicial" 
                            style={{ width: '100%', height: 'auto', display: 'block' }} 
                        />
                    </div>
                    <a href={data.evidencia_entrega_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', display: 'block', marginTop: '5px' }}>
                        Ver imagen original
                    </a>
                </div>
            )}
        </div>

        {/* COLUMNA DERECHA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="form-section">
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '1rem', color: '#64748b' }}>📍 Administración</h3>
                <DetailRow label="Sucursal" value={data.sucursales?.nombre} />
                <DetailRow label="Fecha Registro" value={new Date(data.created_at).toLocaleString()} />
                
                {data.estatus === 'cerrado' && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                        <DetailRow label="Fecha Cierre" value={new Date(data.fecha_cierre).toLocaleDateString()} />
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Resolución Final</div>
                            <div style={{ fontSize: '1.1rem', color: '#166534', fontWeight: '700' }}>
                                {data.tipo_resolucion?.replace(/_/g, " ").toUpperCase()}
                            </div>
                            {renderDatosJson(data.datos_resolucion)}
                        </div>
                    </div>
                )}
            </div>

            {/* FORMULARIO DE CIERRE */}
            {data.estatus === 'activo' && (
                <div className="form-section">
                    {!isResolving ? (
                        <button onClick={() => setIsResolving(true)} style={btnPrimaryStyle}>✅ Resolver Caso</button>
                    ) : (
                        <div>
                            <h4 style={{ marginBottom: '1rem' }}>Selecciona Resolución</h4>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                {opciones.map((opcion) => (
                                    <label key={opcion.value} style={{ 
                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', 
                                            border: resolutionType === opcion.value ? '2px solid var(--color-brand-primary)' : '1px solid #cbd5e1',
                                            borderRadius: '8px', cursor: 'pointer', background: resolutionType === opcion.value ? '#fff7ed' : 'white'
                                        }}>
                                        <input type="radio" name="resolution" value={opcion.value} 
                                            checked={resolutionType === opcion.value}
                                            onChange={(e) => { setResolutionType(e.target.value); setFormValues({}); }} 
                                        />
                                        <span style={{ fontWeight: '500' }}>{opcion.label}</span>
                                    </label>
                                ))}
                            </div>

                            {renderFormularioDinamico()}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                                <button onClick={() => { setIsResolving(false); setResolutionType(""); }} style={btnCancelStyle}>Cancelar</button>
                                <button onClick={handleConfirmarResolucion} style={btnConfirmStyle}>Confirmar y Cerrar</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTES UI SIMPLES ---
const InputText = ({ label, ...props }) => (
    <div className="form-group">
        <label className="form-label">{label}</label>
        <input type="text" className="form-input" {...props} />
    </div>
);
const InputDate = ({ label, ...props }) => (
    <div className="form-group">
        <label className="form-label">{label}</label>
        <input type="date" className="form-input" {...props} />
    </div>
);
const DetailRow = ({ label, value }) => (
    <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '1rem', color: '#334155', fontWeight: '500' }}>{value || "---"}</div>
    </div>
);

// ESTILOS
const subFormStyle = { background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' };
const btnPrimaryStyle = { width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const btnConfirmStyle = { flex: 1, padding: '10px', background: 'var(--color-brand-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const btnCancelStyle = { flex: 1, padding: '10px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };

export default ProcessDetail;