import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiSlash, FiGrid, FiCheckCircle, FiPauseCircle, FiHash } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import SearchBar from '../../components/SearchBar';
import LoadingSpinner from '../../components/LoadingSpinner';

/* Scoped styles (prefixed "dp-") so nothing clashes with your global CSS. */
const styles = `
.dp-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.dp-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.dp-rise { animation: dp-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes dp-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.dp-tile { transition: transform .25s ease; }
.dp-hover:hover .dp-tile { transform: scale(1.08) rotate(-4deg); }

.dp-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.dp-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}
.dp-hero-btn {
  display: inline-flex; align-items: center; gap: .5rem;
  background: #fff; color: #0f1b33; font-weight: 600; font-size: .875rem;
  padding: .6rem 1rem; border-radius: .75rem;
  box-shadow: 0 10px 20px -10px rgba(0,0,0,.45);
  transition: transform .2s ease, box-shadow .2s ease;
}
.dp-hero-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 24px -10px rgba(0,0,0,.5); }
.dp-hero-btn:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.dp-tab {
  padding: .4rem .85rem; border-radius: 999px; font-size: .8rem; font-weight: 500;
  color: #64748b; border: 1px solid transparent; transition: all .15s ease;
}
.dp-tab:hover { color: #0f1b33; background: #eef3fb; }
.dp-tab[aria-pressed="true"] { color: #fff; background: #16305c; }
.dp-tab:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.dp-icon-btn {
  height: 2rem; width: 2rem; display: inline-flex; align-items: center; justify-content: center;
  border-radius: .6rem; transition: background .15s ease, color .15s ease;
}
.dp-icon-btn:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .dp-rise { animation: none; }
  .dp-card, .dp-tile, .dp-hero-btn { transition: none; }
}
`;

const TONES = {
  blue: { tile: 'linear-gradient(135deg,#38bdf8,#2563eb)', glow: 'rgba(37,99,235,.35)' },
  green: { tile: 'linear-gradient(135deg,#4ade80,#16a34a)', glow: 'rgba(22,163,74,.35)' },
  amber: { tile: 'linear-gradient(135deg,#fbbf24,#d97706)', glow: 'rgba(217,119,6,.35)' },
};

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

