import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  AlertTriangle
} from 'lucide-react';

interface Contractor {
  id: number;
  name: string;
  manager: string;
  regNumber: string;
  status: string;
  performance: number;
  onTime: string;
  penalties: number;
}

export default function ContractorsModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/contractors')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch contractors data.');
        }
        return response.json();
      })
      .then((data: Contractor[]) => {
        setContractors(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredContractors = contractors.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.regNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', fontFamily: 'Inter, system-ui, sans-serif', color: '#64748b' }}>
        Loading contractors from database...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', fontFamily: 'Inter, system-ui, sans-serif', color: '#dc2626' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* HEADER & SEARCH BAR */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Contractor Directory</h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Manage registered construction firms, performance metrics, and penalties.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px' }}>
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search company or reg..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '200px' }}
            />
          </div>
        </div>

        {/* DATA TABLE MATCHING DESIGN */}
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', backgroundColor: '#ffffff' }}>
              <th style={{ padding: '16px 24px', fontWeight: '500' }}>Company</th>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>Reg. Number</th>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>Status</th>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>Performance</th>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>On-Time</th>
              <th style={{ padding: '16px 24px', fontWeight: '500' }}>Penalties</th>
            </tr>
          </thead>
          <tbody>
            {filteredContractors.length > 0 ? (
              filteredContractors.map((contractor) => (
                <tr key={contractor.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>

                  {/* Company Name & Icon */}
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{contractor.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{contractor.manager}</div>
                      </div>
                    </div>
                  </td>

                  {/* Reg. Number */}
                  <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '12px' }}>
                    {contractor.regNumber}
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      backgroundColor: '#ecfdf5',
                      color: '#059669'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }}></span>
                      {contractor.status}
                    </span>
                  </td>

                  {/* Performance Progress Bar & Percentage */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '80px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${contractor.performance}%`,
                          height: '100%',
                          backgroundColor: contractor.performance < 70 ? '#3b82f6' : '#10b981',
                          borderRadius: '3px'
                        }}></div>
                      </div>
                      <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '12px' }}>{contractor.performance}%</span>
                    </div>
                  </td>

                  {/* On-Time Score */}
                  <td style={{ padding: '16px 20px', fontWeight: '600', color: '#0f172a', fontSize: '12px' }}>
                    {contractor.onTime}
                  </td>

                  {/* Penalties Column */}
                  <td style={{ padding: '16px 24px' }}>
                    {contractor.penalties > 0 ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#dc2626',
                        backgroundColor: '#fee2e2',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        <AlertTriangle size={12} /> {contractor.penalties}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>
                        None
                      </span>
                    )}
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No contractors match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>

      </div>
    </div>
  );
}