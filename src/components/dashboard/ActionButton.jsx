import { Link } from "react-router-dom";

const ActionButton = ({ to, title, description, icon }) => {
  return (
    <Link to={to} className="card" style={{ textDecoration: 'none', borderColor: 'var(--color-brand-primary)' }}>
      <div style={{ color: 'var(--color-brand-primary)', fontSize: '2rem', marginBottom: '0.5rem' }}>
        {icon}
      </div>
      <h3 style={{ color: 'var(--color-brand-primary)' }}>{title}</h3>
      <p className="text-sm" style={{ marginTop: '0.5rem' }}>{description}</p>
    </Link>
  );
};

export default ActionButton;