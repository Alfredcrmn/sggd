import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom"; 
import { 
  Users, History, Building2, UserCog, Lock, Search, Pencil, Save, Briefcase, UserPlus, X, Truck
} from "lucide-react";

import ProvidersTab from "../components/admin/ProvidersTab";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');

  const [users, setUsers] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState({ garantias: [], devoluciones: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newUser, setNewUser] = useState({
    nombre_completo: "",
    username: "", 
    password: "",
    rol: "cajero", 
    sucursal_id: ""
  });
  const [creating, setCreating] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAdminAccess = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            navigate("/login");
            return;
        }

        const { data: perfil, error } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', user.id)
            .single();

        if (error || !perfil || perfil.rol !== 'admin') {
            console.warn("Acceso denegado: Usuario no es administrador.");
            navigate("/"); 
            return;
        }

        fetchUsersAndBranches();
    };

    verifyAdminAccess();
  }, [navigate]);

  const fetchUsersAndBranches = async () => {
    try {
      const { data: usersData } = await supabase.from('perfiles').select(`*, sucursales ( nombre )`).order('nombre_completo');
      const { data: branchData } = await supabase.from('sucursales').select('*');
      if (usersData) setUsers(usersData);
      if (branchData) setSucursales(branchData);
    } catch (error) { console.error("Error:", error); } finally { setLoading(false); }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setIsEditing(false);
    setEditForm({});
    setLoadingHistory(true);
    try {
      const { data: g } = await supabase.from('garantias').select('id, folio, producto_nombre, created_at, estatus').or(`recibido_por_id.eq.${user.id},cerrado_por_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(10);
      const { data: d } = await supabase.from('devoluciones').select('id, folio, producto_nombre, created_at, estatus').or(`solicitado_por_id.eq.${user.id},cerrado_por_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(10);
      setUserHistory({ garantias: g || [], devoluciones: d || [] });
    } catch (error) { console.error(error); } finally { setLoadingHistory(false); }
  };

  const startEditing = () => {
    setEditForm({ rol: selectedUser.rol, sucursal_id: selectedUser.sucursal_id });
    setIsEditing(true);
  };

  const saveChanges = async () => {
    try {
      const { error } = await supabase.from('perfiles').update({ rol: editForm.rol, sucursal_id: editForm.sucursal_id }).eq('id', selectedUser.id);
      if (error) throw error;
      fetchUsersAndBranches();
      setIsEditing(false);
      alert("✅ Perfil actualizado correctamente");
    } catch (error) { alert("Error al actualizar: " + error.message); }
  };

  const handleManualReset = async () => {
    const newPassword = prompt(`Ingresa la nueva contraseña para ${selectedUser.nombre_completo}:`);
    if (!newPassword || newPassword.length < 6) return alert("Mínimo 6 caracteres.");
    try {
        const { error } = await supabase.rpc('admin_reset_password', { target_user_id: selectedUser.id, new_password: newPassword });
        if (error) throw error;
        alert(`Contraseña actualizada.`);
    } catch (error) { alert("Error: " + error.message); }
  };

  const openCreateModal = () => {
    setNewUser({ nombre_completo: "", username: "", password: "", rol: "cajero", sucursal_id: "" });
    setShowCreateModal(true);
  };

  const handleCreateUser = async () => {
    if (!newUser.nombre_completo || !newUser.username || !newUser.password) return alert("Completa todos los campos.");
    if (newUser.password.length < 6) return alert("Contraseña debe tener al menos 6 caracteres.");

    const cleanUsername = newUser.username.trim().toLowerCase().replace(/\s+/g, '');
    const finalEmail = `${cleanUsername}@ferretodo.local`;

    let finalRole = newUser.rol;
    if (finalRole !== 'admin' && finalRole !== 'cajero') finalRole = 'cajero';

    let finalSucursal = null;
    if (newUser.sucursal_id && newUser.sucursal_id !== "") finalSucursal = parseInt(newUser.sucursal_id, 10);

    setCreating(true);
    try {
        const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { 
                persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'temp_admin_key'
            }
        });

        const { data: authData, error: authError } = await tempClient.auth.signUp({
            email: finalEmail, password: newUser.password,
            options: { data: { nombre_completo: newUser.nombre_completo, username: cleanUsername } }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("No se pudo crear el usuario.");

        const newUserId = authData.user.id;
        await supabase.rpc('admin_confirm_user', { target_user_id: newUserId });

        const { error: profileError } = await supabase.from('perfiles').insert({
            id: newUserId, nombre_completo: newUser.nombre_completo, username: cleanUsername, rol: finalRole, sucursal_id: finalSucursal
        });

        if (profileError) throw new Error("Usuario Auth creado, pero falló el Perfil: " + profileError.message);

        alert(`✅ Usuario creado exitosamente: ${cleanUsername}`);
        setShowCreateModal(false);
        fetchUsersAndBranches();

    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    } finally {
        setCreating(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

const tabBtnStyle = (tabName) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    // Eliminamos el duplicado que estaba aquí
    color: activeTab === tabName ? 'var(--color-brand-primary)' : '#64748b',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'none', 
    border: 'none', // Reseteamos bordes generales
    // Definimos el borde inferior UNA sola vez aquí:
    borderBottom: activeTab === tabName ? '2px solid var(--color-brand-primary)' : '2px solid transparent'
  });

  if (loading) return <div className="p-8">Verificando acceso...</div>;

  return (
    <div style={{ width: '100%', padding: '0 1rem', paddingBottom: '3rem', position: 'relative' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}> <Users size={28} color="#475569" /> </div>
            <div> <h1 style={{ fontSize: '1.5rem' }}>Panel de Administración</h1> <p className="text-sm">Gestión del sistema.</p> </div>
          </div>
          {/* Eliminamos el botón de aquí para bajarlo */}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <button onClick={() => setActiveTab('users')} style={tabBtnStyle('users')}>
            <Users size={18} /> Empleados
          </button>
          <button onClick={() => setActiveTab('providers')} style={tabBtnStyle('providers')}>
            <Truck size={18} /> Proveedores
          </button>
      </div>

      {/* === PESTAÑA USUARIOS === */}
      {activeTab === 'users' && (
        <>
            {/* BARRA DE HERRAMIENTAS (Igual que en ProvidersTab) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '300px' }}>
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
                <button onClick={openCreateModal} className="btn btn-primary">
                    <UserPlus size={18} /> Nuevo Usuario
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
                {/* COLUMNA IZQUIERDA: LISTA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Quitamos el card del buscador que estaba aquí */}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
                        {filteredUsers.map((u) => (
                            <div key={u.id} onClick={() => handleSelectUser(u)} className="card"
                                style={{ cursor: 'pointer', border: selectedUser?.id === u.id ? '2px solid var(--color-brand-primary)' : '1px solid #e2e8f0', background: selectedUser?.id === u.id ? '#fff7ed' : 'white', transition: 'all 0.2s', padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: selectedUser?.id === u.id ? 'var(--color-brand-primary)' : '#e2e8f0', color: selectedUser?.id === u.id ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}> <UserCog size={20} /> </div>
                                <div style={{ overflow: 'hidden', flex: 1 }}> <div style={{ fontWeight: '700', color: 'var(--color-dark-bg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nombre_completo}</div> <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}> <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 'bold' }}>{u.rol}</span> {u.sucursales?.nombre && <span>• {u.sucursales.nombre}</span>} </div> </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLUMNA DERECHA: DETALLES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ minHeight: '200px' }}>
                        {!selectedUser ? ( <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}> <History size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} /> <p>Selecciona un empleado de la lista para ver detalles.</p> </div> ) : (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                                    <div> <h2 style={{ fontSize: '1.5rem', color: 'var(--color-dark-bg)', marginBottom: '4px' }}>{selectedUser.nombre_completo}</h2> <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{selectedUser.email || selectedUser.username}</p> </div>
                                    {!isEditing && ( <button onClick={startEditing} className="btn btn-secondary"> <Pencil size={16} /> Editar Perfil </button> )}
                                </div>
                                {!isEditing ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                        <div> <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Rol Asignado</label> <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '500' }}> <Briefcase size={18} color="var(--color-brand-primary)" /> <span style={{ textTransform: 'capitalize' }}>{selectedUser.rol}</span> </div> </div>
                                        <div> <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Sucursal</label> <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '500' }}> <Building2 size={18} color="var(--color-brand-primary)" /> <span>{selectedUser.sucursales?.nombre || "Sin Asignar"}</span> </div> </div>
                                    </div>
                                ) : (
                                    <div style={{ background: '#fff7ed', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                            <div> <label className="form-label">Rol</label> <select className="form-select" value={editForm.rol} onChange={(e) => setEditForm({...editForm, rol: e.target.value})}> <option value="cajero">Cajero</option> <option value="admin">Admin</option> </select> </div>
                                            <div> <label className="form-label">Sucursal</label> <select className="form-select" value={editForm.sucursal_id || ""} onChange={(e) => setEditForm({...editForm, sucursal_id: e.target.value})}> <option value="">Sin Asignar</option> {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)} </select> </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <button onClick={handleManualReset} className="btn" style={{ background: 'white', border: '1px solid #fda4af', color: '#be123c' }}> <Lock size={16} /> Cambiar Contraseña </button>
                                            <div style={{ display: 'flex', gap: '10px' }}> <button onClick={() => setIsEditing(false)} className="btn btn-secondary"> Cancelar </button> <button onClick={saveChanges} className="btn btn-primary"> <Save size={16} /> Guardar Cambios </button> </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {selectedUser && ( <div className="card"> <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}> <History size={20} color="#64748b" /> Historial Reciente </h3> 
                            {userHistory.garantias.length === 0 && userHistory.devoluciones.length === 0 ? <div className="text-sm text-gray-400">Sin registros recientes.</div> : <div><div style={{marginBottom:'10px', fontWeight:'bold', fontSize:'0.8rem', color:'#94a3b8'}}>MOVIMIENTOS</div> <div className="text-sm">Se encontraron {userHistory.garantias.length} garantías y {userHistory.devoluciones.length} devoluciones.</div></div>}
                    </div> )}
                </div>
            </div>
        </>
      )}

      {/* === PESTAÑA PROVEEDORES === */}
      {activeTab === 'providers' && (
          <ProvidersTab />
      )}

      {/* MODAL DE CREAR USUARIO (Se mantiene igual) */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
            <div className="card" style={{ width: '450px', position: 'relative' }}>
                <button onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}> <X size={24} /> </button>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}> <UserPlus size={24} color="var(--color-brand-primary)" /> Nuevo Usuario </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div> <label className="form-label">Nombre Completo</label> <input type="text" className="form-input" placeholder="Ej. Juan Pérez" value={newUser.nombre_completo} onChange={(e) => setNewUser({...newUser, nombre_completo: e.target.value})} /> </div>
                    <div> <label className="form-label">Usuario</label> <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> <input type="text" className="form-input" placeholder="juan.perez" style={{ flex: 1 }} value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} /> <span style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>@ferretodo.local</span> </div> </div>
                    <div> <label className="form-label">Contraseña</label> <input type="password" className="form-input" placeholder="Mínimo 6 caracteres" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} /> </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div> <label className="form-label">Rol</label> <select className="form-select" value={newUser.rol} onChange={(e) => setNewUser({...newUser, rol: e.target.value})}> <option value="cajero">Cajero</option> <option value="admin">Admin</option> </select> </div>
                        <div> <label className="form-label">Sucursal</label> <select className="form-select" value={newUser.sucursal_id} onChange={(e) => setNewUser({...newUser, sucursal_id: e.target.value})}> <option value="">Seleccionar...</option> {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)} </select> </div>
                    </div>
                    <button onClick={handleCreateUser} disabled={creating} className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }}> {creating ? "Creando..." : "Crear Usuario"} </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;