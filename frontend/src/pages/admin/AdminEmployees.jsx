import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  FiUserPlus,
  FiUserX,
  FiUserCheck,
  FiShuffle,
  FiUsers,
  FiUserCheck as FiLead,
  FiCheckCircle,
  FiPauseCircle,
} from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import SearchBar from '../../components/SearchBar';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

/* Scoped styles (prefixed "ae-"). Also styles the form fields inside the modals. */
const styles = `
.ae-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.ae-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.ae-rise { animation: ae-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes ae-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.ae-tile { transition: transform .25s ease; }
.ae-hover:hover .ae-tile { transform: scale(1.08) rotate(-4deg); }

.ae-hero {
  position: relative; overflow: hidden; border-radius: 1rem; color: #fff;
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
}
.ae-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}

/* Clickable stat cards double as status filters */
.ae-stat { text-align: left; width: 100%; cursor: pointer; }
.ae-stat[aria-pressed="true"] { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,.18), 0 18px 32px -18px rgba(14,100,200,.35); }
.ae-stat:focus-visible { outline: 3px solid #bae6fd; outline-offset: 2px; }

/* Segmented tabs with a sliding pill */
.ae-tabs { position: relative; display: grid; grid-template-columns: 1fr 1fr; padding: .25rem; width: 17rem; max-width: 100%;
  background: #eef2f8; border-radius: .85rem; }
.ae-pill { position: absolute; top: .25rem; bottom: .25rem; left: .25rem; width: calc(50% - .25rem);
  background: #fff; border-radius: .65rem; box-shadow: 0 2px 8px -2px rgba(15,27,51,.25);
  transition: transform .3s cubic-bezier(.2,.8,.2,1); }
.ae-tab { position: relative; z-index: 1; padding: .5rem 1rem; font-size: .875rem; font-weight: 600; color: #64748b;
  border-radius: .65rem; transition: color .2s; display: flex; align-items: center; justify-content: center; gap: .4rem; }
.ae-tab:hover { color: #0f1b33; }
.ae-tab[aria-selected="true"] { color: #0f1b33; }
.ae-tab:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

/* Inputs, selects, labels */
.ae-input {
  width: 100%; height: 2.6rem; padding: 0 .85rem; border: 1.5px solid #dbe2ee; border-radius: .7rem;
  background: #f8fafc; color: #0f1b33; font-size: .9rem; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.ae-input:hover { border-color: #b8c4da; }
.ae-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,.15); }
.ae-input::placeholder { color: #94a3b8; }
.ae-label { display: block; margin-bottom: .3rem; font-size: .78rem; font-weight: 600; color: #475569; }

/* Buttons */
.ae-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 2.6rem; padding: 0 1.1rem;
  border-radius: .7rem; font-size: .875rem; font-weight: 600; color: #fff; position: relative; overflow: hidden;
  background: linear-gradient(135deg, #0ea5e9, #4f46e5); box-shadow: 0 10px 22px -12px rgba(79,70,229,.9);
  transition: transform .15s, box-shadow .2s, filter .2s;
}
.ae-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 26px -12px rgba(79,70,229,.95); }
.ae-btn:active:not(:disabled) { transform: scale(.98); }
.ae-btn:disabled { cursor: not-allowed; filter: saturate(.6) brightness(.95); }
.ae-btn:focus-visible { outline: 3px solid #bae6fd; outline-offset: 2px; }
.ae-btn-ghost {
  display: inline-flex; align-items: center; justify-content: center; height: 2.6rem; padding: 0 1.1rem;
  border-radius: .7rem; font-size: .875rem; font-weight: 600; color: #475569; background: #fff; border: 1.5px solid #dbe2ee;
  transition: background .2s, border-color .2s;
}
.ae-btn-ghost:hover { background: #f1f5f9; border-color: #b8c4da; }

/* Row action icon buttons */
.ae-act { height: 2rem; width: 2rem; display: inline-flex; align-items: center; justify-content: center;
  border-radius: .55rem; transition: background .15s, color .15s, transform .15s; }
.ae-act:hover { transform: translateY(-1px); }
.ae-act:focus-visible { outline: 2px solid #38bdf8; outline-offset: 1px; }
.ae-act-blue { color: #475569; } .ae-act-blue:hover { background: #e0f2fe; color: #0369a1; }
.ae-act-red { color: #ef4444; } .ae-act-red:hover { background: #fee2e2; color: #b91c1c; }
.ae-act-green { color: #16a34a; } .ae-act-green:hover { background: #dcfce7; color: #15803d; }

.ae-avatar { height: 2.1rem; width: 2.1rem; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
  color: #fff; font-size: .78rem; font-weight: 700; flex-shrink: 0; }
.ae-chip { display: inline-block; padding: .15rem .55rem; border-radius: 999px; background: #eef2f8; color: #334155; font-size: .72rem; font-weight: 600; }

@media (prefers-reduced-motion: reduce) {
  .ae-rise { animation: none; }
  .ae-card, .ae-tile, .ae-pill, .ae-btn, .ae-act, .ae-input, .ae-tab { transition: none; }
}
`;

