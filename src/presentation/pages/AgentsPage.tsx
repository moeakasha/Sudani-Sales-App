import { useState, useEffect } from 'react';
import { supabase } from '../../infrastructure/supabase/client';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardSidebar } from '../components/DashboardSidebar';
import './AgentsPage.css';

interface Agent {
  'Agent ID': number;
  'Full Name': string;
  'Location': string;
  'Date': string;
  'Phone Number': string;
  'created_at'?: string;
  customerCount?: number;
}

type SortField = 'Full Name' | 'Agent ID' | 'created_at' | 'customerCount';
type SortOrder = 'asc' | 'desc';

export const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('Agent ID');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // Start with sidebar open on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch agents data (auth already checked by ProtectedRoute)
    fetchAgents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [agents, searchQuery, sortField, sortOrder, statusFilter]);

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

      // Fetch all agents (RLS allows authenticated users to read)
      const { data: agentsData, error: agentsError } = await supabase
        .from('Agent')
        .select('*');

      if (agentsError) {
        console.error('Error fetching agents:', agentsError);
        if (agentsError.message.includes('permission') || agentsError.message.includes('policy')) {
          alert('Permission denied. Please contact your administrator.');
        }
        throw agentsError;
      }

      // Fetch customer counts for each agent (RLS allows authenticated users to read)
      const { data: customers, error: customersError } = await supabase
        .from('Customer_Data')
        .select('"Agent ID"');

      if (customersError) {
        console.error('Error fetching customers:', customersError);
        throw customersError;
      }

      // Count customers per agent
      const agentCustomerCounts = new Map<number, number>();
      if (customers) {
        customers.forEach(customer => {
          const agentId = customer['Agent ID'];
          if (agentId != null) {
            agentCustomerCounts.set(agentId, (agentCustomerCounts.get(agentId) || 0) + 1);
          }
        });
      }

      // Merge agent data with customer counts
      const agentsWithCounts: Agent[] = (agentsData || []).map(agent => ({
        ...agent,
        customerCount: agentCustomerCounts.get(agent['Agent ID']) || 0,
      }));

      setAgents(agentsWithCounts);

    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...agents];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(agent =>
        agent['Full Name']?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent['Agent ID']?.toString().includes(searchQuery)
      );
    }

    // Status filter (active/inactive)
    if (statusFilter === 'active') {
      filtered = filtered.filter(agent => (agent.customerCount || 0) > 0);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(agent => (agent.customerCount || 0) === 0);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle undefined values
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      // Convert to comparable values
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredAgents(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
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
    const headers = ['Agent ID', 'Full Name', 'Location', 'Phone Number', 'Join Date', 'Customers', 'Status'];
    
    // Prepare CSV rows
    const rows = filteredAgents.map(agent => [
      agent['Agent ID'],
      agent['Full Name'],
      agent['Location'] || 'N/A',
      agent['Phone Number'] || 'N/A',
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
    setEditedName(agent['Full Name']);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedAgent(null);
    setEditedName('');
  };

  const handleSaveAgent = async () => {
    if (!selectedAgent || !editedName.trim()) {
      alert('Please enter a valid name');
      return;
    }

    try {
      setIsSaving(true);

      // Update agent (RLS allows authenticated users to write)
      const { error } = await supabase
        .from('Agent')
        .update({ 'Full Name': editedName.trim() })
        .eq('Agent ID', selectedAgent['Agent ID']);

      if (error) {
        console.error('Error updating agent:', error);
        if (error.message.includes('permission') || error.message.includes('policy')) {
          alert('Permission denied. You do not have permission to update this agent.');
        } else {
          alert('Failed to update agent. Please try again.');
        }
        throw error;
      }

      // Update local state
      const updatedAgents = agents.map(agent =>
        agent['Agent ID'] === selectedAgent['Agent ID']
          ? { ...agent, 'Full Name': editedName.trim() }
          : agent
      );
      setAgents(updatedAgents);

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
              <div className="page-stats">
                <div className="stat-badge">
                  <span className="stat-value">{agents.length}</span>
                  <span className="stat-label">Total Agents</span>
                </div>
                <div className="stat-badge">
                  <span className="stat-value">{agents.filter(a => (a.customerCount || 0) > 0).length}</span>
                  <span className="stat-label">Active</span>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                  <p>Showing {filteredAgents.length} of {agents.length} agents</p>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Agent</th>
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
                          <tr key={agent['Agent ID']} className="data-row">
                            <td>
                              <div className="agent-cell">
                                <div className="agent-avatar">
                                  {getInitials(agent['Full Name'])}
                                </div>
                                <div className="agent-info">
                                  <div className="agent-name">{agent['Full Name']}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="agent-id">{agent['Agent ID']}</span>
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
                            <td>
                              <button
                                className="action-button edit-button"
                                onClick={() => handleEditClick(agent)}
                                title="Edit agent"
                              >
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

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
                      <div key={agent['Agent ID']} className="agent-card">
                        <div className="agent-card-header">
                          <div className="agent-avatar">
                            {getInitials(agent['Full Name'])}
                          </div>
                          <div className="agent-info">
                            <div className="agent-name">{agent['Full Name']}</div>
                          </div>
                        </div>
                        <div className="agent-card-body">
                          <div className="agent-card-row">
                            <span className="agent-card-label">Telegram ID</span>
                            <span className="agent-card-value">{agent['Agent ID']}</span>
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

      {/* Edit Agent Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Agent</h2>
              <button className="modal-close-button" onClick={handleCloseModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="agentName">Agent Name</label>
                <input
                  id="agentName"
                  type="text"
                  className="modal-input"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter agent name"
                  autoFocus
                />
              </div>
              
              <div className="agent-details">
                <div className="detail-item">
                  <span className="detail-label">Agent ID:</span>
                  <span className="detail-value">{selectedAgent?.['Agent ID']}</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="modal-button cancel-button" onClick={handleCloseModal} disabled={isSaving}>
                Cancel
              </button>
              <button 
                className="modal-button save-button" 
                onClick={handleSaveAgent}
                disabled={isSaving || !editedName.trim()}
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined spinner">progress_activity</span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    <span>Save</span>
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
