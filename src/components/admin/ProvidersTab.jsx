import { useState, useEffect } from "react";
import { supabase } from "../../supabase/client";
import { Truck, Trash2, Plus, Phone, Search, User, Building2, Save, Pencil, X, AlertTriangle } from "lucide-react";

const ProvidersTab = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selección y Edición
  const [selectedProv, setSelectedProv] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Creación (Modal)
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // ESTADO NUEVO (Sin teléfono general)
  const [newProv, setNewProv] = useState({ 
    nombre: "", 
    nombre_vendedor: "", 
    telefono_vendedor: "" 
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error("Error cargando proveedores:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- CREAR PROVEEDOR ---
  const handleCreate = async () => {
    if (!newProv.nombre.trim()) return alert("El nombre de la empresa es obligatorio.");
    
    setCreating(true);
    try {
      const { error } = await supabase.from('proveedores').insert([{ 
        nombre: newProv.nombre, 
        // Ya no enviamos teléfono general
        nombre_vendedor: newProv.nombre_vendedor,
        telefono_vendedor: newProv.telefono_vendedor
      }]);

      if (error) throw error;

      alert("✅ Proveedor agregado.");
      setNewProv({ nombre: "", nombre_vendedor: "", telefono_vendedor: "" });
      setShowCreateModal(false);
      fetchProviders();
    } catch (error) {
      alert("Error al crear: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  // --- EDITAR PROVEEDOR ---
  const startEditing = () => {
    setEditForm(selectedProv);
    setIsEditing(true);
  };

  const saveChanges = async () => {
    try {
      const { error } = await supabase
        .from('proveedores')
        .update({
            nombre: editForm.nombre,
            // Ya no actualizamos teléfono general
            nombre_vendedor: editForm.nombre_vendedor,
            telefono_vendedor: editForm.telefono_vendedor
        })
        .eq('id', selectedProv.id);

      if (error) throw error;
      
      alert("✅ Datos actualizados.");
      setIsEditing(false);
      fetchProviders();
      setSelectedProv(editForm);
    } catch (error) {
        alert("Error al actualizar: " + error.message);
    }
  };

  // --- ELIMINAR PROVEEDOR ---
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este proveedor?")) return;

    try {
      const { error } = await supabase.from('proveedores').delete().eq('id', id);

      if (error) {
        if (error.code === '23503') {
            alert("⚠️ No puedes eliminar este proveedor porque tiene historial activo.");
        } else {
            throw error;
        }
      } else {
        alert("🗑️ Proveedor eliminado.");
        setSelectedProv(null);
        fetchProviders();
      }
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  };

  const filteredProviders = providers.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.nombre_vendedor && p.nombre_vendedor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Estilos auxiliares
  const labelStyle = { fontSize: '0.85rem', color: '#64748b', marginBottom: '4px', fontWeight: '600', display:'block' };
  const detailValueStyle = { fontSize: '1rem', color: '#334155', fontWeight: '500' };

  if (loading) return <div className="p-4">Cargando catálogo...</div>;

  return (
    <div style={{ position: 'relative', minHeight: '60vh' }}>
      
      {/* BARRA SUPERIOR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input 
                type="text" 
                placeholder="Buscar por empresa o vendedor..." 
                className="form-input" 
                style={{ paddingLeft: '2.2rem' }} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={18} /> Nuevo Proveedor
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* LISTA DE PROVEEDORES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '600px', overflowY: 'auto' }}>
            {filteredProviders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No se encontraron proveedores.</div>
            ) : (
                filteredProviders.map(prov => (
                    <div 
                        key={prov.id} 
                        onClick={() => { setSelectedProv(prov); setIsEditing(false); }}
                        className="card"
                        style={{ 
                            cursor: 'pointer', padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px',
                            border: selectedProv?.id === prov.id ? '2px solid var(--color-brand-primary)' : '1px solid #e2e8f0', 
                            background: selectedProv?.id === prov.id ? '#fff7ed' : 'white'
                        }}
                    >
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Truck size={20} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', color: '#334155' }}>{prov.nombre}</div>
                            {prov.nombre_vendedor && (
                                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <User size={12}/> {prov.nombre_vendedor}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* DETALLES / EDICIÓN */}
        <div>
            {!selectedProv ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                    <Building2 size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                    <p>Selecciona un proveedor para ver sus detalles.</p>
                </div>
            ) : (
                <div className="card">
                    {/* CABECERA */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {selectedProv.nombre}
                            </h2>
                            <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>ID: {selectedProv.id}</div>
                        </div>
                        {!isEditing && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleDelete(selectedProv.id)} className="btn" style={{ color: '#ef4444', border: '1px solid #fecaca', background: '#fef2f2' }} title="Eliminar">
                                    <Trash2 size={18} />
                                </button>
                                <button onClick={startEditing} className="btn btn-secondary">
                                    <Pencil size={18} /> Editar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* VISTA LECTURA */}
                    {!isEditing ? (
                        <div style={{ display: 'grid', gap: '2rem' }}>
                            {/* BLOQUE VENDEDOR */}
                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '1rem', paddingBottom: '5px', borderBottom: '1px solid #e2e8f0' }}>Contacto del Vendedor</h4>
                                {(!selectedProv.nombre_vendedor && !selectedProv.telefono_vendedor) ? (
                                    <div style={{ fontStyle: 'italic', color: '#cbd5e1' }}>No hay información del representante.</div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <span style={labelStyle}>Nombre Representante</span>
                                            <div style={{...detailValueStyle, display:'flex', alignItems:'center', gap:'6px'}}>
                                                <User size={16} color="#64748b"/> {selectedProv.nombre_vendedor || "-"}
                                            </div>
                                        </div>
                                        <div>
                                            <span style={labelStyle}>Teléfono Directo</span>
                                            <div style={{...detailValueStyle, display:'flex', alignItems:'center', gap:'6px'}}>
                                                <Phone size={16} color="#64748b"/> {selectedProv.telefono_vendedor || "-"}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // MODO EDICIÓN
                        <div className="animate-fade-in">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div>
                                    <label className="form-label">Nombre Empresa</label>
                                    <input type="text" className="form-input" value={editForm.nombre} onChange={e => setEditForm({...editForm, nombre: e.target.value})} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label className="form-label">Nombre Vendedor</label>
                                        <input type="text" className="form-input" placeholder="Ej. Roberto Gómez" value={editForm.nombre_vendedor || ""} onChange={e => setEditForm({...editForm, nombre_vendedor: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="form-label">Teléfono Vendedor</label>
                                        <input type="text" className="form-input" placeholder="Celular directo" value={editForm.telefono_vendedor || ""} onChange={e => setEditForm({...editForm, telefono_vendedor: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancelar</button>
                                <button onClick={saveChanges} className="btn btn-primary"><Save size={18}/> Guardar Cambios</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* MODAL CREAR NUEVO */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
            <div className="card" style={{ width: '500px', position: 'relative' }}>
                <button onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}> <X size={24} /> </button>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}> 
                    <Plus size={24} color="var(--color-brand-primary)" /> Nuevo Proveedor 
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Sección Empresa */}
                    <div>
                        <label className="form-label">Nombre Empresa *</label>
                        <input type="text" className="form-input" placeholder="Ej. Truper" value={newProv.nombre} onChange={e => setNewProv({...newProv, nombre: e.target.value})} />
                    </div>

                    {/* Sección Vendedor */}
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '10px', textTransform:'uppercase' }}>Contacto del Vendedor</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label className="form-label">Nombre</label>
                                <input type="text" className="form-input" placeholder="Ej. Juan Pérez" value={newProv.nombre_vendedor} onChange={e => setNewProv({...newProv, nombre_vendedor: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Teléfono Directo</label>
                                <input type="text" className="form-input" placeholder="Celular" value={newProv.telefono_vendedor} onChange={e => setNewProv({...newProv, telefono_vendedor: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <button onClick={handleCreate} disabled={creating} className="btn btn-primary" style={{ justifyContent: 'center' }}> 
                        {creating ? "Guardando..." : "Crear Proveedor"} 
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ProvidersTab;