const ROLE_TABS = [
  { key: 'employee', label: 'Employees', icon: FiUsers },
  { key: 'team_lead', label: 'Team Leads', icon: FiLead },
];

const TONES = {
  blue: { tile: 'linear-gradient(135deg,#38bdf8,#2563eb)', glow: 'rgba(37,99,235,.35)' },
  green: { tile: 'linear-gradient(135deg,#4ade80,#16a34a)', glow: 'rgba(22,163,74,.35)' },
  amber: { tile: 'linear-gradient(135deg,#fbbf24,#d97706)', glow: 'rgba(217,119,6,.35)' },
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#38bdf8,#2563eb)',
  'linear-gradient(135deg,#818cf8,#4f46e5)',
  'linear-gradient(135deg,#2dd4bf,#0d9488)',
  'linear-gradient(135deg,#fbbf24,#d97706)',
  'linear-gradient(135deg,#fb7185,#e11d48)',
  'linear-gradient(135deg,#4ade80,#16a34a)',
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function gradientFor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

/* Animated count-up for numbers */
function useCountUp(target, duration = 800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const end = Number(target) || 0;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setN(end);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setN(Math.round(end * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

function StatCard({ icon: Icon, label, value, tone = 'blue', delay = 0, active, onClick }) {
  const shown = useCountUp(value);
  const t = TONES[tone] || TONES.blue;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="ae-card ae-hover ae-rise ae-stat p-4 flex items-center gap-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="ae-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
        style={{ background: t.tile, boxShadow: `0 10px 18px -8px ${t.glow}` }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400 truncate">{label}</p>
        <p className="text-2xl font-semibold text-navy-800 leading-tight tabular-nums">{shown}</p>
      </div>
    </button>
  );
}

export default function AdminEmployees() {
  const [role, setRole] = useState('employee');
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ all: 0, active: 0, inactive: 0 });
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [status, setStatus] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, action }
  const limit = 10;
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await axiosClient.get('/users', {
        params: { role, page, limit, search: search || undefined, department: departmentFilter || undefined, status: status || undefined },
      });
      setUsers(res.data.users);
      setTotal(res.meta.total);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  /* Stat-card numbers: one tiny request per status, respecting role, search and department. */
  const loadCounts = async () => {
    const base = { role, limit: 1, search: search || undefined, department: departmentFilter || undefined };
    try {
      const [all, active, inactive] = await Promise.all([
        axiosClient.get('/users', { params: base }),
        axiosClient.get('/users', { params: { ...base, status: 'active' } }),
        axiosClient.get('/users', { params: { ...base, status: 'inactive' } }),
      ]);
      setCounts({ all: all.data.meta.total, active: active.data.meta.total, inactive: inactive.data.meta.total });
    } catch {
      /* stat cards are decorative; the table already reports real errors */
    }
  };

  useEffect(() => { load(); }, [role, page, search, departmentFilter, status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadCounts(); }, [role, search, departmentFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    axiosClient.get('/departments', { params: { limit: 100, status: 'active' } }).then(({ data: res }) => setDepartments(res.data.departments)).catch(() => {});
    axiosClient.get('/users/team-leads', { params: { status: 'active' } }).then(({ data: res }) => setTeamLeads(res.data.teamLeads)).catch(() => {});
  }, []);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const openAdd = () => { reset({ employeeCode: '', fullName: '', email: '', phone: '', designation: '', password: '', department: '', teamLead: '' }); setAddOpen(true); };

  const onAddUser = async (values) => {
    try {
      await axiosClient.post('/users', { ...values, role, department: values.department || undefined, teamLead: values.teamLead || undefined });
      toast.success(role === 'employee' ? 'Employee added.' : 'Team lead added.');
      setAddOpen(false);
      load();
      loadCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add user.');
    }
  };

  const doToggleStatus = async () => {
    if (!confirmTarget) return;
    try {
      await axiosClient.patch(`/users/${confirmTarget.id}/${confirmTarget.action}`);
      toast.success(confirmTarget.action === 'deactivate' ? 'User deactivated.' : 'User reactivated.');
      setConfirmTarget(null);
      load();
      loadCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const { register: registerAssign, handleSubmit: handleAssignSubmit, reset: resetAssign } = useForm();

  const openAssign = (user) => {
    setAssignTarget(user);
    resetAssign({ department: user.department?._id || '', teamLead: user.teamLead?._id || '' });
  };

  const onAssignSubmit = async (values) => {
    try {
      const payload = { department: values.department || null };
      if (role === 'employee') payload.teamLead = values.teamLead || null;
      await axiosClient.patch(`/users/${assignTarget._id}/assign`, payload);
      toast.success('Assignment updated.');
      setAssignTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update assignment.');
    }
  };

  const pickStatus = (value) => { setStatus((cur) => (cur === value ? '' : value)); setPage(1); };

  const columns = [
    {
      key: 'employeeCode',
      label: 'ID',
      render: (r) => <span className="ae-chip">{r.employeeCode}</span>,
    },
    {
      key: 'fullName',
      label: 'Name',
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="ae-avatar" style={{ background: gradientFor(r.fullName) }}>
            {initials(r.fullName)}
          </span>
          <span className="font-medium text-navy-800">{r.fullName}</span>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'department',
      label: 'Department',
      render: (r) => (r.department?.name ? <span className="ae-chip">{r.department.name}</span> : '-'),
    },
    ...(role === 'employee' ? [{ key: 'teamLead', label: 'Team Lead', render: (r) => r.teamLead?.fullName || '-' }] : []),
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openAssign(r); }}
            className="ae-act ae-act-blue"
            title="Reassign"
            aria-label={`Reassign ${r.fullName}`}
          >
            <FiShuffle className="h-4 w-4" />
          </button>
          {r.status === 'active' ? (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmTarget({ id: r._id, action: 'deactivate' }); }}
              className="ae-act ae-act-red"
              title="Deactivate"
              aria-label={`Deactivate ${r.fullName}`}
            >
              <FiUserX className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmTarget({ id: r._id, action: 'reactivate' }); }}
              className="ae-act ae-act-green"
              title="Reactivate"
              aria-label={`Reactivate ${r.fullName}`}
            >
              <FiUserCheck className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const roleIndex = ROLE_TABS.findIndex((t) => t.key === role);
  const roleTitle = role === 'employee' ? 'Employees' : 'Team Leads';
  const roleSingular = role === 'employee' ? 'Employee' : 'Team Lead';

  return (
    <div className="space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="ae-hero ae-rise px-5 py-5 sm:px-7 sm:py-6">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{roleTitle}</h2>
            <p className="text-sm text-slate-300 mt-1">
              Add people, move them between departments and control who can log in.
            </p>
          </div>
          <button onClick={openAdd} className="ae-btn">
            <FiUserPlus className="h-4 w-4" /> Add {roleSingular}
          </button>
        </div>
      </div>

      {/* Statistics (click to filter by status) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={FiUsers} label={`Total ${roleTitle}`} value={counts.all} tone="blue" delay={40} active={status === ''} onClick={() => pickStatus('')} />
        <StatCard icon={FiCheckCircle} label="Active" value={counts.active} tone="green" delay={80} active={status === 'active'} onClick={() => pickStatus('active')} />
        <StatCard icon={FiPauseCircle} label="Inactive" value={counts.inactive} tone="amber" delay={120} active={status === 'inactive'} onClick={() => pickStatus('inactive')} />
      </div>

      {/* Tabs + filters */}
      <div className="ae-card ae-rise p-3 sm:p-4 space-y-3" style={{ animationDelay: '160ms' }}>
        <div className="ae-tabs" role="tablist">
          <span className="ae-pill" style={{ transform: `translateX(${roleIndex * 100}%)` }} aria-hidden="true" />
          {ROLE_TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={role === t.key}
              onClick={() => { setRole(t.key); setPage(1); }}
              className="ae-tab"
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-72">
            <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name, ID, or email" />
          </div>
          <select className="ae-input !w-auto min-w-[10rem]" value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }} aria-label="Filter by department">
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select className="ae-input !w-auto min-w-[9rem]" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="ae-card ae-rise overflow-hidden" style={{ animationDelay: '220ms' }}>
        <DataTable columns={columns} rows={users} loading={loading} onRowClick={(r) => navigate(`/admin/users/${r._id}`)} emptyTitle="No users found" />
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      {/* Add modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`Add ${roleSingular}`}
        footer={
          <>
            <button className="ae-btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="ae-btn" onClick={handleSubmit(onAddUser)} disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add'}</button>
          </>
        }
      >
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3" onSubmit={handleSubmit(onAddUser)}>
          <div>
            <label className="ae-label">Employee ID</label>
            <input className="ae-input" {...register('employeeCode', { required: true })} />
          </div>
          <div>
            <label className="ae-label">Full Name</label>
            <input className="ae-input" {...register('fullName', { required: true })} />
          </div>
          <div className="sm:col-span-2">
            <label className="ae-label">Email</label>
            <input type="email" className="ae-input" {...register('email', { required: true })} />
          </div>
          <div>
            <label className="ae-label">Phone</label>
            <input className="ae-input" {...register('phone')} />
          </div>
          <div>
            <label className="ae-label">Designation</label>
            <input className="ae-input" {...register('designation')} />
          </div>
          <div>
            <label className="ae-label">Department</label>
            <select className="ae-input" {...register('department')}>
              <option value="">Select department</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          {role === 'employee' && (
            <div>
              <label className="ae-label">Team Lead</label>
              <select className="ae-input" {...register('teamLead')}>
                <option value="">Select team lead</option>
                {teamLeads.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="ae-label">Temporary Password</label>
            <input type="text" className="ae-input" placeholder="At least 8 characters" {...register('password', { required: true, minLength: 8 })} />
          </div>
        </form>
      </Modal>

      {/* Reassign modal */}
      <Modal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title={`Reassign ${assignTarget?.fullName || ''}`}
        footer={
          <>
            <button className="ae-btn-ghost" onClick={() => setAssignTarget(null)}>Cancel</button>
            <button className="ae-btn" onClick={handleAssignSubmit(onAssignSubmit)}>Save</button>
          </>
        }
      >
        <form className="space-y-3" onSubmit={handleAssignSubmit(onAssignSubmit)}>
          <div>
            <label className="ae-label">Department</label>
            <select className="ae-input" {...registerAssign('department')}>
              <option value="">Unassigned</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          {role === 'employee' && (
            <div>
              <label className="ae-label">Team Lead</label>
              <select className="ae-input" {...registerAssign('teamLead')}>
                <option value="">Unassigned</option>
                {teamLeads.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
              </select>
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={doToggleStatus}
        danger={confirmTarget?.action === 'deactivate'}
        title={confirmTarget?.action === 'deactivate' ? 'Deactivate user?' : 'Reactivate user?'}
        message={confirmTarget?.action === 'deactivate' ? 'They will no longer be able to log in.' : 'They will regain access to log in.'}
        confirmLabel={confirmTarget?.action === 'deactivate' ? 'Deactivate' : 'Reactivate'}
      />
    </div>
  );
}