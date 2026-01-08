import { useState } from "react";
import { supabase } from "../../supabase/client";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle2 } from "lucide-react";

const CustomerDelivery = ({ id, onUpdate }) => {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleDelivery = async () => {
    if (!window.confirm("¿Confirmar entrega? El caso pasará a revisión final.")) return;
    
    setLoading(true);
    try {
        const { error } = await supabase.from('garantias').update({
            fecha_entrega_cliente: date,
            estatus: 'pendiente_cierre', // <-- PENDIENTE DE CIERRE ADMIN
            entregado_cliente_por_id: user.id
        }).eq('id', id);

        if (error) throw error;
        alert("✅ Producto entregado. Pendiente de cierre administrativo.");
        onUpdate();
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#15803d', fontWeight: 'bold' }}>
            <CheckCircle2 size={20} /> Paso 4: Entrega al Cliente
        </div>
        <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Fecha de Entrega</label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <button onClick={handleDelivery} disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#16a34a', border: 'none' }}>
            {loading ? "Guardando..." : "Confirmar Entrega"}
        </button>
    </div>
  );
};
export default CustomerDelivery;