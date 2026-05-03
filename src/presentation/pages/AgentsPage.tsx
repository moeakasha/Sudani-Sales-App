import { useState, useEffect } from 'react';
import { supabase } from '../../infrastructure/supabase/client';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardSidebar } from '../components/DashboardSidebar';
import './AgentsPage.css';

interface Agent {
  'Username': string;
  'Full Name': string;
  'Agent ID': string | null;
  'Center Name'?: string;
  'Region'?: string;
  'Mobile'?: string;
  'created_at'?: string;
  customerCount?: number;
}

type SortField = 'Full Name' | 'Username' | 'Agent ID' | 'created_at' | 'customerCount';
type SortOrder = 'asc' | 'desc';

export const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('Full Name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAgents, setTotalAgents] = useState(0);
  const [activeAgents, setActiveAgents] = useState(0);
  const [pageSize] = useState(100);
  // Start with sidebar open on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [agentForm, setAgentForm] = useState({
    username: '',
    fullName: '',
    mobile: '',
    region: '',
    centerName: ''
  });

  useEffect(() => {
    fetchAgents();
  }, [searchQuery, sortField, sortOrder, statusFilter, currentPage]);

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

  const fetchAgents = async () => {
    try {
      setLoading(true);

      // Fetch agents using the paginated RPC function
      const { data, error } = await supabase.rpc('get_agents_paginated', {
        p_search: searchQuery,
        p_status: statusFilter,
        p_sort_field: sortField,
        p_sort_order: sortOrder,
        p_page_size: pageSize,
        p_page_num: currentPage
      });

      if (error) {
        console.error('Error fetching agents:', error);
        throw error;
      }

      const formattedData: Agent[] = (data || []).map((row: any) => ({
        Username: row.Username,
        'Full Name': row['Full Name'],
        'Agent ID': row['Agent ID'],
        'Center Name': row['Center Name'],
        'Region': row['Region'],
        'Mobile': row['Mobile'],
        created_at: row.created_at,
        customerCount: Number(row.customer_count)
      }));

      setAgents(formattedData);
      setFilteredAgents(formattedData);
      setTotalAgents(data?.[0]?.total_count || 0);

      // Fetch summary stats using RPC
      const { data: stats, error: statsError } = await supabase.rpc('get_dashboard_metrics');
      if (!statsError && stats) {
        setActiveAgents(stats.active_agents || 0);
      }

    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return 'unfold_more';
    return sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  const exportToCSV = () => {
    // Prepare CSV headers
    const headers = ['Username', 'Full Name', 'Region', 'Center Name', 'Mobile', 'Telegram ID', 'Join Date', 'Customers', 'Status'];
    
    // Prepare CSV rows
    const rows = filteredAgents.map(agent => [
      agent['Username'],
      agent['Full Name'],
      agent['Region'] || 'N/A',
      agent['Center Name'] || 'N/A',
      agent['Mobile'] || 'N/A',
      agent['Agent ID'] || 'Not Linked',
      formatDate(agent.created_at || ''),
      agent.customerCount || 0,
      (agent.customerCount || 0) > 0 ? 'Active' : 'Inactive'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `agents_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setAgentForm({
      username: agent['Username'],
      fullName: agent['Full Name'],
      mobile: agent['Mobile'] || '',
      region: agent['Region'] || '',
      centerName: agent['Center Name'] || ''
    });
    setIsEditModalOpen(true);
  };

  const handleAddClick = () => {
    setAgentForm({
      username: '',
      fullName: '',
      mobile: '',
      region: '',
      centerName: ''
    });
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setIsAddModalOpen(false);
    setSelectedAgent(null);
  };

  const handleAddAgent = async () => {
    if (!agentForm.username.trim() || !agentForm.fullName.trim()) {
      alert('Username and Full Name are required');
      return;
    }

    try {
      setIsSaving(true);

      const newAgent = {
        'Username': agentForm.username.trim(),
        'Full Name': agentForm.fullName.trim(),
        'Mobile': agentForm.mobile.trim(),
        'Region': agentForm.region.trim(),
        'Center Name': agentForm.centerName.trim(),
        'created_at': new Date().toISOString()
      };

      const { error } = await supabase
        .from('agentsdata')
        .insert([newAgent]);

      if (error) {
        console.error('Error adding agent:', error);
        if (error.code === '23505') {
          alert('Username already exists. Please choose a different one.');
        } else {
          alert('Failed to add agent. Please try again.');
        }
        throw error;
      }

      await fetchAgents();
      handleCloseModal();
    } catch (error) {
      console.error('Error adding agent:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    if (!window.confirm(`Are you sure you want to delete agent ${agent['Full Name']}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('agentsdata')
        .delete()
        .eq('Username', agent['Username']);

      if (error) {
        console.error('Error deleting agent:', error);
        alert('Failed to delete agent. Please try again.');
        throw error;
      }

      await fetchAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveAgent = async () => {
    if (!selectedAgent || !agentForm.fullName.trim()) {
      alert('Full Name is required');
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('agentsdata')
        .update({ 
          'Full Name': agentForm.fullName.trim(),
          'Mobile': agentForm.mobile.trim(),
          'Region': agentForm.region.trim(),
          'Center Name': agentForm.centerName.trim()
        })
        .eq('Username', selectedAgent['Username']);

      if (error) {
        console.error('Error updating agent:', error);
        alert('Failed to update agent. Please try again.');
        throw error;
      }

      await fetchAgents();
      handleCloseModal();
    } catch (error) {
      console.error('Error updating agent:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-page">
      <DashboardHeader onMenuClick={toggleSidebar} />
      <div className="dashboard-layout">
        {/* Backdrop for mobile */}
        {isSidebarOpen && window.innerWidth <= 768 && (
          <div 
            className="sidebar-backdrop visible" 
            onClick={toggleSidebar}
          />
        )}
        <DashboardSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <div className={`dashboard-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <main className="agents-content">
            <div className="page-header">
              <div className="page-title-section">
                <h1 className="page-title">Agents</h1>
                <p className="page-subtitle">Manage and view all sales agents</p>
              </div>
              <div className="page-actions">
                <button className="add-agent-button" onClick={handleAddClick}>
                  <span className="material-symbols-outlined">person_add</span>
                  <span>Add Agent</span>
                </button>
                <div className="page-stats">
                  <div className="stat-badge">
                    <span className="stat-value">{totalAgents}</span>
                    <span className="stat-label">Total Agents</span>
                  </div>
                  <div className="stat-badge">
                    <span className="stat-value">{activeAgents}</span>
                    <span className="stat-label">Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="filters-section">
              <div className="search-box">
                <span className="material-symbols-outlined search-icon">search</span>
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  className="search-input"
                />
                {searchQuery && (
                  <button className="clear-search" onClick={() => setSearchQuery('')}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>

              <div className="filter-controls">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1); // Reset to first page on filter
                  }}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                
                <button 
                  className="export-button"
                  onClick={exportToCSV}
                  disabled={filteredAgents.length === 0}
                >
                  <span className="material-symbols-outlined">download</span>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <span className="material-symbols-outlined spinner">progress_activity</span>
                <p>Loading agents...</p>
              </div>
            ) : (
              <>
                <div className="results-info">
                  <p>Showing {filteredAgents.length} of {totalAgents} agents</p>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Agent</th>
                        <th className="sortable" onClick={() => handleSort('Username')}>
                          <div className="th-content">
                            <span>Username</span>
                            <span className="material-symbols-outlined sort-icon">
                              {getSortIcon('Username')}
                            </span>
                          </div>
                        </th>
                        <th>Mobile</th>
                        <th>Region</th>
                        <th className="sortable" onClick={() => handleSort('Agent ID')}>
                          <div className="th-content">
                            <span>Telegram ID</span>
                            <span className="material-symbols-outlined sort-icon">
                              {getSortIcon('Agent ID')}
                            </span>
                          </div>
                        </th>
                        <th className="sortable" onClick={() => handleSort('created_at')}>
                          <div className="th-content">
                            <span>Join Date</span>
                            <span className="material-symbols-outlined sort-icon">
                              {getSortIcon('created_at')}
                            </span>
                          </div>
                        </th>
                        <th className="sortable" onClick={() => handleSort('customerCount')}>
                          <div className="th-content">
                            <span>Customers</span>
                            <span className="material-symbols-outlined sort-icon">
                              {getSortIcon('customerCount')}
                            </span>
                          </div>
                        </th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAgents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            <span className="material-symbols-outlined empty-icon">person_off</span>
                            <p>No agents found</p>
                            <small>Try adjusting your search or filters</small>
                          </td>
                        </tr>
                      ) : (
                        filteredAgents.map((agent) => (
                          <tr key={agent['Username']} className="data-row">
                            <td>
                              <div className="agent-cell">
                                <div className="agent-avatar">
                                  {getInitials(agent['Full Name'])}
                                </div>
                                <div className="agent-info">
                                  <div className="agent-name">{agent['Full Name']}</div>
                                  <div className="agent-center">{agent['Center Name']}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="username-cell">{agent['Username']}</span>
                            </td>
                            <td>
                              <span className="mobile-cell">{agent['Mobile'] || 'N/A'}</span>
                            </td>
                            <td>
                              <span className="region-badge">{agent['Region'] || 'N/A'}</span>
                            </td>
                            <td>
                              <span className="agent-id">{agent['Agent ID'] || 'Not Linked'}</span>
                            </td>
                            <td>{formatDate(agent.created_at || '')}</td>
                            <td>
                              <span className="customer-count">{agent.customerCount || 0}</span>
                            </td>
                            <td>
                              <span className={`status-badge ${(agent.customerCount || 0) > 0 ? 'status-active' : 'status-inactive'}`}>
                                {(agent.customerCount || 0) > 0 ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <button
                                className="action-button edit-button"
                                onClick={() => handleEditClick(agent)}
                                title="Edit agent"
                              >
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                              <button
                                className="action-button delete-button"
                                onClick={() => handleDeleteAgent(agent)}
                                title="Delete agent"
                                disabled={isDeleting}
                              >
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalAgents > pageSize && (
                  <div className="pagination-controls desktop-pagination-only">
                    <button 
                      className="pagination-button" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                      <span>Previous</span>
                    </button>
                    <div className="pagination-info">
                      Page <span>{currentPage}</span>
                      <span className="pagination-total">of {Math.ceil(totalAgents / pageSize)}</span>
                    </div>
                    <button 
                      className="pagination-button" 
                      disabled={currentPage >= Math.ceil(totalAgents / pageSize)}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      <span>Next</span>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                )}

                {/* Mobile Card View */}
                <div className="mobile-card-list">
                  {filteredAgents.length === 0 ? (
                    <div className="empty-state" style={{ background: '#ffffff', borderRadius: '8px', padding: '4rem 2rem' }}>
                      <span className="material-symbols-outlined empty-icon">person_off</span>
                      <p>No agents found</p>
                      <small>Try adjusting your search or filters</small>
                    </div>
                  ) : (
                    filteredAgents.map((agent) => (
                      <div key={agent['Username']} className="agent-card">
                        <div className="agent-card-header">
                          <div className="agent-avatar">
                            {getInitials(agent['Full Name'])}
                          </div>
                          <div className="agent-info">
                            <div className="agent-name">{agent['Full Name']}</div>
                            <div className="agent-username">@{agent['Username']}</div>
                          </div>
                        </div>
                        <div className="agent-card-body">
                          <div className="agent-card-row">
                            <span className="agent-card-label">Mobile</span>
                            <span className="agent-card-value">{agent['Mobile'] || 'N/A'}</span>
                          </div>
                          <div className="agent-card-row">
                            <span className="agent-card-label">Region</span>
                            <span className="agent-card-value">{agent['Region'] || 'N/A'}</span>
                          </div>
                          <div className="agent-card-row">
                            <span className="agent-card-label">Center</span>
                            <span className="agent-card-value">{agent['Center Name'] || 'N/A'}</span>
                          </div>
                          <div className="agent-card-row">
                            <span className="agent-card-label">Telegram ID</span>
                            <span className="agent-card-value">{agent['Agent ID'] || 'Not Linked'}</span>
                          </div>
                          <div className="agent-card-row">
                            <span className="agent-card-label">Join Date</span>
                            <span className="agent-card-value">{formatDate(agent.created_at || '')}</span>
                          </div>
                          <div className="agent-card-row">
                            <span className="agent-card-label">Customers</span>
                            <span className="agent-card-value customer-count">{agent.customerCount || 0}</span>
                          </div>
                          <div className="agent-card-row">
                            <span className="agent-card-label">Status</span>
                            <span className={`status-badge ${(agent.customerCount || 0) > 0 ? 'status-active' : 'status-inactive'}`}>
                              {(agent.customerCount || 0) > 0 ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="agent-card-footer">
                          <button
                            className="action-button edit-button"
                            onClick={() => handleEditClick(agent)}
                            title="Edit agent"
                          >
                            <span className="material-symbols-outlined">edit</span>
                            <span>Edit</span>
                          </button>
                          <button
                            className="action-button delete-button"
                            onClick={() => handleDeleteAgent(agent)}
                            title="Delete agent"
                            disabled={isDeleting}
                          >
                            <span className="material-symbols-outlined">delete</span>
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Pagination Controls for Mobile */}
                {totalAgents > pageSize && (
                  <div className="pagination-controls mobile-pagination-only">
                    <button 
                      className="pagination-button" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                      <span>Previous</span>
                    </button>
                    <div className="pagination-info">
                      Page <span>{currentPage}</span>
                      <span className="pagination-total">of {Math.ceil(totalAgents / pageSize)}</span>
                    </div>
                    <button 
                      className="pagination-button" 
                      disabled={currentPage >= Math.ceil(totalAgents / pageSize)}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      <span>Next</span>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Add/Edit Agent Modal */}
      {(isEditModalOpen || isAddModalOpen) && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isAddModalOpen ? 'Add New Agent' : 'Edit Agent'}</h2>
              <button className="modal-close-button" onClick={handleCloseModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="agentUsername">Username *</label>
                  <input
                    id="agentUsername"
                    type="text"
                    className="modal-input"
                    value={agentForm.username}
                    onChange={(e) => setAgentForm({ ...agentForm, username: e.target.value })}
                    placeholder="e.g. mohmedaao"
                    disabled={isEditModalOpen}
                    autoFocus={isAddModalOpen}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="agentName">Full Name *</label>
                  <input
                    id="agentName"
                    type="text"
                    className="modal-input"
                    value={agentForm.fullName}
                    onChange={(e) => setAgentForm({ ...agentForm, fullName: e.target.value })}
                    placeholder="Enter agent full name"
                    autoFocus={isEditModalOpen}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="agentMobile">Mobile Number</label>
                  <input
                    id="agentMobile"
                    type="text"
                    className="modal-input"
                    value={agentForm.mobile}
                    onChange={(e) => setAgentForm({ ...agentForm, mobile: e.target.value })}
                    placeholder="e.g. 0912345678"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="agentRegion">Region</label>
                  <input
                    id="agentRegion"
                    type="text"
                    className="modal-input"
                    value={agentForm.region}
                    onChange={(e) => setAgentForm({ ...agentForm, region: e.target.value })}
                    placeholder="e.g. Khartoum"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="agentCenter">Center Name</label>
                  <input
                    id="agentCenter"
                    type="text"
                    className="modal-input"
                    value={agentForm.centerName}
                    onChange={(e) => setAgentForm({ ...agentForm, centerName: e.target.value })}
                    placeholder="e.g. Omdurman Center"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="modal-button cancel-button" onClick={handleCloseModal} disabled={isSaving}>
                Cancel
              </button>
              <button 
                className="modal-button save-button" 
                onClick={isAddModalOpen ? handleAddAgent : handleSaveAgent}
                disabled={isSaving || !agentForm.username.trim() || !agentForm.fullName.trim()}
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined spinner">progress_activity</span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">{isAddModalOpen ? 'person_add' : 'save'}</span>
                    <span>{isAddModalOpen ? 'Add Agent' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
