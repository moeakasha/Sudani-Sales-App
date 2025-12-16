import { useState, useEffect } from 'react';
import { supabase } from '../../infrastructure/supabase/client';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardSidebar } from '../components/DashboardSidebar';
import './CustomersPage.css';

interface Customer {
  'Customer ID': number;
  'Customer_Name': string;
  'Customer_Mobile': string;
  'Agent ID': number;
  'Created at'?: string;
  agentName?: string;
}

type SortField = 'Customer_Name' | 'Customer ID' | 'Created at';
type SortOrder = 'asc' | 'desc';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('Customer ID');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [agents, setAgents] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, searchQuery, sortField, sortOrder]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      // Fetch all customers
      const { data: customersData, error: customersError } = await supabase
        .from('Customer_Data')
        .select('*');

      if (customersError) throw customersError;

      // Fetch all agents to map agent names
      const { data: agentsData, error: agentsError } = await supabase
        .from('Agent')
        .select('"Agent ID", "Full Name"');

      if (agentsError) throw agentsError;

      // Create agent ID to name map
      const agentMap = new Map<number, string>();
      if (agentsData) {
        agentsData.forEach(agent => {
          agentMap.set(agent['Agent ID'], agent['Full Name']);
        });
        
        // Set agents for filter dropdown
        setAgents(agentsData.map(a => ({ id: a['Agent ID'], name: a['Full Name'] })));
      }

      // Merge customer data with agent names
      const customersWithAgents: Customer[] = (customersData || []).map(customer => ({
        'Customer ID': customer['Customer ID'],
        'Customer_Name': customer['Customer_Name'],
        'Customer_Mobile': customer['Customer_Mobile'],
        'Agent ID': customer['Agent ID'],
        'Created at': customer['Created at'],
        agentName: agentMap.get(customer['Agent ID']) || 'Unknown Agent',
      }));

      setCustomers(customersWithAgents);

    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...customers];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer['Customer_Name']?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer['Customer ID']?.toString().includes(searchQuery) ||
        customer['Customer_Mobile']?.includes(searchQuery) ||
        customer.agentName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
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

    setFilteredCustomers(filtered);
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
    if (isNaN(date.getTime())) return 'N/A';
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
    const headers = ['Customer ID', 'Customer Name', 'Phone Number', 'Agent Name', 'Agent ID', 'Date Added'];
    
    // Prepare CSV rows
    const rows = filteredCustomers.map(customer => [
      customer['Customer ID'],
      customer['Customer_Name'],
      customer['Customer_Mobile'] || 'N/A',
      customer.agentName || 'Unknown Agent',
      customer['Agent ID'],
      formatDate(customer['Created at'] || '')
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
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-page">
      <DashboardHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="dashboard-layout">
        <DashboardSidebar isOpen={isSidebarOpen} />
        <div className={`dashboard-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <main className="customers-content">
            <div className="page-header">
              <div className="page-title-section">
                <h1 className="page-title">Customers</h1>
                <p className="page-subtitle">Manage and view all customer records</p>
              </div>
              <div className="page-stats">
                <div className="stat-badge">
                  <span className="stat-value">{customers.length}</span>
                  <span className="stat-label">Total Customers</span>
                </div>
              </div>
            </div>

            <div className="filters-section">
              <div className="search-box">
                <span className="material-symbols-outlined search-icon">search</span>
                <input
                  type="text"
                  placeholder="Search by name, ID, phone, or agent..."
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
                <button 
                  className="export-button"
                  onClick={exportToCSV}
                  disabled={filteredCustomers.length === 0}
                >
                  <span className="material-symbols-outlined">download</span>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <span className="material-symbols-outlined spinner">progress_activity</span>
                <p>Loading customers...</p>
              </div>
            ) : (
              <>
                <div className="results-info">
                  <p>Showing {filteredCustomers.length} of {customers.length} customers</p>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="sortable" onClick={() => handleSort('Customer_Name')}>
                          <div className="th-content">
                            <span>Customer</span>
                            <span className="material-symbols-outlined sort-icon">
                              {getSortIcon('Customer_Name')}
                            </span>
                          </div>
                        </th>
                        <th>Phone</th>
                        <th>Agent</th>
                        <th className="sortable" onClick={() => handleSort('Created at')}>
                          <div className="th-content">
                            <span>Time Added</span>
                            <span className="material-symbols-outlined sort-icon">
                              {getSortIcon('Created at')}
                            </span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="empty-state">
                            <span className="material-symbols-outlined empty-icon">group_off</span>
                            <p>No customers found</p>
                            <small>Try adjusting your search or filters</small>
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <tr key={customer['Customer ID']} className="data-row">
                            <td>
                              <div className="customer-cell">
                                <div className="customer-avatar">
                                  {getInitials(customer['Customer_Name'])}
                                </div>
                                <div className="customer-info">
                                  <div className="customer-name">{customer['Customer_Name']}</div>
                                </div>
                              </div>
                            </td>
                            <td>{customer['Customer_Mobile'] || 'N/A'}</td>
                            <td>
                              <div className="agent-tag">
                                <span className="material-symbols-outlined agent-tag-icon">badge</span>
                                <span>{customer.agentName}</span>
                              </div>
                            </td>
                            <td>{formatDate(customer['Created at'] || '')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
