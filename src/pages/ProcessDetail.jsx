import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthContext";

// Importamos el componente de formularios que acabamos de crear
import ResolutionForms from "../components/ResolutionForms"; 

import { 
  ArrowLeft, 
  ShieldCheck, 
  Undo2, 
  MapPin, 
  User, 
  Truck, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  Archive, 
  AlertTriangle, 
  ImageIcon, 
  Maximize2, 
  Phone, 
  X, 
  FileBadge, 
  RefreshCcw, 
  Wrench, 
  Hash, 
  Store, 
  Calendar
} from "lucide-react";

const ProcessDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const type = searchParams.get("type") || "garantias";
  const tableName = type.endsWith('s') ? type : `${type}s`; 
  const isGarantia = tableName === "garantias";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Estados de Resolución
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionType, setResolutionType] = useState("");
  const [formValues, setFormValues] = useState({});

  // Estado del Modal de Evidencia
  const [showImageModal, setShowImageModal] = useState(false);

  // Estados para datos procesados (limpios)
  const [parsedDescription, setParsedDescription] = useState("");
  const [parsedClient, setParsedClient] = useState({ name: "", phone: "" });

  useEffect(() => {
    fetchDetail();
  }, [id, tableName]);

  const fetchDetail = async () => {
    try {
      const userColumn = isGarantia ? "recibido_por_id" : "solicitado_por_id";
      
      const { data: record, error } = await supabase
        .from(tableName)
        .select(`
            *,
            sucursales ( nombre ),
            proveedores ( nombre ),
            perfiles:${userColumn} ( nombre_completo )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // --- LÓGICA DE PARSING (LIMPIEZA DE TEXTO) ---
      const rawText = isGarantia ? record.defecto_descripcion : record.razon_devolucion;
      let cleanDesc = rawText;
      let clientName = record.cliente_nombre;
      let clientPhone = record.cliente_telefono;

      // Extraer datos del string si vienen pegados con formato [Cliente: ...]
      if (rawText && rawText.includes('[Cliente:')) {
          const parts = rawText.split('[Cliente:');
          cleanDesc = parts[0].trim(); 

          // Si no hay columnas dedicadas o están vacías, intentamos usar lo del texto
          if (!clientName || !clientPhone) {
              const infoPart = parts[1].replace(']', ''); 
              const infoSplit = infoPart.split('- Tel:');
              if (infoSplit.length >= 2) {
                  clientName = clientName || infoSplit[0].trim();
                  clientPhone = clientPhone || infoSplit[1].trim();
              }
          }
      }

      setParsedDescription(cleanDesc);
      setParsedClient({ name: clientName, phone: clientPhone });
      
      setData({ ...record, usuario_responsable: record.perfiles });

      if (user) {
          const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
          if (perfil) setUserRole(perfil.rol);
      }
    } catch (error) {
      console.error("Error:", error);
      navigate("/processes");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  // --- LÓGICA DE CIERRE / GUARDADO ---
  const handleConfirmarResolucion = async () => {
    if (!resolutionType) return alert("Selecciona una resolución.");
    
    // Validación básica de campos vacíos para Notas de Crédito
    const valoresActuales = Object.values(formValues);
    if (valoresActuales.length === 0 && resolutionType === 'nota_credito') {
        return alert("Por favor completa los campos requeridos.");
    }

    const esAdmin = userRole === 'admin';
    const nuevoEstatus = esAdmin ? 'cerrado' : 'pendiente_validacion';
    
    if (!window.confirm(`¿Confirmar ${resolutionType.replace('_', ' ').toUpperCase()}?`)) return;

    const fechaHoy = new Date();
    const jsonDetalles = {
        ...formValues,
        resolucion_aplicada: resolutionType,
        fecha_registro_resolucion: fechaHoy,
        propuesto_por_id: user.id
    };

    const updatePayload = {
        estatus: nuevoEstatus,
        tipo_resolucion: resolutionType,
        datos_resolucion: jsonDetalles 
    };

    if (esAdmin) {
        updatePayload.fecha_cierre = fechaHoy;
        updatePayload.cerrado_por_id = user.id;
        updatePayload.validado_por_admin_id = user.id;
    }

    // Guardado de campos específicos para reportes legacy
    if (isGarantia) {
        if (resolutionType === 'nota_credito') {
            updatePayload.nc_fecha_notificacion = fechaHoy;
            updatePayload.nc_notificado_por = formValues.persona_notifica || "Sistema"; 
        } else if (['cambio_fisico', 'reparacion'].includes(resolutionType)) {
            updatePayload.fecha_reingreso_tienda = fechaHoy;
            updatePayload.fecha_entrega_cliente = fechaHoy;
        }
    } else {
        if (resolutionType === 'nota_credito') updatePayload.nc_fecha_notificacion = fechaHoy;
    }

    try {
      const { error } = await supabase.from(tableName).update(updatePayload).eq('id', id);
      if (error) throw error;
      alert(esAdmin ? "✅ Caso cerrado correctamente." : "✅ Solución enviada a validación.");
      setIsResolving(false);
      fetchDetail();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleAdminDecision = async (decision) => {
      if (!window.confirm(`¿Estás seguro de ${decision === 'aprobar' ? 'APROBAR' : 'RECHAZAR'} esta solicitud?`)) return;

      try {
          const updatePayload = {};
          if (decision === 'aprobar') {
              updatePayload.estatus = 'cerrado';
              updatePayload.fecha_cierre = new Date();
              updatePayload.cerrado_por_id = data.datos_resolucion?.propuesto_por_id || user.id;
              updatePayload.validado_por_admin_id = user.id;
          } else {
              updatePayload.estatus = 'activo';
              updatePayload.tipo_resolucion = null; 
          }

          const { error } = await supabase.from(tableName).update(updatePayload).eq('id', id);
          if (error) throw error;
          
          alert(decision === 'aprobar' ? "✅ Validado y Cerrado." : "❌ Rechazado. Vuelve a estatus Activo.");
          fetchDetail();

      } catch (error) {
          alert("Error: " + error.message);
      }
  };

  const getStatusColor = (status) => {
    if (status === 'cerrado') return 'badge-closed';
    if (status === 'pendiente_validacion') return 'badge-pending';
    return 'badge-active';
  };

  const renderDatosJson = (json) => {
      if (!json) return null;
      const keysToShow = Object.keys(json).filter(k => !['resolucion_aplicada','fecha_registro_resolucion','propuesto_por_id'].includes(k));
      return (
          <div style={{ marginTop: '10px', fontSize: '0.85rem', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              {keysToShow.map(k => (
                  <div key={k} style={{marginBottom: '4px', display: 'grid', gridTemplateColumns: '150px 1fr'}}>
                      <span style={{fontWeight: '600', color: '#64748b', textTransform: 'capitalize'}}>{k.replace(/_/g, ' ')}:</span> 
                      <span style={{color: '#334155'}}>{json[k]}</span>
                  </div>
              ))}
          </div>
      );
  };

  const getResolutionIcon = (value) => {
      switch(value) {
          case 'nota_credito': return <FileBadge size={18} />;
          case 'cambio_fisico': return <RefreshCcw size={18} />;
          case 'reparacion': return <Wrench size={18} />;
          default: return <FileText size={18} />;
      }
  };

  if (loading) return <div className="p-8 text-center">Cargando detalles...</div>;
  if (!data) return <div className="p-8 text-center">Registro no encontrado.</div>;

  const opcionesResolucion = isGarantia 
    ? [{ value: 'nota_credito', label: 'Nota de Crédito' }, { value: 'cambio_fisico', label: 'Cambio Físico' }, { value: 'reparacion', label: 'Reparación' }]
    : [{ value: 'nota_credito', label: 'Nota de Crédito' }, { value: 'cambio_fisico', label: 'Cambio Físico' }];

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      
      {/* HEADER DE NAVEGACIÓN */}
      <div style={{ marginBottom: '2rem' }}>
        <button 
            onClick={() => navigate(-1)} 
            className="btn"
            style={{ 
                background: 'transparent', border: 'none', paddingLeft: 0,
                color: '#64748b', marginBottom: '1rem' 
            }}
        >
            <ArrowLeft size={18} /> Volver al listado
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ 
                    padding: '12px', borderRadius: '12px',
                    background: isGarantia ? '#fff7ed' : '#f0f9ff',
                    color: isGarantia ? 'var(--color-brand-primary)' : '#0ea5e9'
                }}>
                    {isGarantia ? <ShieldCheck size={32} /> : <Undo2 size={32} />}
                </div>
                <div>
                    <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        {data.folio}
                        <span className={`badge ${getStatusColor(data.estatus)}`} style={{ fontSize: '0.9rem', padding: '5px 12px' }}>
                            {data.estatus.replace('_', ' ').toUpperCase()}
                        </span>
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', marginTop: '4px', fontSize: '0.9rem' }}>
                        <Calendar size={14} /> 
                        Registrado el {new Date(data.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>
            
            <div style={{ textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 'bold', color: '#cbd5e1' }}>ID INTERNO</div>
                {data.id}
            </div>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA: INFORMACIÓN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* TARJETA DE PRODUCTO */}
            <div className="card">
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                    <Hash size={20} color="#64748b" /> Detalle del Producto
                </h3>
                
                {/* Grid de Datos del Producto */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                        <label className="text-sm" style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Producto</label>
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: '#334155' }}>{data.producto_nombre}</div>
                    </div>
                    <div>
                        <label className="text-sm" style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>SKU / Clave</label>
                        <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Hash size={14} color="#94a3b8" /> {data.producto_clave}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm" style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Valor</label>
                        <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CreditCard size={14} color="#94a3b8" /> ${data.factura_valor || "0.00"}
                        </div>
                    </div>
                </div>
                
                {/* Descripción Limpia */}
                <div>
                    <label className="text-sm" style={{ color: '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        <FileText size={14} /> {isGarantia ? "Falla Reportada" : "Motivo de Devolución"}
                    </label>
                    <p style={{ lineHeight: '1.6', color: '#334155', fontSize: '1rem' }}>
                        {parsedDescription}
                    </p>
                </div>
            </div>

            {/* TARJETAS DE CONTEXTO (Origen y Cliente) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                
                {/* Origen */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Store size={18} /> Origen
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '50%' }}>
                                <MapPin size={18} color="var(--color-brand-primary)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Sucursal</div>
                                <div style={{ fontWeight: '600', color: '#334155' }}>{data.sucursales?.nombre}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '50%' }}>
                                <Truck size={18} color="var(--color-brand-primary)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Proveedor</div>
                                <div style={{ fontWeight: '600', color: '#334155' }}>{data.proveedores?.nombre}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cliente (Datos parseados) */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={18} /> Cliente
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '50%' }}>
                                <User size={18} color="#64748b" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Nombre</div>
                                <div style={{ fontWeight: '600', color: '#334155' }}>{parsedClient.name || "No registrado"}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '50%' }}>
                                <Phone size={18} color="#64748b" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Teléfono</div>
                                <div style={{ fontWeight: '600', color: '#334155' }}>{parsedClient.phone || "No registrado"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: PANELES DE ACCIÓN (Sticky) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '20px' }}>
            
            {/* PANEL DE GESTIÓN */}
            <div className="card" style={{ borderTop: '4px solid var(--color-brand-primary)' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 'bold' }}>Gestión del Caso</h3>
                
                {data.estatus === 'cerrado' && (
                    <div style={{ background: '#ecfdf5', padding: '15px', borderRadius: '8px', border: '1px solid #a7f3d0', color: '#065f46', textAlign: 'center' }}>
                        <CheckCircle2 size={32} style={{ margin: '0 auto 8px auto', color: '#059669' }} />
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Caso Cerrado</div>
                        <div style={{ fontSize: '0.85rem' }}>Resolución: {data.tipo_resolucion?.replace(/_/g, " ").toUpperCase()}</div>
                    </div>
                )}

                {data.estatus === 'activo' && (
                    <div>
                        {!isResolving ? (
                            <button onClick={() => setIsResolving(true)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                                <Archive size={18} /> Iniciar Resolución
                            </button>
                        ) : (
                            <div style={{ animation: 'fadeIn 0.2s ease' }}>
                                <div style={{ marginBottom: '10px', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>Tipo de Resolución:</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                                    {opcionesResolucion.map((opcion) => (
                                        <label key={opcion.value} style={{ 
                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '6px', cursor: 'pointer',
                                            border: resolutionType === opcion.value ? '2px solid var(--color-brand-primary)' : '1px solid #e2e8f0', 
                                            background: resolutionType === opcion.value ? '#fff7ed' : 'white',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input type="radio" name="resolution" value={opcion.value} checked={resolutionType === opcion.value} onChange={(e) => { setResolutionType(e.target.value); setFormValues({}); }} />
                                            <span style={{ fontWeight: '500', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {getResolutionIcon(opcion.value)} {opcion.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                
                                {/* USO DEL COMPONENTE EXTERNO */}
                                <ResolutionForms 
                                    isGarantia={isGarantia} 
                                    resolutionType={resolutionType} 
                                    onChange={handleInputChange} 
                                />
                                
                                <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                                    <button onClick={() => { setIsResolving(false); setResolutionType(""); }} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                                    <button onClick={handleConfirmarResolucion} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                        {userRole === 'admin' ? "Cerrar" : "Enviar"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {data.estatus === 'pendiente_validacion' && (
                     <div style={{ background: '#fffbeb', padding: '15px', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 'bold', marginBottom: '10px' }}>
                            <AlertTriangle size={20} /> Validación Requerida
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#78350f' }}>Propuesta: <strong>{data.tipo_resolucion?.toUpperCase().replace('_', ' ')}</strong></div>
                        
                        {renderDatosJson(data.datos_resolucion)}

                        {userRole === 'admin' ? (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button onClick={() => handleAdminDecision('rechazar')} className="btn" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', flex: 1, justifyContent: 'center' }}>Rechazar</button>
                                <button onClick={() => handleAdminDecision('aprobar')} className="btn" style={{ background: '#10b981', color: 'white', border: 'none', flex: 1, justifyContent: 'center' }}>Aprobar</button>
                            </div>
                        ) : (
                            <div style={{ marginTop: '15px', fontSize: '0.8rem', color: '#b45309', fontStyle: 'italic', textAlign: 'center' }}>
                                Esperando aprobación del administrador...
                            </div>
                        )}
                     </div>
                )}
            </div>

            {/* EVIDENCIA DE PROVEEDOR (BOTÓN + MODAL) */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={18} /> Evidencia de proveedor
                </h3>
                
                {data.evidencia_entrega_url ? (
                    <button 
                        onClick={() => setShowImageModal(true)}
                        className="btn btn-secondary" 
                        style={{ width: '100%', justifyContent: 'center', padding: '12px', border: '1px solid #cbd5e1' }}
                    >
                        <Maximize2 size={18} /> Ver Evidencia
                    </button>
                ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '6px', fontSize: '0.9rem' }}>
                        Sin evidencia adjunta
                    </div>
                )}
            </div>

        </div>
      </div>

      {/* MODAL DE IMAGEN (OVERLAY) */}
      {showImageModal && (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.9)', zIndex: 9999, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
            animation: 'fadeIn 0.2s ease'
        }} onClick={() => setShowImageModal(false)}>
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={() => setShowImageModal(false)}
                    style={{ 
                        position: 'absolute', top: '-50px', right: 0, 
                        background: 'white', border: 'none', color: 'black', cursor: 'pointer',
                        borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <X size={24} />
                </button>
                <img 
                    src={data.evidencia_entrega_url} 
                    alt="Evidencia Full" 
                    style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }} 
                />
            </div>
        </div>
      )}

    </div>
  );
};

export default ProcessDetail;