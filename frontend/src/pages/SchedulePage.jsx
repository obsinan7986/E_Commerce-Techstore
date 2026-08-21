/**
 * Schedule Page — /comm/schedule
 * Shows today's meetings, upcoming meetings, and recent past meetings
 * for all authorized staff roles.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMeetingSchedule } from "../services/adminservice";
import "../styles/commModule.css";

const STATUS_CLS = {
  Scheduled: "cm-badge cm-badge--scheduled",
  Completed: "cm-badge cm-badge--completed",
  Cancelled: "cm-badge cm-badge--cancelled",
};
const TYPE_ICON = { Physical: "📍", Online: "🔗" };

const fmt = (iso) => iso
  ? new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  : "—";

const MeetingRow = ({ m }) => (
  <div className="cm-schedule-row">
    <div className="cm-schedule-date">
      <strong>{new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong>
      <span>{new Date(m.date).getFullYear()}</span>
    </div>
    <div className="cm-schedule-body">
      <div className="cm-schedule-top">
        <span className="cm-type-icon">{TYPE_ICON[m.meetingType]}</span>
        <strong>{m.title}</strong>
        <span className={STATUS_CLS[m.status]}>{m.status}</span>
      </div>
      <div className="cm-schedule-meta">
        <span>⏰ {m.startTime} – {m.endTime}</span>
        {m.location && <span>📍 {m.location}</span>}
        {m.meetingType === "Online" && m.meetingLink && (
          <a href={m.meetingLink} target="_blank" rel="noreferrer" className="cm-link">🔗 Join</a>
        )}
        <span>👤 {m.createdBy?.fullName || "—"}</span>
      </div>
    </div>
  </div>
);

const SchedulePage = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getMeetingSchedule();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const today = data?.todayMeetings || [];
  const upcoming = data?.upcoming || [];
  const recent = data?.recent || [];

  return (
    <div className="cm-page">
      <div className="cm-header">
        <div>
          <h1>🗓 Schedule</h1>
          <p>Your meeting calendar</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="cm-refresh-btn" onClick={load}>↻ Refresh</button>
          <Link to="/comm/meetings" className="cm-refresh-btn">All Meetings →</Link>
        </div>
      </div>

      {error && <div className="cm-alert cm-alert--error">{error}</div>}

      {loading ? (
        <div className="cm-loading">Loading schedule…</div>
      ) : (
        <>
          {/* Today */}
          <div className="cm-schedule-section">
            <h2 className="cm-schedule-heading">
              <span className="cm-schedule-dot cm-schedule-dot--today" />
              Today
              {today.length > 0 && <span className="cm-schedule-count">{today.length}</span>}
            </h2>
            {today.length === 0 ? (
              <div className="cm-schedule-empty">No meetings today.</div>
            ) : (
              <div className="cm-schedule-list">
                {today.map(m => <MeetingRow key={m._id} m={m} />)}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="cm-schedule-section">
            <h2 className="cm-schedule-heading">
              <span className="cm-schedule-dot cm-schedule-dot--upcoming" />
              Upcoming
              {upcoming.length > 0 && <span className="cm-schedule-count">{upcoming.length}</span>}
            </h2>
            {upcoming.length === 0 ? (
              <div className="cm-schedule-empty">No upcoming meetings.</div>
            ) : (
              <div className="cm-schedule-list">
                {upcoming.map(m => <MeetingRow key={m._id} m={m} />)}
              </div>
            )}
          </div>

          {/* Recent */}
          {recent.length > 0 && (
            <div className="cm-schedule-section">
              <h2 className="cm-schedule-heading">
                <span className="cm-schedule-dot cm-schedule-dot--past" />
                Recent
              </h2>
              <div className="cm-schedule-list cm-schedule-list--past">
                {recent.map(m => <MeetingRow key={m._id} m={m} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SchedulePage;
