import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../infrastructure/supabase/client';
import { useAuth } from '../../infrastructure/auth/AuthContext';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardSidebar } from '../components/DashboardSidebar';
import './EngagementPage.css';

// Daily customer goal each agent is reminded about.
const DAILY_GOAL = 100;
// Production endpoints that deliver the messages. Fixed — admins don't touch these.
const SEND_REPORTS_URL = 'https://ai.oumlah.cloud/webhook/send-daily-reports';
const SEND_MESSAGE_URL = 'https://ai.oumlah.cloud/webhook/broadcast-message';
const MESSAGE_MAX = 2000;

export const EngagementPage = () => {
  const { isViewer } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [recipients, setRecipients] = useState<number | null>(null);

  // Daily reports
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  // Broadcast message
  const [message, setMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastCount, setBroadcastCount] = useState<number | null>(null);
  const [broadcastFailed, setBroadcastFailed] = useState(false);

  useEffect(() => {
    fetchRecipients();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // How many agents will receive messages (only fully set-up agents).
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

  const handleSendReports = async () => {
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
      console.error('Failed to send daily reports:', e);
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  const handleBroadcast = async () => {
    const text = message.trim();
    if (!text) return;

    const confirmed = window.confirm(
      `Send this message to ${recipients ?? 'your'} agents now?`
    );
    if (!confirmed) return;

    setBroadcasting(true);
    setBroadcastFailed(false);
    setBroadcastCount(null);

    try {
      const res = await fetch(SEND_MESSAGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

      const data = await res.json().catch(() => ({}));
      setBroadcastCount(typeof data.sent === 'number' ? data.sent : (recipients ?? 0));
      setMessage('');
    } catch (e) {
      console.error('Failed to send broadcast:', e);
      setBroadcastFailed(true);
    } finally {
      setBroadcasting(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Read-only users can't reach Engagement (write action), even by typing the URL.
  if (isViewer) {
    return <Navigate to="/dashboard" replace />;
  }

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
                <p className="page-subtitle">Reach your agents with reminders and messages</p>
              </div>
            </div>

            <div className="engage-simple">
              {/* Daily reminders */}
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
                  onClick={handleSendReports}
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

              {/* Broadcast message */}
              <div className="engage-card">
                <div className="engage-icon">
                  <span className="material-symbols-outlined">send</span>
                </div>

                <h2 className="engage-heading">Send a Message</h2>
                <p className="engage-text">
                  Write a message and send it to all your agents at once.
                </p>

                <div className="broadcast-field">
                  <textarea
                    className="broadcast-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
                    placeholder="Write your message to the agents..."
                    rows={5}
                  />
                  <div className="broadcast-meta">
                    <span>Goes to {recipients === null ? '—' : recipients} agents</span>
                    <span>{message.length} / {MESSAGE_MAX}</span>
                  </div>
                </div>

                {broadcastCount !== null && (
                  <div className="engage-banner success">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Sent! Your message reached {broadcastCount} agent{broadcastCount === 1 ? '' : 's'}.</span>
                  </div>
                )}
                {broadcastFailed && (
                  <div className="engage-banner error">
                    <span className="material-symbols-outlined">error</span>
                    <span>We couldn't send your message right now. Please try again in a moment.</span>
                  </div>
                )}

                <button
                  className="send-button"
                  onClick={handleBroadcast}
                  disabled={broadcasting || !message.trim() || recipients === 0}
                >
                  {broadcasting ? (
                    <>
                      <span className="material-symbols-outlined spinner">progress_activity</span>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      <span>Send Message</span>
                    </>
                  )}
                </button>

                <p className="engage-footnote">Your message is delivered to each agent on Telegram.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
