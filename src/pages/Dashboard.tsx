import React, { useState, useEffect, useCallback } from 'react';
import { Icon, Avatar, StatusPill, DonutChart, USERS } from '../components/Common';
import { AddProjectModal } from '../components/modals/AddProjectModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

/* ── Types ── */
interface DashStats  { done: number; inProgress: number; review: number; overdue: number; }
interface DayBar     { day: string; count: number; }
interface Project    { id: string; name: string; due_date: string | null; color: string; status: string; }
interface TeamMember { id: string; full_name: string | null; role: string | null; taskCount: number; }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [showAddProject, setShowAddProject] = useState(false);
  const [stats,   setStats]   = useState<DashStats>({ done: 0, inProgress: 0, review: 0, overdue: 0 });
  const [bars,    setBars]    = useState<DayBar[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team,    setTeam]    = useState<TeamMember[]>([]);
  const [taskBreakdown, setTaskBreakdown] = useState({ done: 0, review: 0, inProgress: 0, backlog: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [tasksRes, projRes, profRes] = await Promise.all([
      supabase.from('tasks').select('status, due_date, created_at, assignee_id'),
      supabase.from('projects').select('id, name, due_date, color, status').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('id, full_name, role').limit(4),
    ]);

    const tasks = tasksRes.data ?? [];
    const projects = projRes.data ?? [];
    const profiles = profRes.data ?? [];

    /* ── Stats ── */
    const done       = tasks.filter(t => t.status === 'Done').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const review     = tasks.filter(t => t.status === 'Review').length;
    const overdue    = tasks.filter(t =>
      t.due_date && new Date(t.due_date) < now && t.status !== 'Done'
    ).length;
    setStats({ done, inProgress, review, overdue });

    /* ── Task breakdown for donut ── */
    const backlog = tasks.filter(t => t.status === 'Backlog').length;
    setTaskBreakdown({ done, review, inProgress, backlog });

    /* ── Bar chart: tasks created each day in the last 7 days ── */
    const recentTasks = tasks.filter(t => t.created_at >= sevenDaysAgo);
    const dayBars: DayBar[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split('T')[0];
      const count = recentTasks.filter(t => t.created_at.startsWith(dayStr)).length;
      return { day: DAYS[d.getDay()], count };
    });
    setBars(dayBars);

    /* ── Projects ── */
    setProjects(projects);

    /* ── Team: profile + count of tasks assigned ── */
    const teamWithCounts = profiles.map(p => ({
      ...p,
      taskCount: tasks.filter(t => t.assignee_id === p.id).length,
    }));
    setTeam(teamWithCounts);

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Derived ── */
  const totalTasks = taskBreakdown.done + taskBreakdown.review + taskBreakdown.inProgress + taskBreakdown.backlog;
  const donePct = totalTasks > 0 ? Math.round((taskBreakdown.done / totalTasks) * 100) : 0;
  const maxBar  = Math.max(...bars.map(b => b.count), 1);

  const statusColor: Record<string, string> = {
    'Active': '#5C4FE5', 'Completed': '#10B981', 'Archived': '#9CA3AF',
  };

  const projectIcon = (color: string) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  );

  return (
    <>
      {showAddProject && (
        <AddProjectModal
          onClose={() => setShowAddProject(false)}
          onSuccess={() => { setShowAddProject(false); fetchAll(); }}
        />
      )}

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-[32px] font-extrabold text-text-main tracking-tight leading-tight">Dashboard</div>
            <div className="text-[14px] text-text-3 mt-1 font-medium">A live view of your projects, tasks, and team activity.</div>
          </div>
          {isAdmin && (
            <div className="flex gap-3 items-center">
              <button
                onClick={() => setShowAddProject(true)}
                className="bg-brand hover:bg-brand-dark text-white rounded-xl px-5 py-3 text-[14px] font-bold flex items-center gap-2 transition-all shadow-[0_8px_20px_rgba(92,79,229,0.25)] hover:-translate-y-0.5"
              >
                <Icon name="plus" size={16} /> Add Project
              </button>
            </div>
          )}
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-4 gap-5 mb-6">
          {[
            { label: 'Tasks Completed',   val: stats.done,       trend: 'Done this sprint',    highlight: true,  icon: '✓' },
            { label: 'In Progress',       val: stats.inProgress, trend: 'Actively being worked', icon: '⟳' },
            { label: 'Pending Review',    val: stats.review,     trend: 'Awaiting review',       icon: '⌛' },
            { label: 'Overdue Tasks',     val: stats.overdue,    trend: 'Past due date',         icon: '!', isOverdue: true },
          ].map((s, i) => (
            <div
              key={i}
              className={`rounded-3xl p-6 relative overflow-hidden shadow-sm border border-border-light/50 ${s.highlight ? 'bg-brand text-white shadow-[0_12px_30px_rgba(92,79,229,0.3)]' : 'bg-white text-text-main'}`}
            >
              <div className={`absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center border text-[16px] ${s.highlight ? 'bg-white/20 border-white/10 text-white' : s.isOverdue ? 'bg-red-50 border-red-100 text-red-500' : 'bg-gray-50 border-gray-100 text-text-3'}`}>
                {s.icon}
              </div>
              <div className={`text-[14px] font-semibold mb-3 ${s.highlight ? 'text-white/90' : 'text-text-2'}`}>{s.label}</div>
              <div className="text-[42px] font-extrabold tracking-tight mb-4 leading-none">
                {loading ? <span className="animate-pulse">0</span> : s.val}
              </div>
              <div className={`text-[12px] font-medium ${s.highlight ? 'text-white/80' : s.isOverdue ? 'text-red-500' : 'text-text-3'}`}>{s.trend}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* ── Bar Chart: Task Activity (last 7 days) ── */}
          <div className="col-span-2 bg-white rounded-3xl p-7 shadow-sm border border-border-light/50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="font-bold text-[16px] text-text-main">Task Activity</span>
                <div className="text-[12px] text-text-3 font-medium mt-0.5">Tasks created in the last 7 days</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand" />
                <span className="text-[12px] font-bold text-text-3">New Tasks</span>
              </div>
            </div>
            {loading ? (
              <div className="flex items-end justify-between h-[160px] gap-4 px-2 animate-pulse">
                {[40, 70, 50, 90, 60, 45, 65].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3">
                    <div className="relative w-full flex justify-center h-[140px] flex-col justify-end">
                      <div className="absolute inset-0 bg-gray-100 rounded-full w-12 mx-auto" />
                      <div className="relative w-12 bg-gray-200 rounded-full mx-auto" style={{ height: `${h}%` }} />
                    </div>
                    <div className="w-4 h-3 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between h-[160px] gap-4 px-2">
                  {bars.map((b, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                      <div className="relative w-full flex justify-center h-[140px] flex-col justify-end" title={`${b.count} task${b.count !== 1 ? 's' : ''}`}>
                        <div className="absolute inset-0 bg-gray-50 rounded-full w-12 mx-auto" />
                        <div
                          className="relative w-12 bg-brand group-hover:bg-brand-dark rounded-full transition-all duration-300 mx-auto shadow-sm"
                          style={{ height: `${(b.count / maxBar) * 100}%`, minHeight: b.count > 0 ? '8px' : '0', opacity: b.count === maxBar ? 1 : 0.75 }}
                        />
                        {b.count > 0 && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-bold text-brand opacity-0 group-hover:opacity-100 transition-opacity">{b.count}</div>
                        )}
                      </div>
                      <div className="text-[13px] font-bold text-text-3 uppercase">{b.day}</div>
                    </div>
                  ))}
                </div>
                {bars.every(b => b.count === 0) && (
                  <div className="text-center text-text-3 text-[13px] font-medium mt-2">No tasks created this week yet — add some!</div>
                )}
              </>
            )}
          </div>

          {/* ── Task Breakdown (Donut) ── */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-border-light/50 relative">
            <div className="font-bold text-[16px] text-text-main mb-4">Task Breakdown</div>
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative mb-6">
                <DonutChart pct={donePct} color="#10B981" />
                <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                  <div className="text-[28px] font-extrabold text-text-main leading-none">{donePct}%</div>
                  <div className="text-[11px] text-text-3 font-medium mt-1">Completed</div>
                </div>
              </div>
              <div className="flex flex-col gap-3 w-full">
                {[
                  { color: '#10B981', label: 'Done',        count: taskBreakdown.done },
                  { color: '#F59E0B', label: 'Review',      count: taskBreakdown.review },
                  { color: '#1A1D2E', label: 'In Progress', count: taskBreakdown.inProgress },
                  { color: '#EEF0FF', label: 'Backlog',     count: taskBreakdown.backlog },
                ].map(({ color, label, count }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-text-3">
                      <div className="w-2.5 h-2.5 rounded-full border border-border-light" style={{ background: color }} />
                      {label}
                    </div>
                    <span className="text-[12px] font-extrabold text-text-main">{loading ? '—' : count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Team Activity ── */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-border-light/50">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-[16px] text-text-main">Team Activity</span>
            </div>
            {loading ? (
              <div className="space-y-5 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-2xl" />)}
              </div>
            ) : team.length === 0 ? (
              <div className="text-center text-text-3 text-[13px] font-medium py-6">
                No team members yet.<br/>Add members to track activity.
              </div>
            ) : (
              <div className="space-y-4">
                {team.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-4">
                    <Avatar user={USERS[i % USERS.length]} size={42} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-text-main truncate">{m.full_name ?? 'Unknown'}</div>
                      <div className="text-[12px] text-text-3 truncate font-medium mt-0.5">{m.role ?? 'Member'}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[14px] font-extrabold text-brand">{m.taskCount}</div>
                      <div className="text-[11px] text-text-3 font-medium">tasks</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Active Projects ── */}
          <div className="col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-border-light/50">
            <div className="flex items-center justify-between mb-5">
              <span className="font-bold text-[16px] text-text-main">Active Projects</span>
              {isAdmin && (
                <button
                  onClick={() => setShowAddProject(true)}
                  className="px-3 py-1.5 rounded-full border border-border-light text-[12px] font-bold text-brand flex items-center gap-1 hover:bg-gray-50 transition-colors"
                >
                  <Icon name="plus" size={14} /> New Project
                </button>
              )}
            </div>
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-2xl" />)}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-text-3 text-[14px] font-bold mb-1">No projects yet</div>
                <div className="text-text-3 text-[13px] font-medium mb-3">Create your first project to get started</div>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddProject(true)}
                    className="bg-brand text-white px-4 py-2 rounded-xl text-[13px] font-bold hover:bg-brand-dark transition-colors"
                  >
                    + Create Project
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map(p => (
                  <div key={p.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-opacity-10"
                      style={{ backgroundColor: `${p.color}18` }}
                    >
                      {projectIcon(p.color)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-text-main leading-tight truncate">{p.name}</div>
                      <div className="text-[12px] text-text-3 font-medium mt-0.5">
                        {p.due_date
                          ? `Due ${new Date(p.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                          : 'No due date'}
                      </div>
                    </div>
                    <StatusPill status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};
