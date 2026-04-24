import React, { useState, useEffect, useCallback } from 'react';
import { DonutChart } from '../components/Common';
import { supabase } from '../lib/supabase';
import { useDarkMode } from '../hooks/useDarkMode';

/* ── Types ── */
interface AnalyticsData {
  total: number;
  done: number;
  inProgress: number;
  review: number;
  backlog: number;
  overdue: number;
  completionRate: number;
  monthlyTasks: { label: string; count: number; done: number }[];
  priorityBreakdown: { label: string; count: number; color: string }[];
  topContributor: { name: string; done: number; total: number } | null;
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatCard = ({ label, value, sub, color = 'text-brand', loading = false }: {
  label: string; value: string | number; sub: string; color?: string; loading?: boolean;
}) => (
  <div className="bg-white rounded-3xl p-6 shadow-sm border border-border-light/50">
    <div className="text-[12px] font-bold text-text-3 mb-3 uppercase tracking-wider">{label}</div>
    <div className={`text-[32px] font-extrabold tracking-tight mb-2 ${color}`}>
      {loading ? <span className="animate-pulse text-[24px] text-gray-300">—</span> : value}
    </div>
    <div className="text-[12px] font-bold text-text-3">{sub}</div>
  </div>
);

export const AnalyticsPage = () => {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);

    const [tasksRes, profilesRes] = await Promise.all([
      supabase.from('tasks').select('id, status, priority, assignee_id, due_date, created_at'),
      supabase.from('profiles').select('id, full_name'),
    ]);

    const tasks    = tasksRes.data    ?? [];
    const profiles = profilesRes.data ?? [];
    const now      = new Date();

