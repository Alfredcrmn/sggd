import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthContext"; 

import ProcessHeader from "../components/shared/ProcessHeader";
import EvidenceCard from "../components/shared/EvidenceCard";
import Timeline from "../components/shared/Timeline";

import AssignSicarFolio from "../components/actions/AssignSicarFolio";
import VendorHandover from "../components/actions/VendorHandover";
import VendorHandoverSummary from "../components/summaries/VendorHandoverSummary"; 
import ProcessResolution from "../components/actions/ProcessResolution";
import CustomerDelivery from "../components/actions/CustomerDelivery";
import AdminReview from "../components/actions/AdminReview";

import { Archive, Hash, CreditCard, FileText, Store, MapPin, Truck, User, Phone, FileCheck, ArrowRight, UserCheck, Clock, ShieldAlert } from "lucide-react";

const WarrantyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); 
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewStep, setViewStep] = useState(null); 
  const [sendingToSicar, setSendingToSicar] = useState(false);
  
  // Estado de Seguridad
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchDetail = async () => {
    try {
      const { data: record, error } = await supabase
        .from('garantias')
        .select(`*, sucursales(nombre), proveedores(nombre), perfiles_inicio:recibido_por_id(nombre_completo), perfiles_prov:recibido_de_proveedor_por_id(nombre_completo), perfiles_entrega:entregado_cliente_por_id(nombre_completo)`).eq('id', id).single();
      if (error) throw error;
      setData(record);
      setViewStep(record.estatus); 
    } catch (error) { navigate("/processes"); } finally { setLoading(false); }
  };

  // Verificación de Rol (Silenciosa)
  useEffect(() => {
    const checkRole = async () => {
        if (!user) return;
        
        const { data: profile, error } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', user.id)
            .maybeSingle();

        if (error || !profile) {
            setIsAdmin(false);
            return;
        }

        // Validación flexible (ignora mayúsculas/espacios)
        if (profile.rol && profile.rol.trim().toLowerCase() === 'admin') {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    };
    
    checkRole();
    fetchDetail();
  }, [id, user]);

  const sendToSicarAssignment = async () => {
    setSendingToSicar(true);
    try {
        const { error } = await supabase.from('garantias').update({ estatus: 'asignar_folio_sicar' }).eq('id', id);
        if (error) throw error;
        fetchDetail();
    } catch (error) { alert("Error al avanzar el proceso."); } finally { setSendingToSicar(false); }
  };

  const formatDate = (dateString) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return new Date(date.valueOf() + date.getTimezoneOffset() * 60000).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };
  const formatCurrency = (amount) => {
      const num = parseFloat(amount);
      if (isNaN(num)) return "$0.00";
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
  };

  // Componente de Espera para Cajeros
  const WaitingForAdminCard = ({ title, text }) => (
    <div style={{ textAlign: 'center', padding: '2rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '50%' }}>
                <Clock size={32} color="#d97706" />
            </div>
        </div>
        <h3 style={{ fontSize: '1.1rem', color: '#92400e', marginBottom: '0.5rem', fontWeight: 'bold' }}>{title}</h3>
        <p style={{ color: '#b45309', fontSize: '0.9rem', lineHeight: '1.5' }}>{text}</p>
        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#d97706', fontStyle: 'italic' }}>
            <ShieldAlert size={12} style={{ display: 'inline', marginRight: '4px' }}/>
            Solo administradores pueden avanzar.
        </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (!data) return null;

  const resData = data.datos_resolucion || {};
  const cardRowStyle = { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' };
  const iconContainerStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  const detailLabelStyle = { fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' };
  const detailValueStyle = { fontSize: '0.95rem', color: '#1e293b', fontWeight: '500' };

  const renderRightColumn = () => {
    // 1. MODO EDICIÓN
    if (viewStep === data.estatus) {
        if (data.estatus === 'creado') {
            return (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e293b' }}>Proceso Creado</h3>
                    <p className="text-sm" style={{ marginBottom: '1.5rem', color: '#64748b' }}>El registro ha sido creado exitosamente. Para continuar, un administrador debe asignar el folio interno de SICAR.</p>
                    <button onClick={sendToSicarAssignment} disabled={sendingToSicar} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem', backgroundColor: '#0f172a', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}>{sendingToSicar ? "Procesando..." : <>Solicitar Folio SICAR <ArrowRight size={18}/></>}</button>
                </div>
            );
        }
        if (data.estatus === 'asignar_folio_sicar') return <AssignSicarFolio id={id} table="garantias" onUpdate={fetchDetail} />;
        if (data.estatus === 'pendiente_validacion' || data.estatus === 'activo') return <VendorHandover table="garantias" id={id} onUpdate={fetchDetail} />;
        
        if (data.estatus === 'con_proveedor') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <VendorHandoverSummary data={data} />
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem', textTransform: 'uppercase' }}>Registrar Resolución</h4>
                        <ProcessResolution table="garantias" id={id} isGarantia={true} onUpdate={fetchDetail} />
                    </div>
                </div>
            );
        }

        // --- PROTECCIÓN 1: VALIDACIÓN ---
        if (data.estatus === 'por_aprobar') {
            if (!isAdmin) {
                return <WaitingForAdminCard title="Validación Requerida" text="La resolución ha sido registrada. Esperando aprobación de un administrador para continuar." />;
            }
            return <AdminReview table="garantias" id={id} currentStatus="por_aprobar" onUpdate={fetchDetail} />;
        }

        if (data.estatus === 'listo_para_entrega') return <CustomerDelivery id={id} onUpdate={fetchDetail} />;
        
        // --- PROTECCIÓN 2: CIERRE ---
        if (data.estatus === 'pendiente_cierre') {
            if (!isAdmin) {
                return <WaitingForAdminCard title="Cierre Pendiente" text="El proceso está completo. Un administrador debe revisar y cerrar el ticket definitivamente." />;
            }
            return <AdminReview table="garantias" id={id} currentStatus="pendiente_cierre" onUpdate={fetchDetail} />;
        }

        if (data.estatus === 'cerrado') return (
            <div style={{ textAlign: 'center', background: '#f0fdf4', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ color: '#15803d', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '5px' }}>¡Garantía Finalizada!</div>
                <div style={{ fontSize: '0.9rem', color: '#166534' }}>Cerrado el: {formatDate(data.fecha_cierre)}</div>
            </div>
        );
        return null;
    }

    // 2. MODO HISTORIAL
    return (
        <div>
            {['creado', 'asignar_folio_sicar'].includes(viewStep) && data.folio_sicar && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#6366f1' }}><Hash size={18} /> <strong style={{ fontSize: '0.95rem' }}>Registro SICAR</strong></div>
                    <div style={{ background: '#eef2ff', padding: '15px', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                        <div style={detailLabelStyle}>Folio Asignado</div>
                        <div style={{ ...detailValueStyle, fontSize: '1.1rem', fontWeight: 'bold' }}>{data.folio_sicar}</div>
                    </div>
                </div>
            )}
             {['pendiente_validacion', 'activo'].includes(viewStep) && (
                <div style={{ marginBottom: '2rem' }}>
                     {data.vendedor_nombre ? <VendorHandoverSummary data={data} /> : <div className="text-sm text-gray-400 italic">Datos de recolección pendientes...</div>}
                </div>
            )}
            {['con_proveedor', 'por_aprobar'].includes(viewStep) && (
                <div style={{ marginBottom: '2rem' }}>
                    {data.tipo_resolucion ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#0369a1' }}><FileCheck size={18} /> <strong style={{ fontSize: '0.95rem' }}>Resolución: {data.tipo_resolucion.replace(/_/g, ' ').toUpperCase()}</strong></div>
                            <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #bae6fd' }}>
                                    <div><div style={detailLabelStyle}>Fecha Reingreso</div><div style={detailValueStyle}>{formatDate(data.fecha_reingreso_tienda)}</div></div>
                                    {data.perfiles_prov && <div><div style={detailLabelStyle}>Recibido Por</div><div style={{ ...detailValueStyle, display: 'flex', alignItems: 'center', gap: '5px' }}><UserCheck size={14} color="#0369a1" />{data.perfiles_prov.nombre_completo}</div></div>}
                                </div>
                                {data.tipo_resolucion === 'reparacion' && data.comentarios_reparacion && (
                                    <div style={{ marginBottom: '15px', padding: '10px', background: 'white', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                                        <div style={detailLabelStyle}>Comentarios de Reparación</div>
                                        <p style={{ fontSize: '0.9rem', color: '#334155', fontStyle: 'italic', marginTop: '4px' }}>"{data.comentarios_reparacion}"</p>
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    {data.tipo_resolucion === 'nota_credito' && (
                                        <>
                                            <div style={{ gridColumn: 'span 2' }}><div style={detailLabelStyle}>Valor Devuelto</div><div style={{ ...detailValueStyle, color: '#15803d', fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(resData.valor_nota_credito || 0)}</div></div>
                                            <div><div style={detailLabelStyle}>Folio NC</div><div style={detailValueStyle}>{resData.folio_nc || '-'}</div></div>
                                            <div><div style={detailLabelStyle}>Factura Afectada</div><div style={detailValueStyle}>{data.factura_numero || '-'}</div></div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : <div className="text-sm text-gray-400 italic">Resolución pendiente...</div>}
                </div>
            )}
            {['listo_para_entrega', 'cerrado', 'pendiente_cierre'].includes(viewStep) && (
                <div style={{ marginBottom: '1rem' }}>
                    {data.fecha_entrega_cliente ? (
                        <>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#15803d' }}><User size={18} /> <strong style={{ fontSize: '0.95rem' }}>Entrega a Cliente Final</strong></div>
                            <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div><div style={detailLabelStyle}>Fecha Entrega</div><div style={detailValueStyle}>{formatDate(data.fecha_entrega_cliente)}</div></div>
                                    {data.perfiles_entrega && <div><div style={detailLabelStyle}>Entregado Por</div><div style={{ ...detailValueStyle, display: 'flex', alignItems: 'center', gap: '5px' }}><UserCheck size={14} color="#16a34a" />{data.perfiles_entrega.nombre_completo}</div></div>}
                                </div>
                            </div>
                        </>
                    ) : <div className="text-sm text-gray-400 italic">Entrega pendiente...</div>}
                </div>
            )}
            <button onClick={() => setViewStep(data.estatus)} className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', cursor: 'pointer' }}>Volver a la etapa actual</button>
        </div>
    );
  };

  return (
    <div className="container" style={{ padding: '0 2rem 1rem 2rem' }}>
        <style>{`.custom-scroll::-webkit-scrollbar { width: 6px; } .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }`}</style>
        <div style={{ paddingTop: '1rem' }}><ProcessHeader data={data} type="garantia" /></div>
        <div style={{ marginBottom: '2rem', padding: '0 1rem' }}><Timeline currentStatus={data.estatus} type="garantia" onStepClick={setViewStep} viewStep={viewStep} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}><Archive size={20} color="#64748b" /> Detalle del Producto</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
                        <div><label className="text-sm text-gray">Producto</label><div className="font-bold">{data.producto_nombre}</div></div>
                        <div><label className="text-sm text-gray">SKU</label><div className="flex gap-2 items-center"><Hash size={14}/> {data.producto_clave}</div></div>
                        <div><label className="text-sm text-gray">Valor</label><div className="flex gap-2 items-center"><CreditCard size={14}/> ${data.factura_valor}</div></div>
                    </div>
                    <div><label className="text-sm text-gray font-bold flex gap-2 items-center mb-2"><FileText size={14}/> FALLA REPORTADA</label><p style={{ lineHeight: '1.6', color: '#334155' }}>{data.defecto_descripcion}</p></div>
                    {data.folio_sicar && (<div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}><div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#eef2ff', borderRadius: '6px', color: '#4338ca', fontWeight: 'bold', fontSize: '0.9rem' }}><Hash size={16} /> Folio SICAR: {data.folio_sicar}</div></div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#64748b', display: 'flex', gap: '8px' }}><Store size={18}/> Origen</h3>
                        <div style={cardRowStyle}><div style={iconContainerStyle}><MapPin size={20} color="var(--color-brand-primary)"/></div><div><div className="text-sm text-gray">Sucursal</div><div className="font-bold">{data.sucursales?.nombre}</div></div></div>
                        <div style={{ ...cardRowStyle, marginBottom: 0 }}><div style={iconContainerStyle}><Truck size={20} color="var(--color-brand-primary)"/></div><div><div className="text-sm text-gray">Proveedor</div><div className="font-bold">{data.proveedores?.nombre}</div></div></div>
                    </div>
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#64748b', display: 'flex', gap: '8px' }}><User size={18}/> Cliente</h3>
                        <div style={cardRowStyle}><div style={iconContainerStyle}><User size={20} color="#64748b"/></div><div><div className="text-sm text-gray">Nombre</div><div className="font-bold">{data.cliente_nombre || "No registrado"}</div></div></div>
                        <div style={{ ...cardRowStyle, marginBottom: 0 }}><div style={iconContainerStyle}><Phone size={20} color="#64748b"/></div><div><div className="text-sm text-gray">Teléfono</div><div className="font-bold">{data.cliente_telefono || "No registrado"}</div></div></div>
                    </div>
                </div>
                {data.evidencia_entrega_url && <EvidenceCard url={data.evidencia_entrega_url} title="Evidencia de Recolección" />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '20px' }}>
                <div className="card custom-scroll" style={{ borderTop: '4px solid var(--color-brand-primary)', minHeight: '200px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxHeight: '60vh', overflowY: 'auto' }}>
                    {renderRightColumn()}
                </div>
            </div>
        </div>
    </div>
  );
};
export default WarrantyDetail;