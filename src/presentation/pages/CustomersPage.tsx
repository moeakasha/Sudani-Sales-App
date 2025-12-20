import { useState, useEffect } from 'react';
import { supabase } from '../../infrastructure/supabase/client';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardSidebar } from '../components/DashboardSidebar';
import './CustomersPage.css';

interface Customer {
  'id': number;
  'Customer_Name': string;
  'Customer_Mobile': string;
  'Agent ID': number;
  'Created at'?: string;
  agentName?: string;
}

type SortField = 'Customer_Name' | 'id' | 'Created at';
type SortOrder = 'asc' | 'desc';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  // Start with sidebar open on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100); // 100 customers per page
  const [totalCount, setTotalCount] = useState(0);

  const [agents, setAgents] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    // Fetch customers data (auth already checked by ProtectedRoute)
    fetchCustomers();
  }, [currentPage, searchQuery, sortField, sortOrder]);

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

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      // Calculate pagination range
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      console.log('Fetching customers from Supabase...');
      console.log('Current page:', currentPage, 'Range:', from, '-', to);
      console.log('Search query:', searchQuery);
      console.log('Sort:', sortField, sortOrder);

      // First, try to get the count
      const { count: totalRecords, error: countError } = await supabase
        .from('Customer_Data')
        .select('*', { count: 'exact', head: true });

      console.log('Total records count:', totalRecords);
      
      if (countError) {
        console.error('Count error:', countError);
        alert(`Error counting customers: ${countError.message}`);
        throw countError;
      }

      setTotalCount(totalRecords || 0);

      // Build the query
      let query = supabase
        .from('Customer_Data')
        .select('*');

      // Apply search filter on server
      if (searchQuery) {
        const trimmedQuery = searchQuery.trim();
        const numericSearch = Number(trimmedQuery);
        
        if (!isNaN(numericSearch) && trimmedQuery !== '') {
          // If search is a number, search by ID
          query = query.or(`Customer_Name.ilike.%${trimmedQuery}%,Customer_Mobile.ilike.%${trimmedQuery}%,id.eq.${numericSearch}`);
        } else {
          // Otherwise search by name and mobile
          query = query.or(`Customer_Name.ilike.%${trimmedQuery}%,Customer_Mobile.ilike.%${trimmedQuery}%`);
        }
      }

      // Apply sorting on server
      const sortColumn = sortField === 'Customer_Name' ? 'Customer_Name' : 
                        sortField === 'id' ? 'id' : 
                        'Created at';
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(from, to);

      const { data: customersData, error: customersError } = await query;

      console.log('Customers data received:', customersData);
      console.log('Number of customers:', customersData?.length);

      if (customersError) {
        console.error('Error fetching customers:', customersError);
        alert(`Error fetching customers: ${customersError.message}`);
        if (customersError.message.includes('permission') || customersError.message.includes('policy')) {
          alert('Permission denied. Please contact your administrator.');
        }
        throw customersError;
      }

      // Fetch all agents to map agent names (RLS allows authenticated users to read)
      const { data: agentsData, error: agentsError } = await supabase
        .from('Agent')
        .select('"Agent ID", "Full Name"');

      if (agentsError) {
        console.error('Error fetching agents:', agentsError);
        throw agentsError;
      }

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
        'id': customer['id'],
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when search changes
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

  const exportToCSV = async () => {
    try {
      console.log('Starting CSV export...');
      
      // Fetch ALL customers in batches (handles 300K+ records)
      const allCustomers: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;
      let batchCount = 0;

      while (hasMore) {
        console.log(`Fetching batch ${batchCount + 1}, records ${from + 1} to ${from + batchSize}...`);
        
        // Build the query for this batch
        let query = supabase
          .from('Customer_Data')
          .select('*');

        // Apply search filter if active
        if (searchQuery) {
          const trimmedQuery = searchQuery.trim();
          const numericSearch = Number(trimmedQuery);
          
          if (!isNaN(numericSearch) && trimmedQuery !== '') {
            // If search is a number, search by ID
            query = query.or(`Customer_Name.ilike.%${trimmedQuery}%,Customer_Mobile.ilike.%${trimmedQuery}%,id.eq.${numericSearch}`);
          } else {
            // Otherwise search by name and mobile
            query = query.or(`Customer_Name.ilike.%${trimmedQuery}%,Customer_Mobile.ilike.%${trimmedQuery}%`);
          }
        }

        // Apply sorting
        const sortColumn = sortField === 'Customer_Name' ? 'Customer_Name' : 
                          sortField === 'id' ? 'id' : 
                          'Created at';
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

        // Apply pagination for this batch
        query = query.range(from, from + batchSize - 1);

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching customers for export:', error);
          alert(`Failed to export customers at batch ${batchCount + 1}. Please try again.`);
          return;
        }

        if (data && data.length > 0) {
          allCustomers.push(...data);
          from += batchSize;
          batchCount++;
          hasMore = data.length === batchSize; // Stop if we got less than batch size
          console.log(`Fetched ${data.length} records. Total so far: ${allCustomers.length}`);
        } else {
          hasMore = false;
        }
      }

      console.log(`Export complete! Total records fetched: ${allCustomers.length}`);
      const allCustomersData = allCustomers;

      // Fetch agents for mapping
      const { data: agentsData } = await supabase
        .from('Agent')
        .select('"Agent ID", "Full Name"');

      const agentMap = new Map<number, string>();
      if (agentsData) {
        agentsData.forEach(agent => {
          agentMap.set(agent['Agent ID'], agent['Full Name']);
        });
      }

      // Prepare CSV headers
      const headers = ['Customer ID', 'Customer Name', 'Phone Number', 'Agent Name', 'Agent ID', 'Date Added'];
      
      // Prepare CSV rows
      const rows = (allCustomersData || []).map(customer => [
        customer['id'],
        customer['Customer_Name'],
        customer['Customer_Mobile'] || 'N/A',
        agentMap.get(customer['Agent ID']) || 'Unknown Agent',
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
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export customers. Please try again.');
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
          <main className="customers-content">
            <div className="page-header">
              <div className="page-title-section">
                <h1 className="page-title">Customers</h1>
                <p className="page-subtitle">Manage and view all customer records</p>
              </div>
              <div className="page-stats">
                <div className="stat-badge">
                  <span className="stat-value">{totalCount.toLocaleString()}</span>
                  <span className="stat-label">Total Customers</span>
                </div>
              </div>
            </div>

            <div className="filters-section">
              <div className="search-box">
                <span className="material-symbols-outlined search-icon">search</span>
                <input
                  type="text"
                  placeholder="Search by name, ID, or phone..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button className="clear-search" onClick={() => handleSearch('')}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>

              <div className="filter-controls">
                <button 
                  className="export-button"
                  onClick={exportToCSV}
                  disabled={totalCount === 0}
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
                  <p>
                    Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()} customers
                    {searchQuery && <span> (filtered)</span>}
                  </p>
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
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="empty-state">
                            <span className="material-symbols-outlined empty-icon">group_off</span>
                            <p>No customers found</p>
                            <small>Try adjusting your search or filters</small>
                          </td>
                        </tr>
                      ) : (
                        customers.map((customer) => (
                          <tr key={customer['id']} className="data-row">
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

                {/* Pagination Controls */}
                {totalCount > 0 && (
                  <div className="pagination-container">
                    <div className="pagination-controls">
                      <button 
                        className="pagination-button"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        title="First page"
                      >
                        <span className="material-symbols-outlined">first_page</span>
                      </button>
                      <button 
                        className="pagination-button"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        title="Previous page"
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      
                      <div className="pagination-info">
                        <span className="pagination-text">
                          Page <strong>{currentPage}</strong> of <strong>{Math.ceil(totalCount / pageSize)}</strong>
                        </span>
                      </div>

                      <button 
                        className="pagination-button"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                        title="Next page"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                      <button 
                        className="pagination-button"
                        onClick={() => setCurrentPage(Math.ceil(totalCount / pageSize))}
                        disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                        title="Last page"
                      >
                        <span className="material-symbols-outlined">last_page</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile Card View */}
                <div className="mobile-card-list">
                  {customers.length === 0 ? (
                    <div className="empty-state" style={{ background: '#ffffff', borderRadius: '8px', padding: '4rem 2rem' }}>
                      <span className="material-symbols-outlined empty-icon">group_off</span>
                      <p>No customers found</p>
                      <small>Try adjusting your search or filters</small>
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <div key={customer['id']} className="customer-card">
                        <div className="customer-card-header">
                          <div className="customer-avatar">
                            {getInitials(customer['Customer_Name'])}
                          </div>
                          <div className="customer-info">
                            <div className="customer-name">{customer['Customer_Name']}</div>
                          </div>
                        </div>
                        <div className="customer-card-body">
                          <div className="customer-card-row">
                            <span className="customer-card-label">Phone</span>
                            <span className="customer-card-value">{customer['Customer_Mobile'] || 'N/A'}</span>
                          </div>
                          <div className="customer-card-row">
                            <span className="customer-card-label">Agent</span>
                            <span className="customer-card-value">
                              <div className="agent-tag">
                                <span className="material-symbols-outlined agent-tag-icon">badge</span>
                                <span>{customer.agentName}</span>
                              </div>
                            </span>
                          </div>
                          <div className="customer-card-row">
                            <span className="customer-card-label">Date Added</span>
                            <span className="customer-card-value">{formatDate(customer['Created at'] || '')}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination Controls for Mobile */}
                {totalCount > 0 && (
                  <div className="pagination-container mobile-pagination">
                    <div className="pagination-controls">
                      <button 
                        className="pagination-button"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        title="First page"
                      >
                        <span className="material-symbols-outlined">first_page</span>
                      </button>
                      <button 
                        className="pagination-button"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        title="Previous page"
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      
                      <div className="pagination-info">
                        <span className="pagination-text">
                          Page <strong>{currentPage}</strong> of <strong>{Math.ceil(totalCount / pageSize)}</strong>
                        </span>
                      </div>

                      <button 
                        className="pagination-button"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                        title="Next page"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                      <button 
                        className="pagination-button"
                        onClick={() => setCurrentPage(Math.ceil(totalCount / pageSize))}
                        disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                        title="Last page"
                      >
                        <span className="material-symbols-outlined">last_page</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
