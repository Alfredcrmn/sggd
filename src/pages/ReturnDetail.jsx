import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
// Shared Components
import ProcessHeader from "../components/shared/ProcessHeader";
import EvidenceCard from "../components/shared/EvidenceCard";
import Timeline from "../components/shared/Timeline";
// Actions
import VendorHandover from "../components/actions/VendorHandover";
import ProcessResolution from "../components/actions/ProcessResolution";
import AdminReview from "../components/actions/AdminReview";
// Icons
import { Archive, Hash, CreditCard, FileText, Store, MapPin, Truck, User, Phone, Eye, FileCheck } from "lucide-react";

const ReturnDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [viewStep, setViewStep] = useState(null);

  const fetchDetail = async () => {
    try {
      const { data: record, error } = await supabase
        .from('devoluciones')
        .select(`*, sucursales(nombre), proveedores(nombre), perfiles:solicitado_por_id(nombre_completo)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      setData(record);
      setViewStep(record.estatus);
    } catch (error) {
      console.error(error);
      navigate("/processes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const formatDate = (dateString) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return new Date(date.valueOf() + date.getTimezoneOffset() * 60000).toLocaleDateString('es-MX', {
          year: 'numeric', month: '2-digit', day: '2-digit'
      });
  };

  const formatCurrency = (amount) => {
      const num = parseFloat(amount);
      if (isNaN(num)) return "$0.00";
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
  };

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
        if (data.estatus === 'creado' || data.estatus === 'activo') return <VendorHandover table="devoluciones" id={id} onUpdate={fetchDetail} />;
        if (data.estatus === 'con_proveedor') return <ProcessResolution table="devoluciones" id={id} isGarantia={false} onUpdate={fetchDetail} />;
        if (data.estatus === 'pendiente_cierre') return <AdminReview table="devoluciones" id={id} currentStatus="pendiente_cierre" onUpdate={fetchDetail} />;
        if (data.estatus === 'cerrado') return (
            <div style={{ textAlign: 'center', background: '#f0fdf4', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                 <div style={{ color: '#15803d', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '5px' }}>Proceso Finalizado</div>
                <div style={{ fontSize: '0.9rem', color: '#166534' }}>Cerrado el: {formatDate(data.fecha_cierre)}</div>
            </div>
        );
        return null;
    }

    // 2. MODO HISTORIAL
    return (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.85rem', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                <Eye size={16} /> Historial: {viewStep.replace(/_/g, ' ')}
            </div>

            {/* A. ENTREGA PROVEEDOR */}
            {(viewStep === 'con_proveedor' || viewStep === 'pendiente_cierre' || viewStep === 'cerrado') && data.vendedor_nombre && (
                <div style={{ marginBottom: '2rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#b45309' }}>
                        <Truck size={18} /> <strong style={{ fontSize: '0.95rem' }}>Entrega a Proveedor</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#fff7ed', padding: '15px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                        <div><div style={detailLabelStyle}>Vendedor</div><div style={detailValueStyle}>{data.vendedor_nombre}</div></div>
                        <div><div style={detailLabelStyle}>Teléfono</div><div style={detailValueStyle}>{data.vendedor_telefono}</div></div>
                        <div style={{ gridColumn: 'span 2' }}><div style={detailLabelStyle}>Fecha Recolección</div><div style={detailValueStyle}>{formatDate(data.fecha_entrega_proveedor)}</div></div>
                    </div>
                </div>
            )}

            {/* B. RESOLUCIÓN (CORREGIDO: Incluye 'con_proveedor') */}
            {(viewStep === 'con_proveedor' || viewStep === 'pendiente_cierre' || viewStep === 'cerrado') && data.tipo_resolucion && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#0369a1' }}>
                        <FileCheck size={18} /> <strong style={{ fontSize: '0.95rem' }}>Resolución: {data.tipo_resolucion.replace(/_/g, ' ').toUpperCase()}</strong>
                    </div>
                    
                    <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                        <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #bae6fd' }}>
                            <div style={detailLabelStyle}>Fecha Reingreso Tienda</div>
                            <div style={detailValueStyle}>{formatDate(data.fecha_reingreso_tienda)}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            {data.tipo_resolucion === 'nota_credito' && (
                                <>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <div style={detailLabelStyle}>Valor Devuelto</div>
                                        <div style={{ ...detailValueStyle, color: '#15803d', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                            {formatCurrency(resData.valor_nota_credito || 0)}
                                        </div>
                                    </div>
                                    <div><div style={detailLabelStyle}>Folio NC</div><div style={detailValueStyle}>{resData.folio_nc || '-'}</div></div>
                                    <div><div style={detailLabelStyle}>Facturas Afect.</div><div style={detailValueStyle}>{resData.facturas_afectadas || '-'}</div></div>
                                    <div><div style={detailLabelStyle}>Notificado Por</div><div style={detailValueStyle}>{resData.persona_notifica || '-'}</div></div>
                                    <div><div style={detailLabelStyle}>Fecha Notif.</div><div style={detailValueStyle}>{formatDate(resData.fecha_notificacion)}</div></div>
                                </>
                            )}

                            {data.tipo_resolucion === 'cambio_fisico' && (
                                <div style={{ gridColumn: 'span 2' }}>
                                    <div style={detailLabelStyle}>Recibe en Sucursal</div>
                                    <div style={detailValueStyle}>{resData.persona_recibe || '-'}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <button onClick={() => setViewStep(data.estatus)} className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}>
                Volver a la etapa actual
            </button>
        </div>
    );
  };

  return (
    <div className="container" style={{ padding: '0 2rem 1rem 2rem' }}>
      <div style={{ paddingTop: '1rem' }}><ProcessHeader data={data} type="devolucion" /></div>
      <div style={{ marginBottom: '2rem', padding: '0 1rem' }}><Timeline currentStatus={data.estatus} type="devolucion" onStepClick={setViewStep} viewStep={viewStep} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
                    <Archive size={20} color="#64748b" /> Detalle del Producto
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
                    <div><label className="text-sm text-gray">Producto</label><div className="font-bold">{data.producto_nombre}</div></div>
                    <div><label className="text-sm text-gray">SKU</label><div className="flex gap-2 items-center"><Hash size={14}/> {data.producto_clave}</div></div>
                    <div><label className="text-sm text-gray">Valor</label><div className="flex gap-2 items-center"><CreditCard size={14}/> ${data.factura_valor}</div></div>
                </div>
                <div><label className="text-sm text-gray font-bold flex gap-2 items-center mb-2"><FileText size={14}/> MOTIVO DEVOLUCIÓN</label><p style={{ lineHeight: '1.6', color: '#334155' }}>{data.razon_devolucion}</p></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#64748b', display: 'flex', gap: '8px' }}><Store size={18}/> Origen</h3>
                    <div style={cardRowStyle}><div style={iconContainerStyle}><MapPin size={20} color="var(--color-brand-primary)"/></div><div><div className="text-sm text-gray">Sucursal</div><div className="font-bold">{data.sucursales?.nombre}</div></div></div>
                    <div style={{ ...cardRowStyle, marginBottom: 0 }}><div style={iconContainerStyle}><Truck size={20} color="var(--color-brand-primary)"/></div><div><div className="text-sm text-gray">Proveedor</div><div className="font-bold">{data.proveedores?.nombre}</div></div></div>
                </div>
                {data.vendedor_nombre && (
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#64748b', display: 'flex', gap: '8px' }}><User size={18}/> Vendedor / Rep.</h3>
                        <div style={cardRowStyle}><div style={iconContainerStyle}><User size={20} color="#64748b"/></div><div><div className="text-sm text-gray">Nombre</div><div className="font-bold">{data.vendedor_nombre}</div></div></div>
                        <div style={{ ...cardRowStyle, marginBottom: 0 }}><div style={iconContainerStyle}><Phone size={20} color="#64748b"/></div><div><div className="text-sm text-gray">Teléfono</div><div className="font-bold">{data.vendedor_telefono}</div></div></div>
                    </div>
                )}
            </div>
            {data.evidencia_entrega_url && <EvidenceCard url={data.evidencia_entrega_url} title="Evidencia de Recolección" />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '20px' }}>
            <div className="card" style={{ borderTop: '4px solid var(--color-brand-primary)', minHeight: '200px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>{renderRightColumn()}</div>
        </div>
      </div>
    </div>
  );
};
export default ReturnDetail;