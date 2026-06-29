import { useState, useEffect } from 'react';
import { supabase } from '../../infrastructure/supabase/client';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardSidebar } from '../components/DashboardSidebar';
import './EngagementPage.css';

// Daily customer goal each agent is reminded about.
const DAILY_GOAL = 100;
// Production endpoint that sends the reminders. Fixed — admins don't touch this.
const SEND_REPORTS_URL = 'https://ai.oumlah.cloud/webhook/send-daily-reports';

export const EngagementPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [recipients, setRecipients] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchRecipients();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // How many agents will receive today's reminder (only fully set-up agents).
  const fetchRecipients = async () => {
    const { count, error } = await supabase
      .from('agentsdata')
      .select('*', { count: 'exact', head: true })
      .eq('step', 'done');
    if (error) {
      console.error('Error counting recipients:', error);
      setRecipients(0);
      return;
    }
    setRecipients(count ?? 0);
  };

  const handleSend = async () => {
    const confirmed = window.confirm(
      `Send today's reminder to ${recipients ?? 'your'} agents now?`
    );
    if (!confirmed) return;

    setSending(true);
    setFailed(false);
    setSentCount(null);

    try {
      const res = await fetch(SEND_REPORTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'dashboard', triggeredAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

      const data = await res.json().catch(() => ({}));
      setSentCount(typeof data.sent === 'number' ? data.sent : (recipients ?? 0));
    } catch (e) {
      // Keep the technical detail in the console; show the admin a friendly message.
      console.error('Failed to send daily reports:', e);
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        {isSidebarOpen && window.innerWidth <= 768 && (
          <div className="sidebar-backdrop visible" onClick={toggleSidebar} />
        )}
        <DashboardSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <div className={`dashboard-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <DashboardHeader onMenuClick={toggleSidebar} />
          <main className="engagement-content">
            <div className="page-header">
              <div className="page-title-section">
                <h1 className="page-title">Engagement</h1>
                <p className="page-subtitle">Send your agents their daily goal and progress</p>
              </div>
            </div>

            <div className="engage-simple">
              <div className="engage-card">
                <div className="engage-icon">
                  <span className="material-symbols-outlined">campaign</span>
                </div>

                <h2 className="engage-heading">Send Today's Reminders</h2>
                <p className="engage-text">
                  Each agent gets a friendly message showing how many customers they've added today
                  and how close they are to the daily goal.
                </p>

                <div className="engage-facts">
                  <div className="engage-fact">
                    <span className="engage-fact-value">{DAILY_GOAL}</span>
                    <span className="engage-fact-label">Daily goal (customers)</span>
                  </div>
                  <div className="engage-fact">
                    <span className="engage-fact-value">{recipients === null ? '—' : recipients}</span>
                    <span className="engage-fact-label">Agents to notify</span>
                  </div>
                </div>

                {sentCount !== null && (
                  <div className="engage-banner success">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Done! Today's reminders were sent to {sentCount} agent{sentCount === 1 ? '' : 's'}.</span>
                  </div>
                )}
                {failed && (
                  <div className="engage-banner error">
                    <span className="material-symbols-outlined">error</span>
                    <span>We couldn't send the reminders right now. Please try again in a moment.</span>
                  </div>
                )}

                <button
                  className="send-button"
                  onClick={handleSend}
                  disabled={sending || recipients === 0}
                >
                  {sending ? (
                    <>
                      <span className="material-symbols-outlined spinner">progress_activity</span>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">campaign</span>
                      <span>Send Daily Reports</span>
                    </>
                  )}
                </button>

                <p className="engage-footnote">Reminders are delivered to each agent on Telegram.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
