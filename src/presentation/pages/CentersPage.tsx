import { useState, useEffect } from 'react';
import { supabase } from '../../infrastructure/supabase/client';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardSidebar } from '../components/DashboardSidebar';
import './CentersPage.css';

interface Center {
  'Center Name': string;
  total_agents: number;
  active_agents: number;
  inactive_agents: number;
  total_customers: number;
  rank: number; // performance rank by customers (all time), 1-based
}

interface CentersMetrics {
  total_centers: number;
  active_centers: number;
  total_agents: number;
  active_agents: number;
  total_customers: number;
}

type SortField = 'Center Name' | 'total_agents' | 'active_agents' | 'total_customers';
type SortOrder = 'asc' | 'desc';

export const CentersPage = () => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [metrics, setMetrics] = useState<CentersMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('total_customers');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  // Start with sidebar open on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    fetchCenters();
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCenters = async () => {
    try {
      setLoading(true);

      // Headline KPIs
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_centers_metrics');
      if (metricsError) {
        console.error('Error fetching centers metrics:', metricsError);
      } else if (metricsData) {
        setMetrics({
          total_centers: Number(metricsData.total_centers) || 0,
          active_centers: Number(metricsData.active_centers) || 0,
          total_agents: Number(metricsData.total_agents) || 0,
          active_agents: Number(metricsData.active_agents) || 0,
          total_customers: Number(metricsData.total_customers) || 0,
        });
      }

      // Per-center summary (RPC already returns ordered by customers desc)
      const { data, error } = await supabase.rpc('get_centers_summary');
      if (error) {
        console.error('Error fetching centers summary:', error);
        throw error;
      }

      const formatted: Center[] = (data || []).map((row: any, index: number) => ({
        'Center Name': row['Center Name'],
        total_agents: Number(row.total_agents) || 0,
        active_agents: Number(row.active_agents) || 0,
        inactive_agents: Number(row.inactive_agents) || 0,
        total_customers: Number(row.total_customers) || 0,
        rank: index + 1, // RPC order = customers desc → this is the performance rank
      }));

      setCenters(formatted);
    } catch (error) {
      console.error('Error fetching centers:', error);
      setCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'Center Name' ? 'asc' : 'desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return 'unfold_more';
    return sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  // Download a CSV report of all centers (rank order) with a KPI summary header.
  // A UTF-8 BOM is prepended so Excel renders the Arabic center names correctly.
  const downloadReport = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const today = new Date().toISOString().split('T')[0];

    const summary: (string | number)[][] = [
      ['Sudani Business — Centers Report'],
      ['Generated', today],
      [],
      ['Total Centers', metrics?.total_centers ?? centers.length],
      ['Active Centers', metrics?.active_centers ?? ''],
      ['Total Agents', metrics?.total_agents ?? ''],
      ['Active Agents', metrics?.active_agents ?? ''],
      ['Total Customers', metrics?.total_customers ?? ''],
      [],
    ];

    const header = ['Rank', 'Center Name', 'Total Agents', 'Active Agents', 'Inactive Agents', 'Total Customers'];
    const rows = centers.map(c => [
      c.rank,
      c['Center Name'],
      c.total_agents,
      c.active_agents,
      c.inactive_agents,
      c.total_customers,
    ]);

    const csv = [
      ...summary.map(line => line.map(esc).join(',')),
      header.map(esc).join(','),
      ...rows.map(r => r.map(esc).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `centers_report_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getInitials = (name: string) => {
    const trimmed = (name || '').trim();
    return trimmed ? trimmed.slice(0, 2) : '??';
  };

  // Top 5 performing centers — always by customers (RPC order), independent of table sort.
  const topCenters = centers.slice(0, 5);
  const maxTopCustomers = Math.max(...topCenters.map(c => c.total_customers), 1);

  // Search filter (by center name) — never mutates the names themselves.
  const filtered = centers.filter(c =>
    c['Center Name']?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply table sort
  const displayed = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'Center Name') {
      cmp = a['Center Name'].localeCompare(b['Center Name']);
    } else {
      cmp = a[sortField] - b[sortField];
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        {/* Backdrop for mobile */}
        {isSidebarOpen && window.innerWidth <= 768 && (
          <div className="sidebar-backdrop visible" onClick={toggleSidebar} />
        )}
        <DashboardSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <div className={`dashboard-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <DashboardHeader onMenuClick={toggleSidebar} />
          <main className="centers-content">
            <div className="page-header">
              <div className="page-title-section">
                <h1 className="page-title">Centers</h1>
                <p className="page-subtitle">Performance and coverage across all sales centers</p>
              </div>
              <div className="page-stats">
                <div className="stat-badge">
                  <span className="stat-value">{metrics ? metrics.total_centers : '—'}</span>
                  <span className="stat-label">Total Centers</span>
                </div>
                <div className="stat-badge">
                  <span className="stat-value">{metrics ? metrics.active_centers : '—'}</span>
                  <span className="stat-label">Active Centers</span>
                </div>
                <div className="stat-badge">
                  <span className="stat-value">{metrics ? metrics.total_agents : '—'}</span>
                  <span className="stat-label">Total Agents</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <span className="material-symbols-outlined spinner">progress_activity</span>
                <p>Loading centers...</p>
              </div>
            ) : (
              <>
                {/* Top 5 performing centers */}
                {topCenters.length > 0 && (
                  <section className="top-centers-section">
                    <h3 className="section-title">Top 5 Performing Centers</h3>
                    <div className="top-centers-grid">
                      {topCenters.map((center) => (
                        <div key={center['Center Name']} className="top-center-card">
                          <div className="top-center-head">
                            <span className={`rank-chip rank-${center.rank}`}>#{center.rank}</span>
                            <span className="material-symbols-outlined top-center-icon">storefront</span>
                          </div>
                          <div className="top-center-name" title={center['Center Name']}>
                            {center['Center Name']}
                          </div>
                          <div className="top-center-customers">
                            <span className="tc-value">{center.total_customers.toLocaleString()}</span>
                            <span className="tc-label">customers</span>
                          </div>
                          <div className="top-center-bar">
                            <div
                              className="top-center-bar-fill"
                              style={{ width: `${(center.total_customers / maxTopCustomers) * 100}%` }}
                            />
                          </div>
                          <div className="top-center-meta">
                            <span>{center.total_agents} agents</span>
                            <span className="tc-active">{center.active_agents} active</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Filters */}
                <div className="filters-section">
                  <div className="search-box">
                    <span className="material-symbols-outlined search-icon">search</span>
                    <input
                      type="text"
                      placeholder="Search by center name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    {searchQuery && (
                      <button className="clear-search" onClick={() => setSearchQuery('')}>
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    )}
                  </div>

                  <button
                    className="report-button"
                    onClick={downloadReport}
                    disabled={centers.length === 0}
                  >
                    <span className="material-symbols-outlined">download</span>
                    <span>Download Report</span>
                  </button>
                </div>

                <div className="results-info">
                  <p>Showing {displayed.length} of {centers.length} centers</p>
                </div>

                {/* Table */}
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="rank-col">Rank</th>
                        <th className="sortable" onClick={() => handleSort('Center Name')}>
                          <div className="th-content">
                            <span>Center</span>
                            <span className="material-symbols-outlined sort-icon">{getSortIcon('Center Name')}</span>
                          </div>
                        </th>
                        <th className="sortable" onClick={() => handleSort('total_agents')}>
                          <div className="th-content">
                            <span>Agents</span>
                            <span className="material-symbols-outlined sort-icon">{getSortIcon('total_agents')}</span>
                          </div>
                        </th>
                        <th className="sortable" onClick={() => handleSort('active_agents')}>
                          <div className="th-content">
                            <span>Active</span>
                            <span className="material-symbols-outlined sort-icon">{getSortIcon('active_agents')}</span>
                          </div>
                        </th>
                        <th>Inactive</th>
                        <th className="sortable" onClick={() => handleSort('total_customers')}>
                          <div className="th-content">
                            <span>Customers</span>
                            <span className="material-symbols-outlined sort-icon">{getSortIcon('total_customers')}</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            <span className="material-symbols-outlined empty-icon">storefront</span>
                            <p>No centers found</p>
                            <small>Try adjusting your search</small>
                          </td>
                        </tr>
                      ) : (
                        displayed.map((center) => (
                          <tr key={center['Center Name']} className="data-row">
                            <td className="rank-col">
                              <span className={`rank-pill ${center.rank <= 5 ? 'rank-pill-top' : ''}`}>
                                {center.rank}
                              </span>
                            </td>
                            <td>
                              <div className="center-cell">
                                <div className="center-avatar">{getInitials(center['Center Name'])}</div>
                                <div className="center-name">{center['Center Name']}</div>
                              </div>
                            </td>
                            <td><span className="count-cell">{center.total_agents}</span></td>
                            <td>
                              <span className="status-badge status-active">{center.active_agents}</span>
                            </td>
                            <td>
                              <span className="status-badge status-inactive">{center.inactive_agents}</span>
                            </td>
                            <td><span className="customer-count">{center.total_customers.toLocaleString()}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view */}
                <div className="mobile-card-list">
                  {displayed.length === 0 ? (
                    <div className="empty-state empty-state-card">
                      <span className="material-symbols-outlined empty-icon">storefront</span>
                      <p>No centers found</p>
                      <small>Try adjusting your search</small>
                    </div>
                  ) : (
                    displayed.map((center) => (
                      <div key={center['Center Name']} className="center-card">
                        <div className="center-card-header">
                          <div className="center-avatar">{getInitials(center['Center Name'])}</div>
                          <div className="center-card-title">
                            <div className="center-name">{center['Center Name']}</div>
                            <div className="center-rank-text">Rank #{center.rank}</div>
                          </div>
                          <span className="customer-count">{center.total_customers.toLocaleString()}</span>
                        </div>
                        <div className="center-card-body">
                          <div className="center-card-row">
                            <span className="center-card-label">Agents</span>
                            <span className="center-card-value">{center.total_agents}</span>
                          </div>
                          <div className="center-card-row">
                            <span className="center-card-label">Active</span>
                            <span className="status-badge status-active">{center.active_agents}</span>
                          </div>
                          <div className="center-card-row">
                            <span className="center-card-label">Inactive</span>
                            <span className="status-badge status-inactive">{center.inactive_agents}</span>
                          </div>
                          <div className="center-card-row">
                            <span className="center-card-label">Customers</span>
                            <span className="center-card-value customer-count">{center.total_customers.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
