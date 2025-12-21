import { useState, useEffect } from 'react';
import { supabase } from '../../infrastructure/supabase/client';
import { useNavigate } from 'react-router-dom';
import bannerImage from '../../assets/banner.png';
import './DashboardContent.css';

interface Agent {
  'Agent ID': number;
  'Full Name': string;
  customerCount: number;
}

export const DashboardContent = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name?: string; lastLogin?: string; accountName?: string; accountNumber?: string } | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [activeAgents, setActiveAgents] = useState(0);
  const [averageCustomersPerDay, setAverageCustomersPerDay] = useState(0);
  const [weeklyCustomerData, setWeeklyCustomerData] = useState<number[]>([]);
  const [monthlyCustomerData, setMonthlyCustomerData] = useState<number[]>([]);
  const [topAgents, setTopAgents] = useState<Agent[]>([]);
  const [inactiveAgents, setInactiveAgents] = useState<Agent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [showAllAgents, setShowAllAgents] = useState(false);
  const [showAllInactive, setShowAllInactive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        const lastLogin = user.last_sign_in_at 
          ? new Date(user.last_sign_in_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Just now';
        const accountName = user.user_metadata?.organization || user.email?.split('@')[1]?.split('.')[0]?.toUpperCase() || 'ORGANIZATION';
        const accountNumber = user.user_metadata?.account_number || `#SD${user.id?.slice(0, 6) || '1123'}`;
        
        setUser({ name, lastLogin, accountName, accountNumber });
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);

        // Fetch dashboard metrics using database function (accurate for all data, no 1000 limit)
        const { data: metricsData, error: metricsError } = await supabase
          .rpc('get_dashboard_metrics');

        if (metricsError) {
          console.error('Error fetching dashboard metrics:', metricsError);
          throw metricsError;
        }

        if (metricsData) {
          setTotalCustomers(metricsData.total_customers || 0);
          setActiveAgents(metricsData.active_agents || 0);
          setAverageCustomersPerDay(metricsData.avg_customers_per_day || 0);
          console.log('Dashboard metrics loaded:', metricsData);
        }

        // Fetch daily customer counts for charts (last 120 days to cover 4 months)
        const { data: dailyCountsData, error: dailyCountsError } = await supabase
          .rpc('get_daily_customer_counts', { days_back: 120 });

        if (dailyCountsError) {
          console.error('Error fetching daily counts:', dailyCountsError);
        }

        // Calculate weekly and monthly data from daily counts
        if (dailyCountsData && dailyCountsData.length > 0) {
          const now = new Date();
          
          // Create a map for easy lookup
          const dailyCountMap = new Map<string, number>();
          dailyCountsData.forEach(row => {
            dailyCountMap.set(row.date, Number(row.customer_count));
          });

          console.log('=== Weekly Data Calculation (DB Function) ===');
          console.log('Daily counts received:', dailyCountsData.length, 'days');
          
          // Calculate weekly data (last 7 days)
          const weeklyData: number[] = [];
          for (let i = 6; i >= 0; i--) {
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() - i);
            const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
            
            const dayCount = dailyCountMap.get(targetDateStr) || 0;
            weeklyData.push(dayCount);
            
            if (i === 0) { // Today
              console.log('TODAY:', targetDateStr, '- Count:', dayCount);
            }
          }
          setWeeklyCustomerData(weeklyData);
          console.log('Weekly customer data:', weeklyData);
          console.log('=== End Weekly Data Debug ===');

          // Calculate monthly data (last 4 months)
          const monthlyData: number[] = [];
          for (let i = 3; i >= 0; i--) {
            const targetYear = now.getFullYear();
            const targetMonth = now.getMonth() - i;
            const compareDate = new Date(targetYear, targetMonth, 1);
            const targetYearFinal = compareDate.getFullYear();
            const targetMonthFinal = compareDate.getMonth();
            
            // Sum all days in this month
            const monthCount = dailyCountsData
              .filter(row => {
                const rowDate = new Date(row.date);
                return rowDate.getFullYear() === targetYearFinal && 
                       rowDate.getMonth() === targetMonthFinal;
              })
              .reduce((sum, row) => sum + Number(row.customer_count), 0);
            
            monthlyData.push(monthCount);
          }
          setMonthlyCustomerData(monthlyData);
          console.log('Monthly customer data:', monthlyData);
        } else {
          setWeeklyCustomerData([0, 0, 0, 0, 0, 0, 0]);
          setMonthlyCustomerData([0, 0, 0, 0]);
        }

        // Fetch all agents
        const { data: agents, error: agentsError } = await supabase
          .from('Agent')
          .select('"Agent ID", "Full Name"');

        if (agentsError) {
          console.error('Error fetching agents:', agentsError);
          throw agentsError;
        }

        // Get accurate customer counts per agent using database function (no 1000 limit)
        const { data: agentCountsData, error: countsError } = await supabase
          .rpc('get_agent_customer_counts');

        if (countsError) {
          console.error('Error fetching agent customer counts:', countsError);
          throw countsError;
        }

        // Create a map for easy lookup
        const agentCustomerCounts = new Map<number, number>();
        if (agentCountsData) {
          agentCountsData.forEach(row => {
            agentCustomerCounts.set(row.agent_id, Number(row.customer_count));
          });
        }

        console.log('Agent customer counts loaded:', agentCustomerCounts.size, 'agents with customers');

        // Prepare agent data with customer counts
        const agentsWithCounts: Agent[] = (agents || []).map(agent => ({
          'Agent ID': agent['Agent ID'],
          'Full Name': agent['Full Name'],
          customerCount: agentCustomerCounts.get(agent['Agent ID']) || 0,
        }));

        // Store all agents for "See All" functionality
        const sortedAgents = [...agentsWithCounts].sort((a, b) => b.customerCount - a.customerCount);
        setAllAgents(sortedAgents);

        // Get top 5 performing agents (sorted by customer count)
        const top5 = sortedAgents.slice(0, 5);
        setTopAgents(top5);
        console.log('Top 5 agents:', top5);

        // Get inactive agents (zero customers)
        const inactive = agentsWithCounts.filter(agent => agent.customerCount === 0);
        setInactiveAgents(inactive);

      } catch (error) {
        console.error('Error fetching metrics:', error);
        // Set default values on error
        setTotalCustomers(0);
        setActiveAgents(0);
        setAverageCustomersPerDay(0);
        setWeeklyCustomerData([0, 0, 0, 0, 0, 0, 0]);
        setMonthlyCustomerData([0, 0, 0, 0]);
        setTopAgents([]);
        setInactiveAgents([]);
        setAllAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const displayedTopAgents = showAllAgents ? allAgents : topAgents.slice(0, 5);
  const displayedInactiveAgents = showAllInactive ? inactiveAgents : inactiveAgents.slice(0, 5);

  return (
    <main className="dashboard-content">
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome Back, {user?.name || 'User'}</h1>
        <div className="account-info">
          <p className="account-name">ACCOUNT NAME: {user?.accountName || 'ORGANIZATION'}</p>
          <p className="account-number">ACCOUNT NUMBER: {user?.accountNumber || '#SD1123'}</p>
        </div>
      </div>

      <div className="banner-section">
        <img src={bannerImage} alt="Sudani Business Data Plan" className="banner-image" />
      </div>

      {loading ? (
        <div className="loading-state">Loading metrics...</div>
      ) : (
        <>
          {/* First Row - Simple KPI Cards */}
          <div className="kpi-section kpi-summary">
            <div className="kpi-card-simple kpi-card-customers">
              <div className="kpi-icon-simple">
                <span className="material-symbols-outlined">group</span>
              </div>
              <div className="kpi-content-simple">
                <p className="kpi-name-placeholder">Total Customers</p>
                <p className="kpi-data-placeholder">{totalCustomers}</p>
              </div>
            </div>

            <div className="kpi-card-simple kpi-card-agents">
              <div className="kpi-icon-simple">
                <span className="material-symbols-outlined">badge</span>
              </div>
              <div className="kpi-content-simple">
                <p className="kpi-name-placeholder">Active Agents</p>
                <p className="kpi-data-placeholder">{activeAgents}</p>
              </div>
            </div>

            <div className="kpi-card-simple kpi-card-average">
              <div className="kpi-icon-simple">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <div className="kpi-content-simple">
                <p className="kpi-name-placeholder">Avg Customers/Day</p>
                <p className="kpi-data-placeholder">{averageCustomersPerDay.toFixed(1)}</p>
              </div>
            </div>
          </div>

          {/* Second Row - KPI Chart Cards */}
          <div className="kpi-section kpi-charts">
            <div className="kpi-chart-card">
              <div className="chart-header">
                <p className="chart-kpi-name">Top 5 Agents</p>
              </div>
              <div className="chart-visualization">
                <div className="bar-chart">
                  {topAgents.slice(0, 5).map((agent, index) => {
                    const maxValue = Math.max(...topAgents.slice(0, 5).map(a => a.customerCount), 1);
                    const maxBarHeight = 120; // Maximum bar height in pixels
                    const height = maxValue > 0 ? (agent.customerCount / maxValue) * maxBarHeight : 0;
                    return (
                      <div key={agent['Agent ID']} className="bar-container">
                        <div className="bar-wrapper">
                          <span className="bar-count-top">{agent.customerCount}</span>
                          <div className="bar" style={{ height: `${height}px` }}></div>
                        </div>
                        <span className="bar-label">{agent['Full Name']}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="chart-description">Number of customers added by each agent</p>
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${topAgents.length > 0 ? (topAgents[0].customerCount / Math.max(totalCustomers, 1)) * 100 : 0}%` }}></div>
                </div>
                <div className="progress-labels">
                  <span className="progress-percentage">{topAgents.length > 0 ? topAgents[0].customerCount : 0}</span>
                  <span className="progress-value">customers</span>
                </div>
              </div>
            </div>

            <div className="kpi-chart-card">
              <div className="chart-header">
                <p className="chart-kpi-name">Weekly Performance</p>
              </div>
              <div className="chart-visualization">
                <div className="bar-chart">
                  {weeklyCustomerData.map((value, index) => {
                    const maxValue = Math.max(...weeklyCustomerData, 1);
                    const maxBarHeight = 120;
                    const height = maxValue > 0 ? (value / maxValue) * maxBarHeight : 0;
                    
                    // Calculate the date for each day
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - index));
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const isToday = index === 6;
                    
                    return (
                      <div key={index} className="bar-container">
                        <div className="bar-wrapper">
                          <span className="bar-count-top">{value}</span>
                          <div className="bar" style={{ height: `${height}px` }}></div>
                        </div>
                        <span className={`bar-label ${isToday ? 'bar-label-today' : ''}`}>
                          {dayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="chart-description">Last 7 days customer acquisition</p>
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${weeklyCustomerData.reduce((a, b) => a + b, 0) > 0 ? (weeklyCustomerData.reduce((a, b) => a + b, 0) / Math.max(totalCustomers, 1)) * 100 : 0}%` }}></div>
                </div>
                <div className="progress-labels">
                  <span className="progress-percentage">{weeklyCustomerData.reduce((a, b) => a + b, 0)}</span>
                  <span className="progress-value">this week</span>
                </div>
              </div>
            </div>

            <div className="kpi-chart-card">
              <div className="chart-header">
                <p className="chart-kpi-name">Monthly Performance</p>
              </div>
              <div className="chart-visualization">
                <div className="bar-chart">
                  {monthlyCustomerData.map((value, index) => {
                    const maxValue = Math.max(...monthlyCustomerData, 1);
                    const maxBarHeight = 120;
                    const height = maxValue > 0 ? (value / maxValue) * maxBarHeight : 0;
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const now = new Date();
                    const monthIndex = (now.getMonth() - (3 - index) + 12) % 12;
                    return (
                      <div key={index} className="bar-container">
                        <div className="bar-wrapper">
                          <span className="bar-count-top">{value}</span>
                          <div className="bar" style={{ height: `${height}px` }}></div>
                        </div>
                        <span className="bar-label">{monthNames[monthIndex]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="chart-description">Last 4 months customer acquisition</p>
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${monthlyCustomerData.reduce((a, b) => a + b, 0) > 0 ? (monthlyCustomerData.reduce((a, b) => a + b, 0) / Math.max(totalCustomers, 1)) * 100 : 0}%` }}></div>
                </div>
                <div className="progress-labels">
                  <span className="progress-percentage">{monthlyCustomerData.reduce((a, b) => a + b, 0)}</span>
                  <span className="progress-value">last 4 months</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Listing Tables */}
          <div className="users-section">
            <h3 className="users-section-title">Top Performing Agents</h3>
            <div className="users-table-container">
              <table className="users-table">
                <tbody>
                  {displayedTopAgents.map((agent, index) => (
                    <tr key={agent['Agent ID']} className="user-row">
                      <td className="user-avatar-cell">
                        <div className="user-avatar-circle">
                          {getInitials(agent['Full Name'])}
                        </div>
                      </td>
                      <td className="user-info-cell">
                        <div className="user-name-text">{agent['Full Name']}</div>
                        <div className="user-id-text">ID: {agent['Agent ID']}</div>
                      </td>
                      <td className="user-role-cell">
                        <span className="role-tag">sales</span>
                      </td>
                      <td className="user-dates-cell">
                        <div className="user-dates">
                          <span>{formatDate(new Date())}</span>
                          <span>{formatDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(allAgents.length > 5 || showAllAgents) && (
                <button 
                  className="see-all-button"
                  onClick={() => navigate('/agents')}
                >
                  See All
                </button>
              )}
            </div>
          </div>

        </>
      )}
    </main>
  );
};
