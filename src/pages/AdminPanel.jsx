import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el empleado seleccionado (Historial)
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState({ garantias: [], devoluciones: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchUsersAndBranches();
  }, []);

  // Cargar lista de empleados y sucursales
  const fetchUsersAndBranches = async () => {
    try {
      const { data: usersData } = await supabase
        .from('perfiles')
        .select(`*, sucursales ( nombre )`)
        .order('nombre_completo');
      
      const { data: branchData } = await supabase.from('sucursales').select('*');

      if (usersData) setUsers(usersData);
      if (branchData) setSucursales(branchData);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar historial de un empleado específico
  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setLoadingHistory(true);
    try {
      // Buscar garantías
      const { data: garantias } = await supabase
        .from('garantias')
        .select('id, folio, producto_nombre, created_at, estatus, tipo_resolucion')
        .or(`recibido_por_id.eq.${user.id},cerrado_por_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      // Buscar devoluciones
      const { data: devoluciones } = await supabase
        .from('devoluciones')
        .select('id, folio, producto_nombre, created_at, estatus, tipo_resolucion')
        .or(`solicitado_por_id.eq.${user.id},cerrado_por_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      setUserHistory({ garantias: garantias || [], devoluciones: devoluciones || [] });
    } catch (error) {
      console.error("Error historial:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Actualizar Rol o Sucursal
  const handleUpdateUser = async (userId, field, value) => {
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ [field]: value })
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
      alert("Usuario actualizado correctamente");
    } catch (error) {
      alert("Error al actualizar: " + error.message);
    }
  };

  // 👇 AQUÍ ESTÁ LA FUNCIÓN FALTANTE: CAMBIO DE CONTRASEÑA MANUAL
  const handleManualReset = async (userId, userName) => {
    const newPassword = prompt(`Ingresa la nueva contraseña temporal para ${userName}:`);
    
    if (!newPassword || newPassword.trim() === "") return;
    if (newPassword.length < 6) return alert("⚠️ La contraseña debe tener al menos 6 caracteres.");

    try {
        // Llamada a la función SQL que creamos en el Paso 1
        const { error } = await supabase.rpc('admin_reset_password', {
            target_user_id: userId,
            new_password: newPassword
        });
        
        if (error) throw error;
        
        alert(`✅ Contraseña actualizada correctamente para ${userName}.\nNueva clave: ${newPassword}`);
    } catch (error) {
        console.error(error);
        alert("Error al actualizar: " + error.message);
    }
  };

  if (loading) return <div className="p-8">Cargando panel...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem' }}>⚙️ Panel de Administrador</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* COLUMNA IZQUIERDA: LISTA DE EMPLEADOS */}
        <div>
          <h2 style={{ marginBottom: '1rem', color: '#475569' }}>👥 Gestión de Empleados</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {users.map((u) => (
              <div 
                key={u.id} 
                onClick={() => handleSelectUser(u)}
                style={{ 
                  padding: '1rem', 
                  border: selectedUser?.id === u.id ? '2px solid var(--color-brand-primary)' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: selectedUser?.id === u.id ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <strong>{u.nombre_completo}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.username}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '10px' }}>{u.email || "Sin Email"}</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                  {/* Selector de ROL */}
                  <div>
                    <label style={{fontSize: '0.7rem', color: '#94a3b8', display: 'block'}}>Rol</label>
                    <select 
                      value={u.rol} 
                      onChange={(e) => handleUpdateUser(u.id, 'rol', e.target.value)}
                      className="form-select" 
                      style={{ fontSize: '0.85rem', padding: '6px', width: '100%' }}
                    >
                      <option value="vendedor">Vendedor</option>
                      <option value="cajero">Cajero</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Selector de SUCURSAL */}
                  <div>
                    <label style={{fontSize: '0.7rem', color: '#94a3b8', display: 'block'}}>Sucursal</label>
                    <select 
                      value={u.sucursal_id || ""} 
                      onChange={(e) => handleUpdateUser(u.id, 'sucursal_id', e.target.value)}
                      className="form-select"
                      style={{ fontSize: '0.85rem', padding: '6px', width: '100%' }}
                    >
                      <option value="">Sin Sucursal</option>
                      {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </div>
                </div>

                {/* 👇 AQUÍ ESTÁ EL BOTÓN DE CAMBIO DE CONTRASEÑA */}
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={() => handleManualReset(u.id, u.nombre_completo)}
                        style={{ 
                            width: '100%', 
                            background: '#fff1f2', 
                            border: '1px solid #fda4af', 
                            color: '#be123c', 
                            fontSize: '0.8rem', 
                            padding: '8px', 
                            borderRadius: '4px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '5px',
                            fontWeight: '600'
                        }}
                    >
                        🔐 Cambiar Contraseña
                    </button>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', height: 'fit-content', border: '1px solid #e2e8f0' }}>
          {!selectedUser ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>
              👈 Selecciona un empleado para ver su actividad.
            </div>
          ) : (
            <div>
              <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '1rem', color: '#1e293b' }}>
                Historial: <span style={{color: 'var(--color-brand-primary)'}}>{selectedUser.nombre_completo}</span>
              </h3>
              
              {loadingHistory ? (
                <div style={{textAlign: 'center', padding: '20px'}}>Cargando historial...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      🛡️ Últimas Garantías <span style={{background: '#e2e8f0', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem'}}>{(userHistory.garantias || []).length}</span>
                    </h4>
                    {userHistory.garantias.length === 0 ? <small style={{color: '#cbd5e1'}}>Sin actividad reciente.</small> : (
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {userHistory.garantias.map(g => (
                          <li key={g.id} style={{ marginBottom: '8px', padding: '10px', background: 'white', borderRadius: '6px', fontSize: '0.85rem', borderLeft: g.estatus === 'cerrado' ? '4px solid #10b981' : '4px solid #f59e0b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontWeight: 'bold', color: '#334155' }}>{g.folio}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0' }}>{g.producto_nombre}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.75rem' }}>
                               <span style={{color: '#94a3b8'}}>{new Date(g.created_at).toLocaleDateString()}</span>
                               <span style={{ fontWeight: 'bold', color: g.estatus === 'cerrado' ? '#10b981' : '#f59e0b'}}>{g.estatus.toUpperCase()}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      ↩️ Últimas Devoluciones <span style={{background: '#e2e8f0', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem'}}>{(userHistory.devoluciones || []).length}</span>
                    </h4>
                    {userHistory.devoluciones.length === 0 ? <small style={{color: '#cbd5e1'}}>Sin actividad reciente.</small> : (
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {userHistory.devoluciones.map(d => (
                          <li key={d.id} style={{ marginBottom: '8px', padding: '10px', background: 'white', borderRadius: '6px', fontSize: '0.85rem', borderLeft: d.estatus === 'cerrado' ? '4px solid #10b981' : '4px solid #f59e0b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontWeight: 'bold', color: '#334155' }}>{d.folio}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0' }}>{d.producto_nombre}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.75rem' }}>
                               <span style={{color: '#94a3b8'}}>{new Date(d.created_at).toLocaleDateString()}</span>
                               <span style={{ fontWeight: 'bold', color: d.estatus === 'cerrado' ? '#10b981' : '#f59e0b'}}>{d.estatus.toUpperCase()}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
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

export default AdminPanel;