    /* ── Basic counts ── */
    const done       = tasks.filter(t => t.status === 'Done').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const review     = tasks.filter(t => t.status === 'Review').length;
    const backlog    = tasks.filter(t => t.status === 'Backlog').length;
    const total      = tasks.length;
    const overdue    = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'Done').length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    /* ── Monthly task activity: last 7 months ── */
    const monthlyTasks = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
      const label = MONTH_NAMES[d.getMonth()];
      const yr = d.getFullYear(), mo = d.getMonth();
      const monthTasks = tasks.filter(t => {
        const td = new Date(t.created_at);
        return td.getFullYear() === yr && td.getMonth() === mo;
      });
      return {
        label,
        count: monthTasks.length,
        done:  monthTasks.filter(t => t.status === 'Done').length,
      };
    });

    /* ── Priority breakdown ── */
    const priorityBreakdown = [
      { label: 'High',   count: tasks.filter(t => t.priority === 'High').length,   color: '#EF4444' },
      { label: 'Medium', count: tasks.filter(t => t.priority === 'Medium').length, color: '#F59E0B' },
      { label: 'Low',    count: tasks.filter(t => t.priority === 'Low').length,    color: '#10B981' },
    ];

    /* ── Top contributor: profile with most Done tasks ── */
    const profileMap: Record<string, string> = {};
    profiles.forEach(p => { profileMap[p.id] = p.full_name ?? 'Unknown'; });

    const doneTasks = tasks.filter(t => t.status === 'Done' && t.assignee_id);
    const counts: Record<string, number> = {};
    doneTasks.forEach(t => {
      if (t.assignee_id) counts[t.assignee_id] = (counts[t.assignee_id] ?? 0) + 1;
    });
    const topId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] ?? null;
    const topContributor = topId ? {
      name:  profileMap[topId] ?? 'Unknown',
      done:  counts[topId],
      total: tasks.filter(t => t.assignee_id === topId).length,
    } : null;

    setData({ total, done, inProgress, review, backlog, overdue, completionRate, monthlyTasks, priorityBreakdown, topContributor });
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const maxBar = Math.max(...(data?.monthlyTasks?.map(m => m.count) ?? [1]), 1);

  const statusBreakdown = data ? [
    { label: 'Done',        count: data.done,       color: '#10B981', bg: 'bg-green-500' },
    { label: 'In Progress', count: data.inProgress, color: '#5C4FE5', bg: 'bg-brand' },
    { label: 'Review',      count: data.review,     color: '#F59E0B', bg: 'bg-amber-400' },
    { label: 'Backlog',     count: data.backlog,     color: '#6B7280', bg: 'bg-gray-400' },
  ] : [];

  const { isDark } = useDarkMode();

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[32px] font-extrabold text-text-main tracking-tight leading-tight">Analytics</div>
          <div className="text-[14px] text-text-3 mt-1 font-medium">
            {loading ? 'Loading your project data…' : `${data?.total ?? 0} total tasks · ${data?.completionRate ?? 0}% complete`}
          </div>
        </div>
        <button
          onClick={fetchAnalytics}
          className="bg-white dark:bg-dark-paper border border-border-light dark:border-dark-border rounded-xl px-5 py-3 text-[14px] font-bold text-text-main shadow-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard label="Tasks Completed"  value={data?.done ?? 0}             sub="Status: Done"          color="text-green-600"  loading={loading} />
        <StatCard label="Completion Rate"  value={`${data?.completionRate ?? 0}%`} sub="Done / Total tasks"  color="text-brand"       loading={loading} />
        <StatCard label="In Progress"      value={data?.inProgress ?? 0}       sub="Currently active"      color="text-brand"       loading={loading} />
        <StatCard label="Overdue Tasks"    value={data?.overdue ?? 0}          sub="Past due date"         color="text-red-500"     loading={loading} />
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* ── Monthly Task Velocity (bar chart) ── */}
        <div className="col-span-2 bg-white dark:bg-dark-paper rounded-3xl p-8 shadow-sm border border-border-light/50 dark:border-dark-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="font-bold text-[18px] text-text-main">Monthly Task Activity</span>
              <div className="text-[12px] text-text-3 font-medium mt-0.5">Tasks created vs completed per month</div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[12px] font-bold text-text-3">
                <div className="w-3 h-3 rounded-full bg-brand" /> Created
              </div>
              <div className="flex items-center gap-2 text-[12px] font-bold text-text-3">
                <div className="w-3 h-3 rounded-full bg-green-500" /> Completed
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-end justify-between h-[220px] gap-6 px-4 animate-pulse">
              {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-full bg-gray-100 dark:bg-dark-border rounded-t-xl" style={{ height: `${40 + i * 20}px` }} />
                  <div className="w-8 h-3 bg-gray-100 dark:bg-dark-border rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between h-[220px] gap-6 px-4 relative">
                <div className="absolute inset-0 flex flex-col justify-between opacity-5 pr-4">
                  {[1,2,3,4].map(i => <div key={i} className="border-t border-text-main w-full" />)}
                </div>
                {data?.monthlyTasks?.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 relative z-10 group">
                    <div className="w-full relative flex flex-col justify-end h-[180px]">
                      {/* Created bar (background) */}
                      <div
                        className="absolute inset-x-1 bottom-0 bg-brand-light rounded-t-xl opacity-60"
                        style={{ height: `${(m.count / maxBar) * 100}%`, minHeight: m.count > 0 ? 6 : 0 }}
                      />
                      {/* Done bar (foreground) */}
                      <div
                        className="relative bg-brand rounded-t-xl w-full transition-all duration-500 shadow-sm shadow-brand/10"
                        style={{ height: `${(m.done / maxBar) * 100}%`, minHeight: m.done > 0 ? 6 : 0 }}
                      />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-text-main text-white text-[11px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                      {m.done}/{m.count} done
                    </div>
                    <div className="text-[13px] font-bold text-text-3">{m.label}</div>
                  </div>
                ))}
              </div>
              {data?.total === 0 && (
                <div className="text-center text-text-3 text-[13px] font-medium mt-4">No tasks yet — add some to see activity</div>
              )}
            </>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-6">

          {/* Donut: Task Status Distribution */}
          <div className="bg-white dark:bg-dark-paper rounded-3xl p-7 shadow-sm border border-border-light/50 dark:border-dark-border">
            <div className="font-bold text-[18px] text-text-main mb-6">Task Distribution</div>
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <DonutChart pct={data?.completionRate ?? 0} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                  <div className="text-[30px] font-extrabold text-text-main leading-none">{loading ? '—' : `${data?.completionRate ?? 0}%`}</div>
                  <div className="text-[11px] text-text-3 font-bold uppercase mt-1">Complete</div>
                </div>
              </div>
              <div className="w-full space-y-3">
                {statusBreakdown.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[13px] font-bold text-text-2">{s.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ backgroundColor: s.color, width: data?.total ? `${(s.count / data.total) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-[13px] font-extrabold text-text-main w-6 text-right">{loading ? '—' : s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="bg-white dark:bg-dark-paper rounded-3xl p-7 shadow-sm border border-border-light/50 dark:border-dark-border">
            <div className="font-bold text-[16px] text-text-main mb-5">Priority Breakdown</div>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 dark:bg-dark-border rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {data?.priorityBreakdown?.map(p => (
                  <div key={p.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-[13px] font-bold text-text-2">{p.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ backgroundColor: p.color, width: data.total ? `${(p.count / data.total) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-[13px] font-extrabold text-text-main w-6 text-right">{p.count}</span>
                    </div>
                  </div>
                ))}
                {data?.total === 0 && (
                  <div className="text-center text-text-3 text-[13px] font-medium py-2">No tasks added yet</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Tasks Solved: row of status cards ── */}
        <div className="col-span-3 grid grid-cols-4 gap-6">
          {statusBreakdown.map(s => (
            <div key={s.label} className="bg-white dark:bg-dark-paper rounded-3xl p-6 shadow-sm border border-border-light/50 dark:border-dark-border flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.color + '18' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.2" strokeLinecap="round">
                  {s.label === 'Done'        && <path d="M20 6L9 17l-5-5"/>}
                  {s.label === 'In Progress' && <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>}
                  {s.label === 'Review'      && <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  {s.label === 'Backlog'     && <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>}
                </svg>
              </div>
              <div>
                <div className="text-[28px] font-extrabold text-text-main leading-none mb-1">
                  {loading ? <span className="text-[20px] text-gray-300 animate-pulse">—</span> : s.count}
                </div>
                <div className="text-[12px] font-bold text-text-3 uppercase tracking-wider">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Top Contributor card ── */}
        <div className={`col-span-3 rounded-3xl p-8 relative overflow-hidden transition-all duration-500 ${
          isDark 
            ? 'bg-gray-50 text-white shadow-2xl' 
            : 'bg-white border border-border-light/50 text-text-main shadow-sm'
        }`}>
          <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl ${isDark ? 'bg-brand/20' : 'bg-brand/5'}`} />
          <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl ${isDark ? 'bg-green-500/10' : 'bg-green-500/5'}`} />
          
          <div className="relative z-10">
            <div className={`text-[13px] font-bold mb-6 uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-text-3'}`}>Top Contributor</div>
            
            {loading ? (
              <div className="animate-pulse flex items-center gap-5 mb-6">
                <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                <div className="space-y-2">
                  <div className={`h-5 w-32 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                  <div className={`h-4 w-20 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
                </div>
              </div>
            ) : data?.topContributor ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center text-white font-extrabold text-[22px] flex-shrink-0 shadow-lg shadow-brand/20">
                    {data.topContributor.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[24px] font-extrabold mb-1 tracking-tight">{data.topContributor.name}</div>
                    <div className={`text-[13px] font-medium ${isDark ? 'text-white/50' : 'text-text-3'}`}>Most tasks completed this sprint</div>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  {[
                    { label: 'Done', val: data.topContributor.done, color: 'text-green-500' },
                    { label: 'Assigned', val: data.topContributor.total, color: isDark ? 'text-white' : 'text-text-main' },
                    { label: 'Rate', val: `${data.topContributor.total > 0 ? Math.round((data.topContributor.done / data.topContributor.total) * 100) : 0}%`, color: 'text-brand' }
                  ].map((stat, idx) => (
                    <div key={idx} className={`rounded-2xl p-5 border text-center min-w-[100px] transition-all ${
                      isDark 
                        ? 'bg-gray-100 border-border-light/50' 
                        : 'bg-gray-50 border-gray-100'
                    }`}>
                      <div className={`text-[28px] font-black ${stat.color}`}>{stat.val}</div>
                      <div className={`text-[11px] font-bold uppercase mt-1 tracking-wider ${isDark ? 'text-white/40' : 'text-text-3'}`}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`text-center py-4 font-medium text-[14px] ${isDark ? 'text-white/40' : 'text-text-3'}`}>
                No completed tasks yet — complete some tasks to see the top contributor.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
