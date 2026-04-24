import React, { useState, useEffect, useCallback } from 'react';
import { Icon, StatusPill } from '../components/Common';
import { AddTaskModal } from '../components/modals/AddTaskModal';
import { AddMemberModal } from '../components/modals/AddMemberModal';
import { ViewInvitationsModal } from '../components/modals/ViewInvitationsModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  points: number | null;
  assignee_id: string | null;
  assignee_name?: string | null;
  due_date: string | null;
  created_at: string;
}

const COLUMNS = ['Backlog', 'In Progress', 'Review', 'Done'] as const;
const COL_COLOR: Record<string, string> = {
  'Backlog':     '#6B7280',
  'In Progress': '#5C4FE5',
  'Review':      '#F59E0B',
  'Done':        '#10B981',
};
const NEXT_STATUS: Record<string, string> = {
  'Backlog':     'In Progress',
  'In Progress': 'Review',
  'Review':      'Done',
  'Done':        'Backlog',
};

const InitialsAvatar = ({ name, size = 28 }: { name: string; size?: number }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors   = ['#5C4FE5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  const color    = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center font-extrabold text-white flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.35 }}
      title={name}
    >
      {initials}
    </div>
  );
};

/* ── Admin Crown Badge ── */
const AdminBadge = () => (
  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 19l4-10 6 5 6-5 4 10H2z"/>
    </svg>
    Admin
  </span>
);