function StatCard({ icon: Icon, label, value, tone = 'blue', delay = 0 }) {
  const shown = useCountUp(value);
  const t = TONES[tone] || TONES.blue;
  return (
    <div className="dp-card dp-hover dp-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="dp-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
        style={{ background: t.tile, boxShadow: `0 10px 18px -8px ${t.glow}` }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400 truncate">{label}</p>
        <p className="text-2xl font-semibold text-navy-800 leading-tight tabular-nums">{shown}</p>
      </div>
    </div>
  );
}

function DepartmentCard({ dept, delay, onEdit, onDeactivate }) {
  const isActive = dept.status === 'active';
  return (
    <div className="dp-card dp-hover dp-rise p-5 flex flex-col" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="dp-tile h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-white"
            style={{
              background: isActive ? TONES.blue.tile : 'linear-gradient(135deg,#cbd5e1,#94a3b8)',
              boxShadow: isActive ? `0 10px 18px -8px ${TONES.blue.glow}` : 'none',
            }}
          >
            <FiGrid className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-navy-800 truncate">{dept.name}</h3>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-navy-400">
              <FiHash className="h-3 w-3" />
              {dept.code}
            </p>
          </div>
        </div>
        <StatusBadge status={dept.status} />
      </div>

      <p className="mt-4 text-sm text-navy-500 line-clamp-2 min-h-[2.5rem]">
        {dept.description || 'No description added.'}
      </p>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(dept); }}
          className="dp-icon-btn text-navy-500 hover:bg-slate-100 hover:text-navy-800"
          aria-label={`Edit ${dept.name}`}
          title="Edit"
        >
          <FiEdit2 className="h-4 w-4" />
        </button>
        {isActive && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDeactivate(dept); }}
            className="dp-icon-btn text-red-500 hover:bg-red-50 hover:text-red-700"
            aria-label={`Deactivate ${dept.name}`}
            title="Deactivate"
          >
            <FiSlash className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onAdd }) {
  return (
    <div className="dp-card dp-rise py-14 flex items-center justify-center border-dashed bg-slate-50/60">
      <div className="text-center px-4">
        <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-white shadow-sm flex items-center justify-center">
          <FiGrid className="h-6 w-6 text-navy-300" />
        </div>
        <p className="text-sm font-medium text-navy-600">No departments found</p>
        <p className="text-xs text-navy-400 mt-1">
          {hasFilters ? 'Try a different search or status filter.' : 'Add your first department to get started.'}
        </p>
        {!hasFilters && (
          <button onClick={onAdd} className="btn-primary mt-4">
            <FiPlus className="h-4 w-4" /> Add Department
          </button>
        )}
      </div>
    </div>
  );
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
  const [editingDept, setEditingDept] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await axiosClient.get('/departments', { params: { search: search || undefined, limit: 100 } });
      setDepartments(res.data.departments);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => { setModalMode('add'); setEditingDept(null); reset({ name: '', code: '', description: '' }); };
  const openEdit = (dept) => { setModalMode('edit'); setEditingDept(dept); reset({ name: dept.name, code: dept.code, description: dept.description }); };

  const onSubmit = async (values) => {
    try {
      if (modalMode === 'edit') {
        await axiosClient.patch(`/departments/${editingDept._id}`, values);
        toast.success('Department updated.');
      } else {
        await axiosClient.post('/departments', values);
        toast.success('Department created.');
      }
      setModalMode(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save department.');
    }
  };

  const doDeactivate = async () => {
    try {
      await axiosClient.delete(`/departments/${confirmTarget._id}`);
      toast.success('Department deactivated.');
      setConfirmTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const counts = useMemo(() => {
    const active = departments.filter((d) => d.status === 'active').length;
    return { total: departments.length, active, inactive: departments.length - active };
  }, [departments]);

  const visible = useMemo(() => {
    if (statusFilter === 'all') return departments;
    if (statusFilter === 'active') return departments.filter((d) => d.status === 'active');
    return departments.filter((d) => d.status !== 'active');
  }, [departments, statusFilter]);

  const hasFilters = Boolean(search) || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="dp-hero dp-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Departments</h2>
            <p className="text-sm text-slate-300 mt-1">
              Organise teams and control where employees and team leads can be assigned.
            </p>
          </div>
          <button type="button" onClick={openAdd} className="dp-hero-btn">
            <FiPlus className="h-4 w-4" /> Add Department
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={FiGrid} label="Total Departments" value={counts.total} tone="blue" delay={40} />
        <StatCard icon={FiCheckCircle} label="Active" value={counts.active} tone="green" delay={80} />
        <StatCard icon={FiPauseCircle} label="Inactive" value={counts.inactive} tone="amber" delay={120} />
      </div>

      {/* Toolbar */}
      <div className="dp-card dp-rise p-4 flex flex-wrap items-center justify-between gap-3" style={{ animationDelay: '160ms' }}>
        <div className="w-full sm:w-72">
          <SearchBar value={search} onChange={setSearch} placeholder="Search departments" />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="dp-tab"
              aria-pressed={statusFilter === f.key}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Department cards */}
      {loading ? (
        <LoadingSpinner label="Loading departments..." />
      ) : visible.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onAdd={openAdd} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((dept, i) => (
            <DepartmentCard
              key={dept._id}
              dept={dept}
              delay={200 + Math.min(i, 8) * 40}
              onEdit={openEdit}
              onDeactivate={setConfirmTarget}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!modalMode}
        onClose={() => setModalMode(null)}
        title={modalMode === 'edit' ? 'Edit Department' : 'Add Department'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalMode(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="label">Name</label>
            <input className="input-field" {...register('name', { required: true })} />
          </div>
          <div>
            <label className="label">Code</label>
            <input className="input-field" {...register('code', { required: true })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={2} className="input-field" {...register('description')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={doDeactivate}
        danger
        title="Deactivate department?"
        message="It can no longer be assigned to new employees or team leads."
        confirmLabel="Deactivate"
      />
    </div>
  );
}