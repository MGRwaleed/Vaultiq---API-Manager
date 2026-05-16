import './StatCard.css';

export default function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className={`stat-card ${accent ? `stat-card--${accent}` : ''}`}>
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        {Icon && (
          <span className="stat-icon">
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className="stat-value">{value ?? '—'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
