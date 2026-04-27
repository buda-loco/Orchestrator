import React from 'react';

interface CVHeaderProps {
  name: string;
  role: string;
  targetJobTitle: string;
  location: string;
  email: string;
}

export const CVHeader: React.FC<CVHeaderProps> = ({ name, role, targetJobTitle, location, email }) => {
  return (
    <header style={{ borderBottom: '2px solid #000', paddingBottom: 'var(--sp-6)', marginBottom: 'var(--sp-8)' }}>
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        {/* System Persona Tag - Class added for hiding in export */}
        <span className="cv-label cv-persona-tag" style={{ backgroundColor: '#000', color: '#FFF', padding: '4px 12px', display: 'inline-block', marginBottom: 'var(--sp-3)', fontWeight: '900' }}>
          Lens: {role}
        </span>
        <h1 className="cv-name" style={{ fontSize: '3rem', lineHeight: '0.9', marginBottom: 'var(--sp-2)' }}>{name}</h1>
        <div style={{ fontSize: '1.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {targetJobTitle}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-6)', borderTop: '1px solid var(--rule)', paddingTop: 'var(--sp-3)' }}>
        <div className="cv-meta-item">
          <span className="cv-label">Based In</span>
          <span className="cv-item-title" style={{ fontSize: '0.85rem' }}>{location}</span>
        </div>
        <div className="cv-meta-item">
          <span className="cv-label">Contact</span>
          <span className="cv-item-title" style={{ fontSize: '0.85rem' }}>{email}</span>
        </div>
      </div>
    </header>
  );
};

interface CVSectionProps {
  kicker: string;
  title: string;
  children: React.ReactNode;
}

export const CVSection: React.FC<CVSectionProps> = ({ kicker, title, children }) => {
  return (
    <section className="cv-section">
      <span className="cv-label">{kicker}</span>
      <h2 className="cv-section-title">{title}</h2>
      <div className="cv-section-divider" />
      <div>{children}</div>
    </section>
  );
};

interface CVEntryProps {
  period: string;
  role: string;
  org: string;
  children: React.ReactNode;
}

export const CVEntry: React.FC<CVEntryProps> = ({ period, role, org, children }) => {
  return (
    <div className="cv-entry" style={{ gridTemplateColumns: '1fr' }}>
      <div className="cv-entry-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 className="cv-item-title" style={{ fontSize: '1.25rem' }}>{role}</h3>
          <span className="cv-label cv-muted" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>{period}</span>
        </div>
        <span className="cv-label" style={{ fontWeight: '700', marginTop: '-4px' }}>{org}</span>
        <div className="cv-body">{children}</div>
      </div>
    </div>
  );
};

interface CVPillListProps {
  kicker: string;
  items: (string | React.ReactNode)[];
}

export const CVPillList: React.FC<CVPillListProps> = ({ kicker, items }) => {
  return (
    <div className="cv-section" style={{ gap: 'var(--sp-2)' }}>
      <span className="cv-label">{kicker}</span>
      <div className="cv-pill-list">
        {items.map((item, i) => (
          <span key={i} className="cv-pill">{item}</span>
        ))}
      </div>
    </div>
  );
};
