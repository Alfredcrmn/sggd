const StatCard = ({ title, value, icon, color = "var(--color-brand-primary)" }) => {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div 
        style={{ 
          background: `${color}20`, // Color con 20% opacidad
          color: color,
          width: '50px', height: '50px', 
          borderRadius: '12px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem'
        }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm" style={{ fontWeight: 500 }}>{title}</p>
        <h3 style={{ fontSize: '1.75rem', marginTop: '2px' }}>{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;