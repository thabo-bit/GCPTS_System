// src/Components/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import coatOfArms from '../assets/coat_of_arms_of_south_africa_1.png';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      color: '#64748b',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '48px 24px 24px 24px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr',
        gap: '40px',
        paddingBottom: '40px'
      }}>
        
        {/* COLUMN 1: Brand & Description */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'radial-gradient(circle at 50% 30%, #1b2942 0%, #0d1728 100%)',
              border: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 6px 16px rgba(13, 23, 40, 0.25)',
              flexShrink: 0,
            }}>
              <img
                src={coatOfArms}
                alt="Coat of Arms of South Africa"
                style={{
                  width: '42px',
                  height: '42px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', letterSpacing: '1px', lineHeight: 1 }}>
                GCPTS
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '6px' }}>
                Transparency Portal
              </div>
            </div>
          </div>

          <p style={{ margin: '0 0 24px 0', fontSize: '13px', lineHeight: '1.65', color: '#64748b', maxWidth: '340px' }}>
            Tracking every public development project with complete transparency. Building trust between government and citizens.
          </p>

          {/* Social Icons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { name: 'facebook', svg: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
              { name: 'twitter', svg: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z' },
              { name: 'youtube', svg: 'M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z' },
              { name: 'linkedin', svg: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1-2 2 2 2 0 0 1 2-2z' }
            ].map((soc) => (
              <a
                key={soc.name}
                href={`#${soc.name}`}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={soc.svg} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* COLUMN 2: Quick Links */}
        <div>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a', letterSpacing: '0.3px' }}>
            Quick Links
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['About', 'Projects', 'Departments', 'Reports'].map((item) => (
              <li key={item}>
                <Link
                  to={`/${item.toLowerCase()}`}
                  style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px', transition: 'color 0.2s' }}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* COLUMN 3: Legal */}
        <div>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a', letterSpacing: '0.3px' }}>
            Legal
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Privacy Policy', 'POPIA Compliance', 'Terms of Service', 'Accessibility'].map((item) => (
              <li key={item}>
                <Link
                  to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                  style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px', transition: 'color 0.2s' }}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* COLUMN 4: Emergency Contacts */}
        <div>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a', letterSpacing: '0.3px' }}>
            Emergency Contacts
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8' }}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              0800 000 000
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8' }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
              </svg>
              info@gcpts.gov.za
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              Pretoria, South Africa
            </div>
          </div>
        </div>

      </div>

  
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        paddingTop: '24px',
        borderTop: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '12px',
        color: '#94a3b8'
      }}>
        <div>
          &copy; 2026 Government of South Africa. All rights reserved. &nbsp;&bull;&nbsp; Version 2.0 Enterprise
        </div>

      
      </div>
    </footer>
  );
}