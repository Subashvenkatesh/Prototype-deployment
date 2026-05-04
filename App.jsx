import { useState } from "react";

// ─── Design tokens (B&W system per PROTOTYPE.md) ──────────────────────────────
const T = {
  bg: '#FFFFFF', bgS: '#F7F7F7', bgT: '#EBEBEB',
  border: '#E0E0E0', borderStrong: '#111111',
  text: '#0A0A0A', textS: '#4A4A4A', textM: '#909090',
  accent: '#000000',
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// ─── Use case definitions ─────────────────────────────────────────────────────
const USE_CASES = [
  { id: 'uc01', label: 'UC-01 — Admin Views Dashboard',      role: 'Admin'       },
  { id: 'uc02', label: 'UC-02 — Admin Manages a User',       role: 'Admin'       },
  { id: 'uc03', label: 'UC-03 — Admin Invites Team Member',  role: 'Admin'       },
  { id: 'uc04', label: 'UC-04 — Team Member Views Reports',  role: 'Team Member' },
  { id: 'uc05', label: 'UC-05 — Admin Reviews Audit Trail',  role: 'Admin'       },
  { id: 'uc06', label: 'UC-06 — Admin Configures RBAC',      role: 'Admin'       },
];

// ─── Flow graph ───────────────────────────────────────────────────────────────
const FLOWS = {
  uc01: { start: 'dashboard', screens: {
    'dashboard':       { label: 'Unified Dashboard',           branches: [{ label: '✓ Data connected — view metrics', to: 'dashboard-full' }, { label: '○ No data source connected', to: 'dashboard-empty' }, { label: '✕ Data fetch failed', to: 'dashboard-error' }] },
    'dashboard-full':  { label: 'Dashboard — Live Metrics',    branches: [{ label: '→ Monitor / exit', to: null }, { label: '⚠ Anomaly detected — drill in', to: 'funnel-drill' }] },
    'dashboard-empty': { label: 'Dashboard — Empty State',     next: null },
    'dashboard-error': { label: 'Dashboard — Error State',     next: 'dashboard' },
    'funnel-drill':    { label: 'Funnel Drilldown',            next: 'detail-view' },
    'detail-view':     { label: 'Detail Breakdown',            next: null },
  }},
  uc02: { start: 'user-list', screens: {
    'user-list':          { label: 'User Management',         branches: [{ label: '→ User found — open profile', to: 'user-profile' }, { label: '✕ User not found', to: 'user-not-found' }] },
    'user-not-found':     { label: 'User Not Found',          next: 'user-list' },
    'user-profile':       { label: 'User Profile',            branches: [{ label: '✏ Edit role', to: 'role-edit' }, { label: '⊘ Block this user', to: 'block-confirm' }] },
    'role-edit':          { label: 'Edit Role',               branches: [{ label: '⚠ Last admin — block action', to: 'last-admin-block' }, { label: '✓ Save role change', to: 'action-success' }, { label: '✕ Save fails', to: 'save-error' }] },
    'block-confirm':      { label: 'Block User — Confirm',    branches: [{ label: '⚠ Blocking own account', to: 'self-block-warning' }, { label: '✓ Confirm block', to: 'action-success' }] },
    'last-admin-block':   { label: 'Last Admin — Blocked',    next: 'user-profile' },
    'self-block-warning': { label: 'Self-Block Warning',      next: 'user-profile' },
    'action-success':     { label: 'Action Saved',            next: null },
    'save-error':         { label: 'Save Failed',             next: 'user-profile' },
  }},
  uc03: { start: 'team-settings', screens: {
    'team-settings':  { label: 'Settings — Team',        next: 'invite-form' },
    'invite-form':    { label: 'Invite Team Member',      branches: [{ label: '✕ Invalid email format', to: 'invite-validation' }, { label: '⚠ Email already exists', to: 'invite-exists' }, { label: '✓ Send invite', to: 'invite-pending' }] },
    'invite-validation': { label: 'Validation Error',    next: 'invite-form' },
    'invite-exists':  { label: 'Email Already in Workspace', next: 'invite-form' },
    'invite-pending': { label: 'Invite Sent — Pending',  branches: [{ label: '✓ Invitee clicks valid link', to: 'account-creation' }, { label: '⚠ Invite link expired', to: 'link-expired' }, { label: '✕ Send failed', to: 'invite-failed' }] },
    'invite-failed':  { label: 'Invite Send Failed',     next: 'invite-form' },
    'link-expired':   { label: 'Invite Link Expired',    next: 'invite-pending' },
    'account-creation': { label: 'Account Creation',     next: 'member-onboarded' },
    'member-onboarded': { label: 'Team Member Onboarded', next: null },
  }},
  uc04: { start: 'member-dashboard', screens: {
    'member-dashboard': { label: 'Limited Dashboard',       next: 'analytics' },
    'analytics':        { label: 'Analytics',               branches: [{ label: '✓ Data available — view charts', to: 'analytics-full' }, { label: '○ No data for time range', to: 'analytics-empty' }, { label: '✕ Data load failure', to: 'analytics-error' }] },
    'analytics-full':   { label: 'Analytics — Funnel & Trends', branches: [{ label: '⊘ Attempt User Management', to: 'access-denied' }, { label: '✓ Export report', to: 'export-success' }, { label: '→ Exit flow', to: null }] },
    'analytics-empty':  { label: 'Analytics — Empty State',  next: 'analytics' },
    'analytics-error':  { label: 'Analytics — Load Error',   next: 'analytics' },
    'access-denied':    { label: 'Access Denied',            next: 'analytics-full' },
    'export-success':   { label: 'Report Exported',          next: null },
  }},
  uc05: { start: 'activity-logs', screens: {
    'activity-logs': { label: 'Activity Logs',          branches: [{ label: '✓ Logs found — view results', to: 'log-results' }, { label: '○ No matching logs', to: 'logs-empty' }, { label: '⚠ Beyond retention period', to: 'logs-archived' }, { label: '✕ Fetch failed', to: 'logs-error' }] },
    'log-results':   { label: 'Log Results',            next: 'log-detail' },
    'logs-empty':    { label: 'Logs — Empty State',     next: 'activity-logs' },
    'logs-archived': { label: 'Logs — Archived Period', next: 'activity-logs' },
    'log-detail':    { label: 'Event Detail',           next: null },
    'logs-error':    { label: 'Logs — Fetch Error',     next: 'activity-logs' },
  }},
  uc06: { start: 'permissions', screens: {
    'permissions':        { label: 'Settings — Permissions', next: 'permissions-edit' },
    'permissions-edit':   { label: 'Edit Permissions',        branches: [{ label: '⚠ Removing own admin access', to: 'self-lockout' }, { label: '✓ Save configuration', to: 'permissions-saving' }] },
    'self-lockout':       { label: 'Self-Lockout Blocked',    next: 'permissions-edit' },
    'permissions-saving': { label: 'Saving Configuration',   branches: [{ label: '✓ Saved — active users affected', to: 'session-refresh' }, { label: '✓ Saved — no active users', to: 'permissions-saved' }, { label: '✕ Save failed', to: 'save-error' }] },
    'session-refresh':    { label: 'Session Refresh Notice',  next: 'permissions-saved' },
    'permissions-saved':  { label: 'Permissions Saved',       next: null },
    'save-error':         { label: 'Save Failed',             next: 'permissions-edit' },
  }},
};

// ─── Shared UI primitives ──────────────────────────────────────────────────────
function Badge({ text, type = 'default' }) {
  const map = { default: [T.bgT, T.textS], success: ['#E8F5E9', '#1B5E20'], error: ['#FFEBEE', '#B71C1C'], warning: ['#FFF8E1', '#7A5200'], accent: [T.text, '#fff'] };
  const [bg, color] = map[type] || map.default;
  return <span style={{ background: bg, color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{text}</span>;
}

function StatCard({ label, value, sub, trend }) {
  return (
    <div style={{ padding: 18, border: `1px solid ${T.border}`, borderRadius: 8 }}>
      <div style={{ fontSize: 11, color: T.textM, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.textS, marginTop: 6 }}>{sub}</div>}
      {trend && <div style={{ fontSize: 12, color: trend.startsWith('+') ? '#1B5E20' : '#C00', marginTop: 4, fontWeight: 600 }}>{trend}</div>}
    </div>
  );
}

function DataTable({ headers, rows }) {
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${T.borderStrong}`, background: T.bgS }}>
            {headers.map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.textS }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              {row.map((cell, j) => <td key={j} style={{ padding: '12px 14px' }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FunnelBar({ label, value, max }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
        <span style={{ color: T.textS }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{value.toLocaleString()} <span style={{ fontWeight: 400, color: T.textM, fontSize: 11 }}>({Math.round(value/max*100)}%)</span></span>
      </div>
      <div style={{ background: T.bgT, borderRadius: 4, height: 8 }}>
        <div style={{ background: T.text, height: '100%', width: `${(value/max)*100}%`, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function EmptyState({ icon, title, message, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: T.textS, maxWidth: 360, lineHeight: 1.6, marginBottom: 24 }}>{message}</div>
      {action && <button style={{ padding: '9px 20px', background: T.text, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>{action}</button>}
    </div>
  );
}

function AlertBanner({ type, message }) {
  const styles = {
    error:   { bg: '#FFF5F5', border: '#E00', icon: '✕', color: '#900' },
    warning: { bg: '#FFFBF0', border: '#D4A800', icon: '⚠', color: '#664A00' },
    success: { bg: '#F0FFF4', border: '#2E7D32', icon: '✓', color: '#1B5E20' },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
      <span style={{ fontWeight: 700, color: s.color, fontSize: 14, flexShrink: 0 }}>{s.icon}</span>
      <span style={{ fontSize: 13, color: s.color, lineHeight: 1.5 }}>{message}</span>
    </div>
  );
}

// ─── Screen content registry ──────────────────────────────────────────────────
const Screens = {
  // ── UC-01 ──────────────────────────────────────────────────────────────────
  'dashboard': () => (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700 }}>Dashboard</h2>
      <p style={{ color: T.textM, fontSize: 13, marginBottom: 24 }}>Checking data connection... Select a scenario below to continue the flow.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {[['Total Users','—','Awaiting data...'],['Active Today','—','Awaiting data...'],['Conversion Rate','—','Awaiting data...'],['Drop-off Rate','—','Awaiting data...']].map(([l,v,s]) => <StatCard key={l} label={l} value={v} sub={s} />)}
      </div>
    </div>
  ),

  'dashboard-full': () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div><h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Dashboard</h2><p style={{ margin: 0, color: T.textM, fontSize: 12 }}>Last updated 2 min ago · Last 30 days</p></div>
        <select style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, background: T.bg }}><option>Last 30 days</option><option>Last 7 days</option><option>Last 90 days</option></select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Users" value="12,483" sub="Active accounts" trend="+8.2% vs last month" />
        <StatCard label="Active Today" value="1,842" sub="Unique sessions" trend="+3.1% vs yesterday" />
        <StatCard label="Conversion Rate" value="4.7%" sub="Sign-up → Active" trend="-0.3% vs last week" />
        <StatCard label="Drop-off Rate" value="31%" sub="Onboarding funnel" trend="+5.1% ⚠" />
      </div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>User Activity — Last 30 Days</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 90 }}>
          {[40,55,48,62,58,70,75,68,80,72,85,78,90,88,76,83,92,89,95,88,92,87,94,90,96,88,91,85,88,82].map((h,i) => (
            <div key={i} style={{ flex: 1, background: i===25 ? T.text : T.bgT, height: `${h}%`, borderRadius:'2px 2px 0 0', minWidth: 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textM, marginTop: 6 }}><span>Apr 1</span><span>Apr 15</span><span>Apr 30</span></div>
      </div>
      <div style={{ padding: 16, border: `2px solid ${T.borderStrong}`, borderRadius: 8, background: '#FFFBF0' }}>
        <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>⚠ Anomaly Detected — Apr 25</div>
        <div style={{ fontSize: 13, color: T.textS }}>Drop-off spiked +5.1% during Onboarding Step 3. Select "Drill in" to investigate.</div>
      </div>
    </div>
  ),

  'dashboard-empty': () => (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>Dashboard</h2>
      <EmptyState icon="📡" title="No data connected yet" message="Circuit Admin needs a data source before it can show metrics. Connect your backend via SDK or API to get started." action="Connect Data Source" />
    </div>
  ),

  'dashboard-error': () => (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700 }}>Dashboard</h2>
      <AlertBanner type="error" message="Unable to fetch live data. Displaying cached values from 2 hours ago. Some figures may be outdated." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, opacity: 0.6, marginBottom: 20 }}>
        <StatCard label="Total Users" value="12,201" sub="Cached · 2h ago" />
        <StatCard label="Active Today" value="1,786" sub="Cached · 2h ago" />
        <StatCard label="Conversion Rate" value="4.9%" sub="Cached · 2h ago" />
        <StatCard label="Drop-off Rate" value="26%" sub="Cached · 2h ago" />
      </div>
      <button style={{ padding: '9px 20px', background: T.text, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>↻ Retry</button>
    </div>
  ),

  'funnel-drill': () => (
    <div>
      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Funnel Drilldown</h2>
      <p style={{ color: T.textM, fontSize: 12, marginBottom: 20 }}>Onboarding Funnel · Apr 25, 2026</p>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <FunnelBar label="Step 1 — Sign Up" value={3842} max={3842} />
        <FunnelBar label="Step 2 — Email Verify" value={3601} max={3842} />
        <FunnelBar label="Step 3 — Profile Setup ⚠" value={2190} max={3842} />
        <FunnelBar label="Step 4 — Connect Source" value={1847} max={3842} />
        <FunnelBar label="Step 5 — First Dashboard" value={1542} max={3842} />
      </div>
      <div style={{ padding: 14, background: T.bgS, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.textS }}>
        <strong style={{ color: T.text }}>Biggest drop: Step 2 → 3.</strong> 39% of verified users did not complete Profile Setup — up 5.1% vs last week.
      </div>
    </div>
  ),

  'detail-view': () => (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>Detail Breakdown — Step 3</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ padding: 16, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Drop-off by Platform</div>
          {[['Mobile Web','58%'],['Desktop','18%'],['Tablet','24%']].map(([p,v]) => (
            <div key={p} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}><span style={{color:T.textS}}>{p}</span><span style={{fontWeight:600}}>{v}</span></div>
          ))}
        </div>
        <div style={{ padding: 16, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Time to Drop-off</div>
          {[['Under 30s','22%'],['30s – 2min','44%'],['Over 2min','34%']].map(([p,v]) => (
            <div key={p} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}><span style={{color:T.textS}}>{p}</span><span style={{fontWeight:600}}>{v}</span></div>
          ))}
        </div>
      </div>
      <div style={{ padding: 14, background: T.bgS, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.textS }}>
        💡 <strong style={{ color: T.text }}>Insight logged.</strong> Recommended action: Review Profile Setup form for mobile friction. Consider simplifying or adding a progress indicator.
      </div>
    </div>
  ),

  // ── UC-02 ──────────────────────────────────────────────────────────────────
  'user-list': () => (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>Users</h2>
        <button style={{ padding:'8px 16px', background:T.text, color:'#fff', border:'none', borderRadius:6, fontWeight:600, cursor:'pointer', fontSize:13 }}>+ Invite User</button>
      </div>
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <input placeholder="Search by name or email..." style={{ flex:1, padding:'9px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, outline:'none', background:T.bg }} />
        <select style={{ padding:'9px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, background:T.bg }}><option>All Roles</option><option>Admin</option><option>Team Member</option></select>
        <select style={{ padding:'9px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, background:T.bg }}><option>All Status</option><option>Active</option><option>Blocked</option></select>
      </div>
      <DataTable headers={['Name','Email','Role','Status','Last Active','']}
        rows={[
          ['Anika Mehta','anika@startco.io', <Badge text="Admin" type="accent" />, <Badge text="Active" type="success" />,'2 min ago','→'],
          ['Rajan Patel','rajan@startco.io', <Badge text="Member" />, <Badge text="Active" type="success" />,'1 hr ago','→'],
          ['Selin Kurt','selin@startco.io', <Badge text="Member" />, <Badge text="Active" type="success" />,'3 hrs ago','→'],
          ['Marcus Webb','marcus@startco.io', <Badge text="Member" />, <Badge text="Blocked" type="error" />,'14 days ago','→'],
        ]} />
    </div>
  ),

  'user-not-found': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Users</h2>
      <div style={{ display:'flex', gap:10, marginBottom:24 }}>
        <input defaultValue="priya.unknown@co.io" style={{ flex:1, padding:'9px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, outline:'none' }} />
      </div>
      <EmptyState icon="🔍" title="No user found" message="No match for 'priya.unknown@co.io'. Check the email or name and try again." action="Clear Search" />
    </div>
  ),

  'user-profile': () => (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, paddingBottom:24, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:T.bgT, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:20 }}>RP</div>
        <div>
          <div style={{ fontWeight:700, fontSize:18 }}>Rajan Patel</div>
          <div style={{ color:T.textS, fontSize:13 }}>rajan@startco.io · Member since Mar 2026</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}><Badge text="Team Member" /><Badge text="Active" type="success" /></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <StatCard label="Sessions (30d)" value="87" /><StatCard label="Last Active" value="1h ago" />
        <StatCard label="Reports Viewed" value="34" /><StatCard label="Exports" value="12" />
      </div>
      <div style={{ fontWeight:600, fontSize:13, marginBottom:12 }}>Recent Activity</div>
      {[['Viewed Analytics dashboard','1 hr ago'],['Exported Q1 Report','3 hrs ago'],['Logged in','Yesterday, 09:14']].map(([a,t]) => (
        <div key={a} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${T.border}`, fontSize:13 }}>
          <span style={{color:T.textS}}>{a}</span><span style={{color:T.textM}}>{t}</span>
        </div>
      ))}
    </div>
  ),

  'role-edit': () => (
    <div>
      <h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:700 }}>Edit Role — Rajan Patel</h2>
      <p style={{ color:T.textM, fontSize:13, marginBottom:24 }}>Changes apply on the user's next login.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {[{id:'admin', label:'Admin', desc:'Full control — users, data, settings, permissions.'},{id:'member', label:'Team Member', desc:'View-only — analytics, reports, activity logs.', selected:true}].map(r => (
          <label key={r.id} style={{ display:'flex', gap:14, padding:16, border:`${r.selected?2:1}px solid ${r.selected?T.borderStrong:T.border}`, borderRadius:8, cursor:'pointer', background:r.selected?T.bgS:T.bg }}>
            <input type="radio" name="role" defaultChecked={r.selected} style={{ marginTop:3 }} />
            <div><div style={{ fontWeight:600, fontSize:14 }}>{r.label}</div><div style={{ fontSize:13, color:T.textS, marginTop:2 }}>{r.desc}</div></div>
          </label>
        ))}
      </div>
    </div>
  ),

  'last-admin-block': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Role Change Blocked</h2>
      <AlertBanner type="warning" message="Rajan Patel is the only Admin. Downgrading this account would leave your workspace with no admin access." />
      <div style={{ padding:20, border:`1px solid ${T.border}`, borderRadius:8, fontSize:14, color:T.textS, lineHeight:1.7 }}>
        Invite or promote another member to Admin first, then return here to make this change.
      </div>
    </div>
  ),

  'block-confirm': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Block User?</h2>
      <div style={{ padding:20, border:`1px solid ${T.border}`, borderRadius:8, marginBottom:20 }}>
        <div style={{ fontWeight:600, marginBottom:8 }}>Rajan Patel · rajan@startco.io</div>
        <div style={{ fontSize:13, color:T.textS, lineHeight:1.7 }}>Blocking this user immediately revokes their access. They can be re-activated at any time. All activity history is preserved.</div>
      </div>
    </div>
  ),

  'self-block-warning': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Action Not Allowed</h2>
      <AlertBanner type="error" message="You cannot block your own account. Ask another Admin to perform this action." />
      <div style={{ padding:16, border:`1px solid ${T.border}`, borderRadius:8, fontSize:13, color:T.textS }}>
        This prevents accidental lockout. Contact another admin to take this action on your behalf.
      </div>
    </div>
  ),

  'action-success': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Done</h2>
      <div style={{ padding:32, border:`2px solid ${T.borderStrong}`, borderRadius:8, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>✓</div>
        <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>Change applied successfully</div>
        <div style={{ fontSize:13, color:T.textS }}>This action has been logged in the audit trail. The affected user will see changes on their next login.</div>
      </div>
    </div>
  ),

  'save-error': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Save Failed</h2>
      <AlertBanner type="error" message="The action could not be saved. Your previous settings have been restored." />
      <div style={{ padding:16, border:`1px solid ${T.border}`, borderRadius:8, fontSize:13, color:T.textS }}>No changes were applied. Please try again or contact support if this persists.</div>
    </div>
  ),

  // ── UC-03 ──────────────────────────────────────────────────────────────────
  'team-settings': () => (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>Settings — Team</h2>
        <button style={{ padding:'8px 16px', background:T.text, color:'#fff', border:'none', borderRadius:6, fontWeight:600, cursor:'pointer', fontSize:13 }}>+ Invite Member</button>
      </div>
      <DataTable headers={['Name','Email','Role','Status','Joined']}
        rows={[
          ['Anika Mehta','anika@startco.io',<Badge text="Admin" type="accent" />,<Badge text="Active" type="success" />,'Jan 2026'],
          ['Rajan Patel','rajan@startco.io',<Badge text="Member" />,<Badge text="Active" type="success" />,'Mar 2026'],
          ['Selin Kurt','selin@startco.io',<Badge text="Member" />,<Badge text="Active" type="success" />,'Mar 2026'],
        ]} />
    </div>
  ),

  'invite-form': () => (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:22, fontWeight:700 }}>Invite Team Member</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:480 }}>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, color:T.textS }}>Email Address</label>
          <input placeholder="colleague@company.com" style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, outline:'none', boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, color:T.textS }}>Role</label>
          <select style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, background:T.bg }}>
            <option>Team Member — View analytics and reports</option>
            <option>Admin — Full access</option>
          </select>
        </div>
        <div style={{ padding:14, background:T.bgS, borderRadius:8, fontSize:13, color:T.textS }}>
          An invitation email will be sent. The link expires after 72 hours.
        </div>
      </div>
    </div>
  ),

  'invite-validation': () => (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:22, fontWeight:700 }}>Invite Team Member</h2>
      <div style={{ maxWidth:480 }}>
        <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, color:T.textS }}>Email Address</label>
        <input defaultValue="not-an-email" style={{ width:'100%', padding:'10px 14px', border:`2px solid #C00`, borderRadius:6, fontSize:13, outline:'none', boxSizing:'border-box' }} />
        <div style={{ color:'#C00', fontSize:12, marginTop:6 }}>Please enter a valid email address (e.g. name@company.com)</div>
      </div>
    </div>
  ),

  'invite-exists': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Email Already in Workspace</h2>
      <AlertBanner type="warning" message="rajan@startco.io is already a Team Member in this workspace." />
      <div style={{ padding:20, border:`1px solid ${T.border}`, borderRadius:8, fontSize:14, color:T.textS }}>
        To change their role, go to User Management and edit from there.
      </div>
    </div>
  ),

  'invite-pending': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Invite Sent</h2>
      <div style={{ padding:28, border:`2px solid ${T.borderStrong}`, borderRadius:8, textAlign:'center', marginBottom:20 }}>
        <div style={{ fontSize:32, marginBottom:12 }}>✉️</div>
        <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>Invite sent to priya@partner.io</div>
        <div style={{ fontSize:13, color:T.textS }}>Role: Team Member · Expires in 72 hours</div>
      </div>
      <DataTable headers={['Email','Role','Status','Expires']}
        rows={[['priya@partner.io',<Badge text="Member" />,<Badge text="Pending" type="warning" />,'May 7, 2026']]} />
    </div>
  ),

  'invite-failed': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Invite Failed to Send</h2>
      <AlertBanner type="error" message="The invitation email could not be sent. Check your connection and try again." />
      <div style={{ padding:16, border:`1px solid ${T.border}`, borderRadius:8, fontSize:13, color:T.textS }}>The invite was not created. No changes were made to your team.</div>
    </div>
  ),

  'link-expired': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Invite Link Expired</h2>
      <AlertBanner type="warning" message="This invite link expired after 72 hours and is no longer valid." />
      <div style={{ padding:20, border:`1px solid ${T.border}`, borderRadius:8, fontSize:14, color:T.textS, marginBottom:16 }}>
        Return to Team Settings and resend the invite to generate a new link.
      </div>
      <button style={{ padding:'9px 20px', background:T.text, color:'#fff', border:'none', borderRadius:6, fontWeight:600, cursor:'pointer', fontSize:13 }}>↻ Resend Invite</button>
    </div>
  ),

  'account-creation': () => (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:22, fontWeight:700 }}>Set Up Your Account</h2>
      <div style={{ maxWidth:480, display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ padding:12, background:T.bgS, borderRadius:8, fontSize:13, color:T.textS }}>
          You were invited by <strong>Anika Mehta</strong> as a <strong>Team Member</strong> of Circuit Admin — startco.io.
        </div>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, color:T.textS }}>Full Name</label>
          <input placeholder="Priya Sharma" style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, boxSizing:'border-box', outline:'none' }} />
        </div>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, color:T.textS }}>Create Password</label>
          <input type="password" placeholder="Min. 8 characters" style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, boxSizing:'border-box', outline:'none' }} />
        </div>
      </div>
    </div>
  ),

  'member-onboarded': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Welcome, Priya 👋</h2>
      <AlertBanner type="success" message="Your account is set up. You're joined as a Team Member of startco.io." />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[['📊 Analytics','View funnels and trends'],['📋 Reports','Access saved reports'],['📁 Activity Logs','View recent events'],['📤 Export','Download your reports']].map(([t,d]) => (
          <div key={t} style={{ padding:16, border:`1px solid ${T.border}`, borderRadius:8 }}>
            <div style={{ fontWeight:600, marginBottom:4, fontSize:14 }}>{t}</div>
            <div style={{ fontSize:12, color:T.textS }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  ),

  // ── UC-04 ──────────────────────────────────────────────────────────────────
  'member-dashboard': () => (
    <div>
      <h2 style={{ margin:'0 0 6px', fontSize:22, fontWeight:700 }}>Dashboard</h2>
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', background:T.bgT, borderRadius:4, fontSize:12, color:T.textS, marginBottom:20 }}>
        <span>👤</span><span>Team Member view · Read-only</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14, marginBottom:20 }}>
        <StatCard label="Active Users (Today)" value="1,842" sub="Visible to your role" />
        <StatCard label="Conversion Rate" value="4.7%" sub="Last 30 days" trend="-0.3% vs last week" />
      </div>
      <div style={{ padding:14, background:T.bgS, borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, color:T.textS }}>
        Some metrics are Admin-only. Head to Analytics for full reports and funnel data.
      </div>
    </div>
  ),

  'analytics': () => (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:22, fontWeight:700 }}>Analytics</h2>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {['Last 7 days','Last 30 days','Last 90 days'].map((t,i) => (
          <button key={t} style={{ padding:'6px 14px', border:`1px solid ${i===1?T.borderStrong:T.border}`, borderRadius:20, background:i===1?T.text:T.bg, color:i===1?'#fff':T.textS, fontSize:12, cursor:'pointer' }}>{t}</button>
        ))}
      </div>
      <p style={{ color:T.textM, fontSize:13 }}>Checking data availability for selected range...</p>
    </div>
  ),

  'analytics-full': () => (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div><h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:700 }}>Analytics</h2><p style={{ margin:0, fontSize:12, color:T.textM }}>Last 30 days · Team Member view</p></div>
        <button style={{ padding:'7px 14px', border:`1px solid ${T.border}`, borderRadius:6, background:T.bg, cursor:'pointer', fontSize:12, fontWeight:600 }}>📤 Export CSV</button>
      </div>
      <div style={{ border:`1px solid ${T.border}`, borderRadius:8, padding:20, marginBottom:20 }}>
        <div style={{ fontWeight:600, marginBottom:16, fontSize:14 }}>Onboarding Funnel</div>
        <FunnelBar label="Step 1 — Sign Up" value={3842} max={3842} />
        <FunnelBar label="Step 2 — Verify Email" value={3601} max={3842} />
        <FunnelBar label="Step 3 — Profile Setup" value={2190} max={3842} />
        <FunnelBar label="Step 4 — First Login" value={1847} max={3842} />
      </div>
      <div style={{ border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
        <div style={{ fontWeight:600, marginBottom:12, fontSize:14 }}>Daily Active Users — Trend</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:80 }}>
          {[55,62,58,70,68,75,72,80,78,85,82,88,90,87].map((h,i) => (
            <div key={i} style={{ flex:1, background:T.bgT, height:`${h}%`, borderRadius:'2px 2px 0 0' }} />
          ))}
        </div>
      </div>
    </div>
  ),

  'analytics-empty': () => (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:22, fontWeight:700 }}>Analytics</h2>
      <EmptyState icon="📭" title="No data for this period" message="No events were recorded in the selected time range. Try a different date range." action="Change Date Range" />
    </div>
  ),

  'analytics-error': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Analytics</h2>
      <AlertBanner type="error" message="Failed to load analytics data. Check your connection and retry." />
      <button style={{ padding:'9px 20px', background:T.text, color:'#fff', border:'none', borderRadius:6, fontWeight:600, cursor:'pointer', fontSize:13 }}>↻ Retry</button>
    </div>
  ),

  'access-denied': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Access Restricted</h2>
      <div style={{ padding:48, border:`2px dashed ${T.border}`, borderRadius:8, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
        <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>User Management requires Admin access</div>
        <div style={{ fontSize:13, color:T.textS, maxWidth:320, margin:'0 auto' }}>Your role (Team Member) does not include user management. Contact your Admin to request elevated access.</div>
      </div>
    </div>
  ),

  'export-success': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Report Exported</h2>
      <div style={{ padding:28, border:`2px solid ${T.borderStrong}`, borderRadius:8, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>📤</div>
        <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>Q1 Analytics Report.csv downloaded</div>
        <div style={{ fontSize:13, color:T.textS }}>Jan 1 – Mar 31, 2026 · 4,218 rows</div>
      </div>
    </div>
  ),

  // ── UC-05 ──────────────────────────────────────────────────────────────────
  'activity-logs': () => (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:22, fontWeight:700 }}>Activity Logs</h2>
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <select style={{ padding:'9px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, background:T.bg, flex:1, minWidth:140 }}><option>All Users</option><option>Anika Mehta</option><option>Rajan Patel</option></select>
        <select style={{ padding:'9px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, background:T.bg, flex:1, minWidth:140 }}><option>All Actions</option><option>Role Change</option><option>User Blocked</option><option>Settings Changed</option></select>
        <input type="date" style={{ padding:'9px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13 }} />
        <input type="date" style={{ padding:'9px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13 }} />
      </div>
      <DataTable headers={['Timestamp','User','Action','Target','Result']}
        rows={[
          ['May 4, 09:41','Anika Mehta','Role Changed','Rajan Patel',<Badge text="Success" type="success" />],
          ['May 4, 09:22','Anika Mehta','User Blocked','Marcus Webb',<Badge text="Success" type="success" />],
          ['May 3, 17:14','Rajan Patel','Export Report','Q1 Analytics',<Badge text="Success" type="success" />],
          ['May 3, 14:02','Anika Mehta','Permissions Edit','Role: Member',<Badge text="Success" type="success" />],
          ['May 2, 11:30','Anika Mehta','Invite Sent','priya@partner.io',<Badge text="Pending" type="warning" />],
        ]} />
    </div>
  ),

  'log-results': () => (
    <div>
      <h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:700 }}>Activity Logs</h2>
      <p style={{ color:T.textM, fontSize:12, marginBottom:16 }}>Filtered: Anika Mehta · Role Changed · Apr 1–30, 2026 · 3 results</p>
      <DataTable headers={['Timestamp','User','Action','Target','Result']}
        rows={[
          ['Apr 28, 10:15','Anika Mehta','Role Changed','Selin Kurt → Admin',<Badge text="Success" type="success" />],
          ['Apr 15, 14:02','Anika Mehta','Role Changed','Marcus Webb → Blocked',<Badge text="Success" type="success" />],
          ['Apr 4, 09:30','Anika Mehta','Role Changed','Rajan Patel → Member',<Badge text="Success" type="success" />],
        ]} />
    </div>
  ),

  'logs-empty': () => (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:22, fontWeight:700 }}>Activity Logs</h2>
      <EmptyState icon="📋" title="No logs match your filters" message="Adjust the date range, user, or action type to find what you're looking for." action="Clear Filters" />
    </div>
  ),

  'logs-archived': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Activity Logs</h2>
      <AlertBanner type="warning" message="Logs before Jan 1, 2026 are outside the 90-day retention window and are no longer available in-app." />
      <div style={{ padding:20, border:`1px solid ${T.border}`, borderRadius:8, fontSize:14, color:T.textS, marginBottom:16 }}>
        Use the export feature before the retention window closes to preserve older log data.
      </div>
      <button style={{ padding:'9px 20px', background:T.text, color:'#fff', border:'none', borderRadius:6, fontWeight:600, cursor:'pointer', fontSize:13 }}>Export Archived Logs</button>
    </div>
  ),

  'log-detail': () => (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:22, fontWeight:700 }}>Event Detail</h2>
      <div style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:'hidden' }}>
        {[['Event ID','evt_8b2f4c9d1a3e'],['Timestamp','Apr 28, 2026 · 10:15:32 UTC'],['Performed by','Anika Mehta (anika@startco.io)'],['Action','Role Changed'],['Target','Selin Kurt (selin@startco.io)'],['Previous value','Team Member'],['New value','Admin'],['IP Address','203.0.113.45'],['Result','Success']].map(([k,v],i) => (
          <div key={k} style={{ display:'flex', borderBottom:i<8?`1px solid ${T.border}`:'none' }}>
            <div style={{ width:160, padding:'12px 16px', fontWeight:600, fontSize:11, color:T.textS, textTransform:'uppercase', letterSpacing:'0.04em', background:T.bgS, flexShrink:0 }}>{k}</div>
            <div style={{ padding:'12px 16px', fontSize:13 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  ),

  'logs-error': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Activity Logs</h2>
      <AlertBanner type="error" message="Could not load activity logs. Last successful load: May 4, 2026 at 08:00 UTC." />
      <button style={{ padding:'9px 20px', background:T.text, color:'#fff', border:'none', borderRadius:6, fontWeight:600, cursor:'pointer', fontSize:13 }}>↻ Retry</button>
    </div>
  ),

  // ── UC-06 ──────────────────────────────────────────────────────────────────
  'permissions': () => (
    <div>
      <h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:700 }}>Settings — Permissions</h2>
      <p style={{ color:T.textM, fontSize:12, marginBottom:20 }}>Manage what each role can see and do in Circuit Admin.</p>
      {[{role:'Admin',desc:'Full access — all features, all data, all settings.',perms:['Dashboard (full)','User Management','Analytics','Activity Logs','Settings & Permissions']},{role:'Team Member',desc:'Read-only access to data and reports.',perms:['Dashboard (limited)','Analytics (view)','Activity Logs (view)','Export Reports']}].map(r => (
        <div key={r.role} style={{ marginBottom:16, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div><div style={{ fontWeight:700, fontSize:15 }}>{r.role}</div><div style={{ fontSize:12, color:T.textS, marginTop:2 }}>{r.desc}</div></div>
            <button style={{ padding:'6px 14px', border:`1px solid ${T.border}`, borderRadius:6, background:T.bg, cursor:'pointer', fontSize:12, fontWeight:600 }}>Edit</button>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {r.perms.map(p => <span key={p} style={{ padding:'3px 10px', background:T.bgT, borderRadius:4, fontSize:11, color:T.textS }}>✓ {p}</span>)}
          </div>
        </div>
      ))}
    </div>
  ),

  'permissions-edit': () => (
    <div>
      <h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:700 }}>Edit Role — Team Member</h2>
      <p style={{ color:T.textM, fontSize:12, marginBottom:20 }}>Toggle which features Team Members can access.</p>
      <div style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:'hidden' }}>
        {[['Dashboard','Limited view — metric summary only',true],['User Management','View, edit, and block users',false],['Analytics — View','Funnel and trend reports',true],['Analytics — Export','Download reports as CSV',true],['Activity Logs','View audit trail',true],['Settings','Edit workspace settings',false]].map(([f,d,on],i) => (
          <div key={f} style={{ display:'flex', alignItems:'center', padding:'14px 20px', borderBottom:i<5?`1px solid ${T.border}`:'none', background:i%2===0?T.bg:T.bgS }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:13 }}>{f}</div>
              <div style={{ fontSize:12, color:T.textS }}>{d}</div>
            </div>
            <div style={{ width:44, height:24, background:on?T.text:T.bgT, borderRadius:12, position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
              <div style={{ position:'absolute', width:18, height:18, background:'#fff', borderRadius:'50%', top:3, left:on?23:3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),

  'self-lockout': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Action Blocked</h2>
      <AlertBanner type="warning" message="You cannot remove Admin access from your own account. This prevents accidental lockout." />
      <div style={{ padding:16, border:`1px solid ${T.border}`, borderRadius:8, fontSize:13, color:T.textS }}>Another Admin can modify your role if needed.</div>
    </div>
  ),

  'permissions-saving': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Saving Configuration...</h2>
      <div style={{ padding:32, border:`1px solid ${T.border}`, borderRadius:8, textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
        <div style={{ color:T.textS, fontSize:14 }}>Applying permission changes across active sessions...</div>
      </div>
    </div>
  ),

  'session-refresh': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Active Sessions Affected</h2>
      <AlertBanner type="warning" message="3 Team Members are currently logged in. They'll see updated permissions on their next page reload." />
      <div style={{ padding:20, border:`1px solid ${T.border}`, borderRadius:8, fontSize:14, color:T.textS }}>
        Affected users: <strong>Rajan Patel, Selin Kurt, Priya Sharma.</strong> A session refresh notification has been queued for each.
      </div>
    </div>
  ),

  'permissions-saved': () => (
    <div>
      <h2 style={{ margin:'0 0 16px', fontSize:22, fontWeight:700 }}>Permissions Updated</h2>
      <div style={{ padding:32, border:`2px solid ${T.borderStrong}`, borderRadius:8, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>✓</div>
        <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>Configuration saved</div>
        <div style={{ fontSize:13, color:T.textS }}>Changes logged in the audit trail. Affected users will see new permissions on next session.</div>
      </div>
    </div>
  ),
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const SECTION_MAP = {
  'dashboard':'dashboard','dashboard-full':'dashboard','dashboard-empty':'dashboard','dashboard-error':'dashboard','funnel-drill':'dashboard','detail-view':'dashboard',
  'user-list':'users','user-not-found':'users','user-profile':'users','role-edit':'users','last-admin-block':'users','block-confirm':'users','self-block-warning':'users','action-success':'users','save-error':'users',
  'team-settings':'settings','invite-form':'settings','invite-validation':'settings','invite-exists':'settings','invite-pending':'settings','invite-failed':'settings','link-expired':'settings','account-creation':'settings','member-onboarded':'dashboard',
  'member-dashboard':'dashboard','analytics':'analytics','analytics-full':'analytics','analytics-empty':'analytics','analytics-error':'analytics','access-denied':'users','export-success':'analytics',
  'activity-logs':'logs','log-results':'logs','logs-empty':'logs','logs-archived':'logs','log-detail':'logs','logs-error':'logs',
  'permissions':'settings','permissions-edit':'settings','self-lockout':'settings','permissions-saving':'settings','session-refresh':'settings','permissions-saved':'settings',
};

function Sidebar({ screenId }) {
  const active = SECTION_MAP[screenId] || 'dashboard';
  const items = [['dashboard','▣','Dashboard'],['users','⊕','Users'],['analytics','◈','Analytics'],['logs','≡','Activity Logs'],['settings','⊙','Settings']];
  return (
    <div style={{ width:220, background:T.bg, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
      <div style={{ padding:'20px 20px 16px', borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontWeight:800, fontSize:16, letterSpacing:'-0.02em' }}>Circuit Admin</div>
        <div style={{ fontSize:11, color:T.textM, marginTop:2 }}>startco.io workspace</div>
      </div>
      <nav style={{ padding:'10px 10px', flex:1 }}>
        {items.map(([id,icon,label]) => (
          <div key={id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:6, marginBottom:2, background:active===id?T.bgT:'transparent', cursor:'pointer' }}>
            <span style={{ fontSize:14, color:active===id?T.text:T.textM }}>{icon}</span>
            <span style={{ fontSize:13, fontWeight:active===id?600:400, color:active===id?T.text:T.textS }}>{label}</span>
          </div>
        ))}
      </nav>
      <div style={{ padding:'12px 20px', borderTop:`1px solid ${T.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:T.text, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:700 }}>AM</div>
          <div><div style={{ fontSize:12, fontWeight:600 }}>Anika Mehta</div><div style={{ fontSize:11, color:T.textM }}>Admin</div></div>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [ucId, setUcId]           = useState('uc01');
  const [screenId, setScreenId]   = useState('dashboard');
  const [history, setHistory]     = useState([]);
  const [comments, setComments]   = useState({});
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  const flow    = FLOWS[ucId];
  const screen  = flow?.screens[screenId];
  const branches = screen?.branches || [];
  const hasNext  = screen?.next !== undefined && screen?.next !== null;

  const navigate = (to) => { if (!to) return; setHistory(h => [...h, screenId]); setScreenId(to); };
  const back     = () => { if (!history.length) return; const p = history[history.length-1]; setHistory(h => h.slice(0,-1)); setScreenId(p); };

  const switchUC = (id) => { setUcId(id); setScreenId(FLOWS[id].start); setHistory([]); };

  const addComment = () => {
    if (!commentInput.trim()) return;
    const c = { id: Date.now(), author:'Designer', text: commentInput, timestamp: new Date().toLocaleTimeString(), resolved: false };
    setComments(prev => ({ ...prev, [screenId]: [...(prev[screenId]||[]), c] }));
    setCommentInput('');
  };

  const resolveComment = (id) => setComments(prev => ({ ...prev, [screenId]: prev[screenId].map(c => c.id===id ? {...c, resolved:true} : c) }));

  const screenComments = comments[screenId] || [];
  const unresolvedTotal = Object.values(comments).flat().filter(c => !c.resolved).length;
  const ScreenComp = Screens[screenId];
  const allScreens = Object.keys(flow?.screens||{});
  const progress = allScreens.indexOf(screenId);
  const ucInfo = USE_CASES.find(u => u.id === ucId);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:T.bg, fontFamily:T.font, fontSize:14, color:T.text, overflow:'hidden' }}>

      {/* Top nav */}
      <div style={{ height:52, borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:14, padding:'0 20px', flexShrink:0, background:T.bg }}>
        <div style={{ fontWeight:800, fontSize:13, letterSpacing:'-0.01em', color:T.text, whiteSpace:'nowrap' }}>✦ Prototype</div>
        <select value={ucId} onChange={e=>switchUC(e.target.value)} style={{ padding:'5px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, background:T.bg, fontWeight:600, color:T.text, maxWidth:260, cursor:'pointer' }}>
          {USE_CASES.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:160, height:4, background:T.bgT, borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', background:T.text, width:`${((progress+1)/allScreens.length)*100}%`, borderRadius:2, transition:'width 0.3s' }} />
          </div>
          <span style={{ fontSize:11, color:T.textM, whiteSpace:'nowrap' }}>Screen {progress+1}/{allScreens.length}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:T.bgS, borderRadius:4, fontSize:11, whiteSpace:'nowrap' }}>
          <span style={{ color:T.textM }}>Role:</span><strong>{ucInfo?.role||'Admin'}</strong>
        </div>
        <button onClick={()=>setShowComments(v=>!v)} style={{ position:'relative', padding:'5px 12px', border:`1px solid ${showComments?T.borderStrong:T.border}`, borderRadius:6, background:showComments?T.text:T.bg, color:showComments?'#fff':T.text, fontSize:12, cursor:'pointer', fontWeight:600, flexShrink:0 }}>
          💬 Comments
          {unresolvedTotal>0 && <span style={{ position:'absolute', top:-6, right:-6, width:16, height:16, background:'#E00', color:'#fff', borderRadius:'50%', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{unresolvedTotal}</span>}
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <Sidebar screenId={screenId} />

        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Breadcrumb */}
          <div style={{ padding:'8px 24px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:4, fontSize:11, color:T.textM, flexShrink:0, background:T.bgS, flexWrap:'wrap' }}>
            <span style={{ fontWeight:600 }}>{ucId.toUpperCase()}</span>
            {history.map((hId,i) => <span key={i}> › <span style={{color:T.textS}}>{flow?.screens[hId]?.label||hId}</span></span>)}
            <span> › <strong style={{color:T.text}}>{screen?.label||screenId}</strong></span>
          </div>

          {/* Screen */}
          <div style={{ flex:1, overflowY:'auto', padding:28 }}>
            {ScreenComp ? <ScreenComp /> : (
              <div style={{ padding:48, textAlign:'center', color:T.textM }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🖼</div>
                <div style={{ fontWeight:600 }}>{screen?.label||screenId}</div>
                <div style={{ fontSize:12, marginTop:8 }}>Screen content to be defined</div>
              </div>
            )}
          </div>

          {/* Flow controls */}
          <div style={{ borderTop:`1px solid ${T.border}`, padding:'12px 24px', background:T.bgS, flexShrink:0 }}>
            {branches.length>0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:T.textM, marginBottom:8 }}>What happens next?</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {branches.map((b,i) => (
                    <button key={i} onClick={()=>navigate(b.to)} disabled={!b.to} style={{ padding:'7px 14px', border:`1px solid ${b.to?T.borderStrong:T.border}`, borderRadius:6, background:T.bg, cursor:b.to?'pointer':'default', fontSize:12, fontWeight:500, color:b.to?T.text:T.textM, opacity:b.to?1:0.5 }}>{b.label}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button onClick={back} disabled={!history.length} style={{ padding:'8px 18px', border:`1px solid ${T.border}`, borderRadius:6, background:T.bg, cursor:history.length?'pointer':'default', fontSize:13, color:history.length?T.text:T.textM }}>← Back</button>
              {hasNext && <button onClick={()=>navigate(screen.next)} style={{ padding:'8px 18px', border:`1px solid ${T.borderStrong}`, borderRadius:6, background:T.text, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Continue →</button>}
              {!hasNext && !branches.length && <span style={{ fontSize:12, color:T.textM }}>End of flow · Select another use case above ↑</span>}
            </div>
          </div>
        </div>

        {/* Comment panel */}
        {showComments && (
          <div style={{ width:300, borderLeft:`1px solid ${T.border}`, display:'flex', flexDirection:'column', flexShrink:0, background:T.bg }}>
            <div style={{ padding:'13px 16px', borderBottom:`1px solid ${T.border}`, fontWeight:600, fontSize:13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>Comments</span>
              <span style={{ fontSize:11, color:T.textM }}>{screenComments.filter(c=>!c.resolved).length} open on this screen</span>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:12 }}>
              {!screenComments.length && <div style={{ textAlign:'center', color:T.textM, fontSize:12, padding:24 }}>No comments on this screen yet.</div>}
              {screenComments.map(c => (
                <div key={c.id} style={{ marginBottom:10, padding:12, border:`1px solid ${c.resolved?T.border:T.borderStrong}`, borderRadius:8, opacity:c.resolved?0.5:1, background:c.resolved?T.bgS:T.bg }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:11, fontWeight:700 }}>{c.author}</span>
                    <span style={{ fontSize:10, color:T.textM }}>{c.timestamp}</span>
                  </div>
                  <div style={{ fontSize:13, lineHeight:1.5, marginBottom:8 }}>{c.text}</div>
                  {!c.resolved ? <button onClick={()=>resolveComment(c.id)} style={{ fontSize:11, border:'none', background:'none', cursor:'pointer', color:T.textM, padding:0, fontWeight:600 }}>✓ Mark resolved</button>
                  : <span style={{ fontSize:11, color:T.textM }}>✓ Resolved</span>}
                </div>
              ))}
            </div>
            <div style={{ padding:12, borderTop:`1px solid ${T.border}` }}>
              <textarea value={commentInput} onChange={e=>setCommentInput(e.target.value)} placeholder="Add a comment on this screen..." rows={3} style={{ width:'100%', padding:'8px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, resize:'none', outline:'none', boxSizing:'border-box', fontFamily:T.font }} />
              <button onClick={addComment} style={{ marginTop:8, width:'100%', padding:'8px 0', background:T.text, color:'#fff', border:'none', borderRadius:6, fontWeight:600, cursor:'pointer', fontSize:13 }}>Add Comment</button>
              <div style={{ marginTop:6, fontSize:10, color:T.textM, textAlign:'center' }}>Comments sync to Notion on deploy · /brief-to-board deploy-flows</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