export const TasksPage = ({ projectId }: { projectId?: string }) => {
  const { isAdmin, userId } = useAuth();

  const [showAddTask,   setShowAddTask]   = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showViewInvitations, setShowViewInvitations] = useState(false);
  const [addTaskStatus, setAddTaskStatus] = useState('Backlog');
  const [tasks,         setTasks]         = useState<Task[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [movingId,      setMovingId]      = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [submittingId,  setSubmittingId]  = useState<string | null>(null);
  const [approvingId,   setApprovingId]   = useState<string | null>(null);
  const [returningId,   setReturningId]   = useState<string | null>(null);
  const [acceptingId,   setAcceptingId]   = useState<string | null>(null);
  const [invitations,   setInvitations]   = useState<any[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('tasks')
      .select('id, title, description, status, priority, points, assignee_id, due_date, created_at')
      .order('created_at', { ascending: true });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: taskData } = await query;

    if (!taskData) { setLoading(false); return; }

    const assigneeIds = [...new Set(taskData.map(t => t.assignee_id).filter(Boolean))];
    let profileMap: Record<string, string> = {};
    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', assigneeIds as string[]);
      if (profiles) {
        profiles.forEach(p => { profileMap[p.id] = p.full_name ?? 'Unknown'; });
      }
    }

    setTasks(taskData.map(t => ({
      ...t,
      assignee_name: t.assignee_id ? (profileMap[t.assignee_id] ?? null) : null,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const fetchInvitations = useCallback(async () => {
    if (!isAdmin) return;
    setInvitesLoading(true);
    let query = supabase.from('invitations').select('*, projects(name)').order('created_at', { ascending: false });
    
    // Filter by project if we are in a project view
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data } = await query;
    if (data) setInvitations(data);
    setInvitesLoading(false);
  }, [isAdmin, projectId]);

  useEffect(() => {
    if (isAdmin) fetchInvitations();
  }, [isAdmin, fetchInvitations]);

  /* ── Admin: move to next status ── */
  const moveTask = async (task: Task) => {
    const next = NEXT_STATUS[task.status];
    setMovingId(task.id);
    const { error } = await supabase.from('tasks').update({ status: next }).eq('id', task.id);
    if (error) alert(`Error moving task: ${error.message}`);
    else setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    setMovingId(null);
  };

  /* ── Admin: delete task ── */
  const deleteTask = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) alert(`Error deleting task: ${error.message}`);
    else setTasks(prev => prev.filter(t => t.id !== id));
    setConfirmDeleteId(null);
    setDeletingId(null);
  };

  /* ── Regular user: submit task for review (In Progress → Review) ── */
  const submitTask = async (task: Task) => {
    setSubmittingId(task.id);
    const { error } = await supabase.from('tasks').update({ status: 'Review' }).eq('id', task.id);
    if (error) alert(`Error submitting task: ${error.message}`);
    else setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Review' } : t));
    setSubmittingId(null);
  };

  /* ── Regular user: accept task (Backlog → In Progress) ── */
  const acceptTask = async (task: Task) => {
    setAcceptingId(task.id);
    const { error } = await supabase.from('tasks').update({ status: 'In Progress' }).eq('id', task.id);
    if (error) alert(`Error accepting task: ${error.message}`);
    else setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'In Progress' } : t));
    setAcceptingId(null);
  };

  /* ── Admin: approve task (Review → Done) ── */
  const approveTask = async (task: Task) => {
    setApprovingId(task.id);
    const { error } = await supabase.from('tasks').update({ status: 'Done' }).eq('id', task.id);
    if (error) alert(`Error approving task: ${error.message}`);
    else setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Done' } : t));
    setApprovingId(null);
  };

  /* ── Admin: return task (Review → In Progress) ── */
  const returnTask = async (task: Task) => {
    setReturningId(task.id);
    const { error } = await supabase.from('tasks').update({ status: 'In Progress' }).eq('id', task.id);
    if (error) alert(`Error returning task: ${error.message}`);
    else setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'In Progress' } : t));
    setReturningId(null);
  };

  const formatDue = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    const now = new Date();
    const isOverdue = d < now;
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      overdue: isOverdue,
    };
  };

  return (
    <>
      {showAddTask && (
        <AddTaskModal
          onClose={() => setShowAddTask(false)}
          onSuccess={() => { setShowAddTask(false); fetchTasks(); }}
          defaultStatus={addTaskStatus}
          projectId={projectId}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onSuccess={() => { setShowAddMember(false); fetchInvitations(); }}
          forcedProjectId={projectId}
        />
      )}
      {showViewInvitations && (
        <ViewInvitationsModal
          onClose={() => setShowViewInvitations(false)}
          invitations={invitations}
          loading={invitesLoading}
        />
      )}

      <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            {!projectId && (
              <div className="flex items-center gap-3">
                <div className="text-[32px] font-extrabold text-text-main tracking-tight leading-tight">Tasks Board</div>
                {isAdmin && <AdminBadge />}
              </div>
            )}
            <div className={`text-[14px] text-text-3 font-medium ${!projectId ? 'mt-1' : ''}`}>
              {loading
                ? 'Loading…'
                : isAdmin
                  ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''} across ${COLUMNS.length} columns`
                  : `Showing tasks across ${COLUMNS.length} columns — submit your work for admin review`}
            </div>
          </div>

          {/* Admin-only action buttons */}
          {isAdmin && (
            <div className="flex gap-3 items-center">
              <button
                onClick={() => { fetchInvitations(); setShowViewInvitations(true); }}
                className="bg-white hover:bg-gray-50 text-text-main border border-border-light rounded-xl px-5 py-3 text-[14px] font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
                </svg>
                Invitations
              </button>
              <button
                onClick={() => setShowAddMember(true)}
                className="bg-white hover:bg-gray-50 text-text-main border border-border-light rounded-xl px-5 py-3 text-[14px] font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <Icon name="plus" size={16} /> Add Member
              </button>
              <button
                onClick={() => { setAddTaskStatus('Backlog'); setShowAddTask(true); }}
                className="bg-brand hover:bg-brand-dark text-white rounded-xl px-5 py-3 text-[14px] font-bold flex items-center gap-2 transition-all shadow-[0_8px_20px_rgba(92,79,229,0.25)] hover:-translate-y-0.5"
              >
                <Icon name="plus" size={16} /> New Task
              </button>
            </div>
          )}

          {/* Regular user info banner */}
          {!isAdmin && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-[13px] font-semibold text-amber-700 max-w-sm text-right">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              Accept assigned tasks to start working, and submit them for review when done.
            </div>
          )}
        </div>

        {/* Board */}
        <div className="grid grid-cols-4 gap-6 flex-1 items-start">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col);
            const color    = COL_COLOR[col];
            return (
              <div key={col} className="bg-white border border-border-light/50 rounded-3xl p-5 flex flex-col shadow-sm">
                {/* Column header */}
                <div className="flex items-center justify-between mb-5">
                  <span className="font-bold text-[15px] text-text-main flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {col}
                    {col === 'Review' && isAdmin && colTasks.length > 0 && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full animate-pulse">
                        Needs review
                      </span>
                    )}
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[12px] font-bold"
                    style={{ backgroundColor: color + '18', color }}
                  >
                    {loading ? '…' : colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto pr-0.5 pb-1">
                  {/* Loading skeletons */}
                  {loading && [1, 2].map(i => (
                    <div key={i} className="bg-gray-50 rounded-2xl p-5 animate-pulse">
                      <div className="h-3 bg-gray-200 rounded w-1/3 mb-3" />
                      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                      <div className="h-px bg-gray-200 mb-3" />
                      <div className="flex justify-between">
                        <div className="h-5 w-12 bg-gray-200 rounded" />
                        <div className="w-7 h-7 bg-gray-200 rounded-full" />
                      </div>
                    </div>
                  ))}

                  {/* Empty state */}
                  {!loading && colTasks.length === 0 && (
                    <div className="py-6 text-center">
                      <div className="w-10 h-10 rounded-2xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: color + '18', color }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                        </svg>
                      </div>
                      <div className="text-[13px] font-bold text-text-3">No tasks yet</div>
                    </div>
                  )}

                  {/* Task cards */}
                  {!loading && colTasks.map(task => {
                    const due = formatDue(task.due_date);
                    const isMyTask = task.assignee_id === userId;
                    const canSubmit = !isAdmin && isMyTask && col === 'In Progress';
                    const canAccept = !isAdmin && isMyTask && col === 'Backlog';

                    return (
                      <div
                        key={task.id}
                        className={`bg-gray-50/60 rounded-2xl p-4 border transition-all cursor-default group ${
                          col === 'Review' && isAdmin
                            ? 'border-amber-200/70 hover:border-amber-300 hover:shadow-md'
                            : 'border-border-light/50 hover:border-brand/30 hover:shadow-md'
                        }`}
                      >
                        {/* Top row */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-bold text-text-3 tracking-wide font-mono">
                            {task.id.slice(0, 8).toUpperCase()}
                          </span>
                          <StatusPill status={task.priority} />
                        </div>

                        {/* Title */}
                        <div className="text-[14px] font-bold text-text-main leading-snug mb-3 group-hover:text-brand transition-colors">
                          {task.title}
                        </div>

                        {/* Description snippet */}
                        {task.description && (
                          <div className="text-[12px] text-text-3 font-medium leading-relaxed mb-3 truncate">
                            {task.description}
                          </div>
                        )}

                        {/* Due date */}
                        {due && (
                          <div className={`text-[11px] font-bold mb-3 flex items-center gap-1 ${due.overdue ? 'text-red-500' : 'text-text-3'}`}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                            {due.overdue ? 'Overdue · ' : ''}{due.label}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-border-light/50">
                          <div className="flex items-center gap-2">
                            {task.points != null && (
                              <div className="text-[12px] font-bold text-brand bg-brand-light px-2.5 py-0.5 rounded-md">
                                {task.points} pts
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">

                            {/* ══ ADMIN CONTROLS ══ */}
                            {isAdmin && (
                              <>
                                {/* Delete button — Done column */}
                                {col === 'Done' && (
                                  confirmDeleteId === task.id ? (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => deleteTask(task.id)}
                                        disabled={deletingId === task.id}
                                        className="text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-60"
                                      >
                                        {deletingId === task.id ? '…' : 'Delete'}
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="text-[11px] font-bold text-text-3 hover:text-text-main px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteId(task.id)}
                                      title="Remove completed task"
                                      className="w-6 h-6 flex items-center justify-center text-text-3 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                        <path d="M10 11v6M14 11v6"/>
                                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                                      </svg>
                                    </button>
                                  )
                                )}

                                {/* Approve / Return — Review column */}
                                {col === 'Review' && (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => approveTask(task)}
                                      disabled={approvingId === task.id}
                                      title="Approve — move to Done"
                                      className="flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-60"
                                    >
                                      {approvingId === task.id ? '…' : (
                                        <>
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                          Approve
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => returnTask(task)}
                                      disabled={returningId === task.id}
                                      title="Return — send back to In Progress"
                                      className="flex items-center gap-1 text-[11px] font-bold text-white bg-red-400 hover:bg-red-500 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-60"
                                    >
                                      {returningId === task.id ? '…' : (
                                        <>
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                          Return
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}

                                {/* Move to next — Backlog, In Progress columns */}
                                {col !== 'Done' && col !== 'Review' && (
                                  <button
                                    onClick={() => moveTask(task)}
                                    disabled={movingId === task.id}
                                    title={`Move to ${NEXT_STATUS[col]}`}
                                    className="text-[11px] font-bold text-text-3 hover:text-brand transition-colors px-2 py-1 rounded-lg hover:bg-brand-light disabled:opacity-40"
                                  >
                                    {movingId === task.id ? '…' : `→ ${NEXT_STATUS[col]}`}
                                  </button>
                                )}
                              </>
                            )}

                            {/* ══ REGULAR USER: Accept Task ══ */}
                            {canAccept && (
                              <button
                                onClick={() => acceptTask(task)}
                                disabled={acceptingId === task.id}
                                title="Accept this task to start working"
                                className="flex items-center gap-1 text-[11px] font-bold text-white bg-blue-500 hover:bg-blue-600 px-2.5 py-1 rounded-lg transition-all shadow-sm disabled:opacity-60"
                              >
                                {acceptingId === task.id ? '…' : (
                                  <>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    Accept
                                  </>
                                )}
                              </button>
                            )}

                            {/* ══ REGULAR USER: Submit for Review ══ */}
                            {canSubmit && (
                              <button
                                onClick={() => submitTask(task)}
                                disabled={submittingId === task.id}
                                title="Submit this task for admin review"
                                className="flex items-center gap-1 text-[11px] font-bold text-white bg-brand hover:bg-brand-dark px-2.5 py-1 rounded-lg transition-all shadow-sm disabled:opacity-60"
                              >
                                {submittingId === task.id ? '…' : (
                                  <>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                    Submit
                                  </>
                                )}
                              </button>
                            )}

                            {/* Assignee avatar */}
                            {task.assignee_name
                              ? <InitialsAvatar name={task.assignee_name} size={26} />
                              : <div className="w-6 h-6 rounded-full bg-gray-200 border border-border-light" title="Unassigned" />
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Task button — admin only */}
                  {!loading && isAdmin && (
                    <button
                      onClick={() => { setAddTaskStatus(col); setShowAddTask(true); }}
                      className="w-full py-3.5 rounded-2xl border-2 border-dashed border-border-light text-text-3 font-bold text-[13px] hover:border-brand hover:text-brand hover:bg-brand-light/30 transition-colors flex items-center justify-center gap-2 mt-1"
                    >
                      <Icon name="plus" size={15} /> Add Task
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
