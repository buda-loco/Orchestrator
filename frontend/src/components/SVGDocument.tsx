import React from 'react';

interface SVGDocumentProps {
  data: any;
  masterCv: any;
}

export const SVGDocument: React.FC<SVGDocumentProps> = ({ data, masterCv }) => {
  const A4_WIDTH = 210; // mm
  const A4_HEIGHT = 297; // mm
  const MARGIN = 15;

  // Split experience into two columns for Page 2
  const midPoint = Math.ceil(data.experience.length / 2);
  const leftCol = data.experience.slice(0, midPoint);
  const rightCol = data.experience.slice(midPoint);

  const PageContainer = ({ children, pageNum }: { children: React.ReactNode; pageNum: number }) => (
    <div className="bg-white shadow-[20px_20px_60px_rgba(0,0,0,0.1)] mb-20 relative" style={{ width: `${A4_WIDTH}mm`, height: `${A4_HEIGHT}mm`, overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${A4_WIDTH} ${A4_HEIGHT}`}
        width={`${A4_WIDTH}mm`}
        height={`${A4_HEIGHT}mm`}
        className="block"
      >
        <rect width="100%" height="100%" fill="white" />
        {children}
        {/* Page Number Indicator (System Only) */}
        <text x={A4_WIDTH - 10} y={A4_HEIGHT - 10} fontSize="3" fontWeight="900" textAnchor="end" className="no-print">PAGE 0{pageNum}</text>
      </svg>
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      
      {/* PAGE 1: INTRODUCTION */}
      <PageContainer pageNum={1}>
        {/* Header Area */}
        <g transform={`translate(${MARGIN}, ${MARGIN + 10})`}>
          <text y="0" className="cv-name" style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase' }}>{masterCv.candidate.name}</text>
          <text y="15" style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>{data.targetJobTitle}</text>
          <line x1="0" y1="22" x2={A4_WIDTH - MARGIN * 2} y2="22" stroke="black" strokeWidth="0.8" />
          
          <g transform="translate(0, 35)">
            <text className="cv-label" y="0">Based In</text>
            <text y="8" style={{ fontSize: '4.5px', fontWeight: 700 }}>{masterCv.candidate.location}</text>
            
            <text x="80" className="cv-label" y="0">Contact</text>
            <text x="80" y="8" style={{ fontSize: '4.5px', fontWeight: 700 }}>{masterCv.candidate.contact.email}</text>
          </g>
        </g>

        {/* Profile Area */}
        <foreignObject x={MARGIN} y="80" width={A4_WIDTH - MARGIN * 2} height="150">
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ padding: '10px 0' }}>
            <span className="cv-label" style={{ backgroundColor: 'black', color: 'white', padding: '2px 8px', display: 'inline-block', marginBottom: '15px' }}>Strategic Profile</span>
            <h2 className="cv-section-title" style={{ margin: '0 0 20px 0' }}>Architectural Alignment</h2>
            <p className="cv-body" style={{ fontSize: '1.1rem', lineHeight: '1.8', textAlign: 'justify' }}>
              {data.professionalProfile}
            </p>
          </div>
        </foreignObject>
      </PageContainer>

      {/* PAGE 2: JOB EXPERIENCE (2 COLUMNS) */}
      <PageContainer pageNum={2}>
        <g transform={`translate(${MARGIN}, ${MARGIN})`}>
          <span className="cv-label">Selected Record</span>
          <text y="15" className="cv-section-title">Career History</text>
          <line x1="0" y1="20" x2={A4_WIDTH - MARGIN * 2} y2="20" stroke="black" strokeWidth="0.5" />
        </g>

        {/* Two Column Grid */}
        <foreignObject x={MARGIN} y="45" width={A4_WIDTH - MARGIN * 2} height={A4_HEIGHT - 60}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {leftCol.map((exp: any, i: number) => (
                <div key={i} style={{ borderBottom: '1px solid #EEE', paddingBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <h3 className="cv-item-title" style={{ fontSize: '0.9rem', margin: 0 }}>{exp.role}</h3>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="cv-label" style={{ fontWeight: 800 }}>{exp.company}</span>
                    <span className="cv-label cv-muted" style={{ fontSize: '0.5rem' }}>{exp.period}</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.75rem', lineHeight: '1.4' }}>
                    {exp.highlights.map((h: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: '6px', position: 'relative', paddingLeft: '12px' }}>
                        <span style={{ position: 'absolute', left: 0, fontWeight: 900 }}>—</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {rightCol.map((exp: any, i: number) => (
                <div key={i} style={{ borderBottom: '1px solid #EEE', paddingBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <h3 className="cv-item-title" style={{ fontSize: '0.9rem', margin: 0 }}>{exp.role}</h3>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="cv-label" style={{ fontWeight: 800 }}>{exp.company}</span>
                    <span className="cv-label cv-muted" style={{ fontSize: '0.5rem' }}>{exp.period}</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.75rem', lineHeight: '1.4' }}>
                    {exp.highlights.map((h: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: '6px', position: 'relative', paddingLeft: '12px' }}>
                        <span style={{ position: 'absolute', left: 0, fontWeight: 900 }}>—</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </foreignObject>
      </PageContainer>

      {/* PAGE 3: THE REST (TOOLKIT + LANGUAGES) */}
      <PageContainer pageNum={3}>
        <g transform={`translate(${MARGIN}, ${MARGIN})`}>
          <text y="10" className="cv-label">Capabilities</text>
          <text y="25" className="cv-section-title">Technical Architecture</text>
          <line x1="0" y1="32" x2={A4_WIDTH - MARGIN * 2} y2="32" stroke="black" strokeWidth="2" />
        </g>

        <foreignObject x={MARGIN} y="55" width={A4_WIDTH - MARGIN * 2} height={A4_HEIGHT - 80}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <section>
                <span className="cv-label" style={{ display: 'block', marginBottom: '15px', borderBottom: '1px solid black', paddingBottom: '5px' }}>Creative Toolkit</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {data.technicalToolkit.creative.map((s: string, i: number) => (
                    <span key={i} className="cv-pill" style={{ border: '1px solid black', padding: '3px 8px', fontSize: '9px', fontWeight: 800 }}>{s}</span>
                  ))}
                </div>
              </section>

              <section>
                <span className="cv-label" style={{ display: 'block', marginBottom: '15px', borderBottom: '1px solid black', paddingBottom: '5px' }}>Digital Architecture</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {data.technicalToolkit.digital.map((s: string, i: number) => (
                    <span key={i} className="cv-pill" style={{ border: '1px solid black', padding: '3px 8px', fontSize: '9px', fontWeight: 800 }}>{s}</span>
                  ))}
                </div>
              </section>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <section>
                <span className="cv-label" style={{ display: 'block', marginBottom: '15px', borderBottom: '1px solid black', paddingBottom: '5px' }}>Systems & Management</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {data.technicalToolkit.management.map((s: string, i: number) => (
                    <span key={i} className="cv-pill" style={{ border: '1px solid black', padding: '3px 8px', fontSize: '9px', fontWeight: 800 }}>{s}</span>
                  ))}
                </div>
              </section>

              <section>
                <span className="cv-label" style={{ display: 'block', marginBottom: '15px', borderBottom: '1px solid black', paddingBottom: '5px' }}>Communication</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {masterCv.candidate.languages.map((l: any, i: number) => (
                    <div key={i}>
                      <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}>{l.language}</div>
                      <div className="cv-muted" style={{ fontSize: '8px', textTransform: 'uppercase', fontWeight: 700 }}>{l.fluency}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </foreignObject>

        {/* Final footer on Page 3 */}
        <g transform={`translate(${MARGIN}, ${A4_HEIGHT - 30})`}>
          <line x1="0" y1="0" x2={A4_WIDTH - MARGIN * 2} y2="0" stroke="black" strokeWidth="0.5" />
          <text y="15" className="cv-label" style={{ fontSize: '3px' }}>Document valid for current application cycle — 2026</text>
        </g>
      </PageContainer>
    </div>
  );
};
