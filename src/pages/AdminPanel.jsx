import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { 
  Users, 
  History, 
  ShieldCheck, 
  Building2, 
  UserCog, 
  Lock, 
  Search, 
  RotateCcw,
  Pencil,
  Save,
  X,
  Briefcase
} from "lucide-react";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado para el empleado seleccionado
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState({ garantias: [], devoluciones: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- NUEVO: ESTADO DE EDICIÓN ---
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({}); // Datos temporales mientras editas

  useEffect(() => {
    fetchUsersAndBranches();
  }, []);

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
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setIsEditing(false); // Reseteamos modo edición al cambiar de usuario
    setEditForm({});     // Limpiamos formulario temporal
    
    setLoadingHistory(true);
    try {
      const { data: garantias } = await supabase
        .from('garantias')
        .select('id, folio, producto_nombre, created_at, estatus')
        .or(`recibido_por_id.eq.${user.id},cerrado_por_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: devoluciones } = await supabase
        .from('devoluciones')
        .select('id, folio, producto_nombre, created_at, estatus')
        .or(`solicitado_por_id.eq.${user.id},cerrado_por_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      setUserHistory({ garantias: garantias || [], devoluciones: devoluciones || [] });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Activar modo edición
  const startEditing = () => {
    setEditForm({
      rol: selectedUser.rol,
      sucursal_id: selectedUser.sucursal_id
    });
    setIsEditing(true);
  };

  // Guardar cambios en la BD
  const saveChanges = async () => {
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ 
            rol: editForm.rol, 
            sucursal_id: editForm.sucursal_id 
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Actualizar estado local (Lista de usuarios)
      const updatedList = users.map(u => {
        if (u.id === selectedUser.id) {
            // Encontrar el nombre de la nueva sucursal para actualizar la UI sin recargar
            const newBranchName = sucursales.find(s => s.id == editForm.sucursal_id)?.nombre;
            return { 
                ...u, 
                rol: editForm.rol, 
                sucursal_id: editForm.sucursal_id,
                sucursales: { nombre: newBranchName }
            };
        }
        return u;
      });

      setUsers(updatedList);
      
      // Actualizar usuario seleccionado
      const newBranchName = sucursales.find(s => s.id == editForm.sucursal_id)?.nombre;
      setSelectedUser({
          ...selectedUser,
          rol: editForm.rol,
          sucursal_id: editForm.sucursal_id,
          sucursales: { nombre: newBranchName }
      });

      setIsEditing(false);
      alert("✅ Perfil actualizado correctamente");

    } catch (error) {
      alert("Error al actualizar: " + error.message);
    }
  };

  const handleManualReset = async () => {
    const newPassword = prompt(`Ingresa la nueva contraseña para ${selectedUser.nombre_completo}:`);
    if (!newPassword || newPassword.trim() === "") return;
    if (newPassword.length < 6) return alert("La contraseña debe contener mínimo 6 caracteres.");

    try {
        const { error } = await supabase.rpc('admin_reset_password', {
            target_user_id: selectedUser.id,
            new_password: newPassword
        });
        if (error) throw error;
        alert(`Contraseña actualizada.`);
    } catch (error) {
        alert("Error: " + error.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    if (status === 'cerrado') return 'badge-closed';
    return 'badge-active';
  };

  if (loading) return <div className="p-8">Cargando panel...</div>;

  return (
    <div style={{ width: '100%', padding: '0 1rem', paddingBottom: '3rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}>
            <Users size={28} color="#475569" />
        </div>
        <div>
            <h1 style={{ fontSize: '1.5rem' }}>Panel de Administración</h1>
            <p className="text-sm">Gestión de roles, sucursales y accesos.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA: DIRECTORIO (SOLO LECTURA) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div className="card" style={{ padding: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar empleado..." 
                        className="form-input" 
                        style={{ paddingLeft: '2.2rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredUsers.map((u) => (
                    <div 
                        key={u.id} 
                        onClick={() => handleSelectUser(u)}
                        className="card"
                        style={{ 
                            cursor: 'pointer',
                            border: selectedUser?.id === u.id ? '2px solid var(--color-brand-primary)' : '1px solid #e2e8f0',
                            background: selectedUser?.id === u.id ? '#fff7ed' : 'white',
                            transition: 'all 0.2s',
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}
                    >
                        <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', 
                            background: selectedUser?.id === u.id ? 'var(--color-brand-primary)' : '#e2e8f0',
                            color: selectedUser?.id === u.id ? 'white' : '#64748b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <UserCog size={20} />
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div style={{ fontWeight: '700', color: 'var(--color-dark-bg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nombre_completo}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 'bold' }}>{u.rol}</span>
                                {u.sucursales?.nombre && <span>• {u.sucursales.nombre}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* COLUMNA DERECHA: PERFIL Y DETALLES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* TARJETA DE PERFIL (SUPERIOR) */}
            <div className="card" style={{ minHeight: '200px' }}>
                {!selectedUser ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <History size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                        <p>Selecciona un empleado de la lista para ver detalles.</p>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', color: 'var(--color-dark-bg)', marginBottom: '4px' }}>{selectedUser.nombre_completo}</h2>
                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{selectedUser.email || selectedUser.username}</p>
                            </div>
                            
                            {/* BOTÓN TOGGLE EDICIÓN */}
                            {!isEditing && (
                                <button onClick={startEditing} className="btn btn-secondary">
                                    <Pencil size={16} /> Editar Perfil
                                </button>
                            )}
                        </div>

                        {/* MODO VISUALIZACIÓN */}
                        {!isEditing ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Rol Asignado</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '500' }}>
                                        <Briefcase size={18} color="var(--color-brand-primary)" />
                                        <span style={{ textTransform: 'capitalize' }}>{selectedUser.rol}</span>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Sucursal</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '500' }}>
                                        <Building2 size={18} color="var(--color-brand-primary)" />
                                        <span>{selectedUser.sucursales?.nombre || "Sin Asignar"}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* MODO EDICIÓN */
                            <div style={{ background: '#fff7ed', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label className="form-label">Rol</label>
                                        <select 
                                            className="form-select" 
                                            value={editForm.rol}
                                            onChange={(e) => setEditForm({...editForm, rol: e.target.value})}
                                        >
                                            <option value="vendedor">Vendedor</option>
                                            <option value="cajero">Cajero</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Sucursal</label>
                                        <select 
                                            className="form-select"
                                            value={editForm.sucursal_id || ""}
                                            onChange={(e) => setEditForm({...editForm, sucursal_id: e.target.value})}
                                        >
                                            <option value="">Sin Asignar</option>
                                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button 
                                        onClick={handleManualReset}
                                        className="btn" 
                                        style={{ background: 'white', border: '1px solid #fda4af', color: '#be123c' }}
                                    >
                                        <Lock size={16} /> Cambiar Contraseña
                                    </button>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                                            Cancelar
                                        </button>
                                        <button onClick={saveChanges} className="btn btn-primary">
                                            <Save size={16} /> Guardar Cambios
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* TARJETA DE HISTORIAL (INFERIOR) */}
            {selectedUser && (
                <div className="card">
                     <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <History size={20} color="#64748b" /> Historial Reciente
                     </h3>
                     
                     {loadingHistory ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando actividad...</div>
                     ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                             {/* Garantías */}
                             <div>
                                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '10px', fontWeight: 'bold' }}>Garantías Gestionadas</h4>
                                {userHistory.garantias.length === 0 ? <div className="text-sm text-gray-400">Sin registros.</div> : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {userHistory.garantias.map(g => (
                                            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{g.folio}</span>
                                                <span className={`badge ${getStatusColor(g.estatus)}`}>{g.estatus}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                             </div>

                             {/* Devoluciones */}
                             <div>
                                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '10px', fontWeight: 'bold' }}>Devoluciones Gestionadas</h4>
                                {userHistory.devoluciones.length === 0 ? <div className="text-sm text-gray-400">Sin registros.</div> : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {userHistory.devoluciones.map(d => (
                                            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{d.folio}</span>
                                                <span className={`badge ${getStatusColor(d.estatus)}`}>{d.estatus}</span>
                                            </div>
                                        ))}
                                    </div>
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