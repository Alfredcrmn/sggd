import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthContext";

const ProcessDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // const { user } = useAuth(); // No lo usamos directamente aquí, pero está disponible si se requiere validación extra

  // Detectamos si es garantía o devolución desde la URL (?type=garantias)
  const tipoTabla = searchParams.get("type") || "garantias";
  const esGarantia = tipoTabla === "garantias";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        // 1. Definir dinámicamente qué columna de usuario buscar
        // Garantías usa 'recibido_por_id', Devoluciones usa 'solicitado_por_id'
        const userColumn = esGarantia ? "recibido_por_id" : "solicitado_por_id";

        // 2. Hacemos la consulta
        // Nota la sintaxis: perfiles:nombre_columna ( nombre_completo )
        const { data: record, error } = await supabase
          .from(tipoTabla)
          .select(`
            *,
            sucursales ( nombre, codigo_prefijo ),
            proveedores ( nombre ),
            perfiles:${userColumn} ( nombre_completo )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        // 3. Normalizamos el dato para usarlo fácil en el render
        // Guardamos el objeto del usuario en una propiedad común "usuario_responsable"
        const usuarioResponsable = record[userColumn];
        
        setData({ ...record, usuario_responsable: usuarioResponsable });

      } catch (error) {
        console.error("Error cargando detalle:", error);
        alert("No se pudo cargar el detalle del proceso: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, tipoTabla, esGarantia]);

  const handleCerrarProceso = async () => {
    const confirmar = window.confirm("¿Estás seguro de cerrar este proceso? Esto indica que ya fue resuelto.");
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from(tipoTabla)
        .update({ 
          estatus: 'cerrado',
          fecha_cierre: new Date() // Guardamos la fecha exacta del cierre
        })
        .eq('id', id);

      if (error) throw error;
      
      alert("Proceso cerrado exitosamente.");
      navigate("/processes"); // Volver a la lista para ver el cambio
    } catch (error) {
      alert("Error al cerrar: " + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando información...</div>;
  if (!data) return <div className="p-8 text-center">No se encontró el registro.</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* HEADER CON BOTÓN DE REGRESAR */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>
          ⬅️
        </button>
        <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>
                {data.folio}
            </h1>
            <span style={{ 
                background: data.estatus === 'activo' ? '#dbeafe' : '#f1f5f9',
                color: data.estatus === 'activo' ? '#1e40af' : '#475569',
                padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' 
            }}>
                {data.estatus?.toUpperCase()}
            </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* COLUMNA IZQUIERDA: DETALLES PRINCIPALES */}
        <div className="form-section">
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '1rem', color: '#64748b' }}>
                📦 Información del Equipo
            </h3>
            
            <DetailRow label="Producto" value={data.producto_nombre} />
            <DetailRow label="Modelo / Clave" value={data.producto_clave || "N/A"} />
            <DetailRow label="Proveedor" value={data.proveedores?.nombre} />
            <DetailRow label="Factura Original" value={`${data.factura_numero || 'S/N'} ($${data.factura_valor || 0})`} />
            <DetailRow label="Registrado por" value={data.usuario_responsable?.nombre_completo || "Desconocido"} />
            
            <div style={{ marginTop: '2rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    {esGarantia ? "📝 Descripción del Defecto & Cliente" : "📝 Razón de Devolución & Cliente"}
                </h4>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap', border: '1px solid #e2e8f0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {esGarantia ? data.defecto_descripcion : data.razon_devolucion}
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: META DATOS Y ACCIONES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="form-section">
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '1rem', color: '#64748b' }}>
                    📍 Ubicación y Fechas
                </h3>
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Sucursal Origen</div>
                    <div style={{ fontWeight: '600' }}>{data.sucursales?.nombre}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Fecha Registro</div>
                    <div style={{ fontWeight: '600' }}>{new Date(data.created_at).toLocaleString()}</div>
                </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            {data.estatus === 'activo' && (
                <div className="form-section" style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#64748b' }}>
                        ¿El proceso ha concluido?
                    </p>
                    <button 
                        onClick={handleCerrarProceso}
                        style={{ 
                            width: '100%', 
                            padding: '12px', 
                            background: '#10b981', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px', 
                            fontWeight: 'bold', 
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}>
                        ✅ Cerrar Caso
                    </button>
                </div>
            )}

            {data.estatus === 'cerrado' && (
                <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', textAlign: 'center' }}>
                    <strong>Caso Cerrado</strong><br/>
                    <small>Fecha: {data.fecha_cierre ? new Date(data.fecha_cierre).toLocaleDateString() : 'Fecha desconocida'}</small>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para filas de datos
const DetailRow = ({ label, value }) => (
    <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '1rem', color: '#334155', fontWeight: '500' }}>{value || "---"}</div>
    </div>
);

export default ProcessDetail;