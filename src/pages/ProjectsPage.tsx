import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Icon, StatusPill } from '../components/Common';
import { TasksPage } from './TasksPage';
import { useAuth } from '../hooks/useAuth';

interface UserStory {
  id: string;
  title: string;
  content: string;
  project_id: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
}

const RichTextEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only set initial value to avoid cursor jumping

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="border border-border-light rounded-xl overflow-hidden bg-white focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all">
      <div className="flex items-center gap-1 p-2 border-b border-border-light/50 bg-gray-50/50">
        <button type="button" onClick={() => exec('bold')} className="p-1.5 text-text-3 hover:text-text-main hover:bg-gray-200 rounded" title="Bold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></svg>
        </button>
        <button type="button" onClick={() => exec('italic')} className="p-1.5 text-text-3 hover:text-text-main hover:bg-gray-200 rounded" title="Italic">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
        </button>
        <div className="w-px h-4 bg-border-light mx-1" />
        <div className="flex items-center gap-1 px-1">
          <label htmlFor="textColor" className="text-[12px] font-bold text-text-3 cursor-pointer hover:text-text-main" title="Text Color">
            Color:
          </label>
          <input 
            id="textColor"
            type="color" 
            onChange={(e) => exec('foreColor', e.target.value)} 
            className="w-5 h-5 rounded cursor-pointer border-none bg-transparent p-0" 
            title="Text Color"
          />
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[120px] outline-none text-[14px] text-text-main leading-relaxed prose prose-sm max-w-none"
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
      />
    </div>
  );
};

const UserStoryTab = ({ projectId, isAdmin }: { projectId: string; isAdmin: boolean }) => {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('As a [type of user],<br>I want [goal or action],<br>so that [benefit or value].');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStories = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('user_stories').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
    setStories(data || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('user_stories').insert([{ project_id: projectId, title, content }]);
    setSubmitting(false);
    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      setIsAdding(false);
      setTitle('');
      setContent('As a [type of user],<br>I want [goal or action],<br>so that [benefit or value].');
      fetchStories();
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim() || !editContent.trim() || editContent === '<br>') return;
    await supabase.from('user_stories').update({ title: editTitle, content: editContent }).eq('id', id);
    setEditingId(null);
    fetchStories();
  };

  const confirmDelete = async () => {
    if (!storyToDelete) return;
    await supabase.from('user_stories').delete().eq('id', storyToDelete);
    setStoryToDelete(null);
    fetchStories();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-[20px] font-extrabold text-text-main">User Stories</h2>
          <p className="text-[13px] text-text-3 font-medium mt-1">Define the "who", "what", and "why" of features.</p>
        </div>
        {/* Removed isAdmin check here so all users can add stories */}
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-brand text-white px-4 py-2 rounded-xl text-[13px] font-bold hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-[0_4px_12px_rgba(92,79,229,0.2)]">
            <Icon name="plus" size={14} /> Add Story
          </button>
        )}
      </div>

      {storyToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-border-light/50">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </div>
            <h3 className="text-[20px] font-extrabold text-text-main mb-2">Delete Story?</h3>
            <p className="text-[14px] text-text-3 font-medium mb-8 leading-relaxed">Are you sure you want to delete this user story? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setStoryToDelete(null)} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-text-3 hover:text-text-main hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm transition-colors">Delete Story</button>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white rounded-3xl p-6 border border-border-light shadow-sm mb-8">
          <h3 className="text-[15px] font-bold text-text-main mb-4">New User Story</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-text-3 mb-2 uppercase tracking-wide">Story Title</label>
              <input 
                autoFocus 
                required 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full bg-gray-50 border border-border-light rounded-xl px-4 py-2.5 text-[14px] text-text-main focus:bg-white focus:border-brand outline-none transition-colors" 
                placeholder="e.g. Shopping Cart Checkout" 
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-text-3 mb-2 uppercase tracking-wide">Story Content</label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-xl text-[13px] font-bold text-text-3 hover:text-text-main hover:bg-gray-100 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-brand hover:bg-brand-dark transition-colors shadow-sm disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Story'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1,2].map(i => <div key={i} className="h-24 bg-white border border-border-light/50 rounded-2xl" />)}
        </div>
      ) : stories.length === 0 && !isAdding ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-border-light/50 shadow-sm">
          <div className="w-16 h-16 bg-brand-light text-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h3 className="text-[16px] font-bold text-text-main mb-1">No User Stories Yet</h3>
          <p className="text-[14px] text-text-3 font-medium">As a [user], I want [goal], so that [benefit].</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map(s => {
            const isEditing = editingId === s.id;
            return (
              <div key={s.id} className="bg-white rounded-2xl p-6 border border-border-light/50 shadow-sm relative group hover:border-brand/30 transition-colors flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                  #
                </div>
                
                {isEditing ? (
                  <div className="flex-1 space-y-3">
                    <input 
                      required 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)} 
                      className="w-full bg-gray-50 border border-border-light rounded-xl px-4 py-2 text-[14px] font-bold text-text-main focus:bg-white focus:border-brand outline-none transition-colors" 
                      placeholder="Story Title" 
                    />
                    <RichTextEditor value={editContent} onChange={setEditContent} />
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-text-3 hover:bg-gray-100 transition-colors">Cancel</button>
                      <button onClick={() => handleSaveEdit(s.id)} className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white bg-brand hover:bg-brand-dark transition-colors shadow-sm">Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[16px] font-extrabold text-text-main mb-2">{s.title || 'Untitled Story'}</h4>
                      <div 
                        className="text-[15px] text-text-main leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1"
                        dangerouslySetInnerHTML={{ __html: s.content }} 
                      />
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingId(s.id); setEditTitle(s.title || ''); setEditContent(s.content); }} 
                        className="text-text-3 hover:text-brand p-1.5 hover:bg-brand-light/30 rounded-lg"
                        title="Edit Story"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => setStoryToDelete(s.id)} className="text-text-3 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg" title="Delete Story">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ProjectsPage = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'stories' | 'tasks'>('tasks');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  const fetchProjects = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in.");
      setCreatingProject(false);
      return;
    }
    
    const colors = ['#5C4FE5', '#E54F70', '#4FE5A6', '#E5A64F'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const { error } = await supabase.from('projects').insert([{
      name: newProjectName,
      description: newProjectDesc,
      owner_id: user.id,
      color: color,
      status: 'Active'
    }]);
    
    setCreatingProject(false);
    if (error) {
      alert(error.message);
    } else {
      setShowCreateProject(false);
      setNewProjectName('');
      setNewProjectDesc('');
      fetchProjects();
    }
  };

  if (selectedProject) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-bg">
        {/* Header */}
        <div className="px-8 pt-6 pb-0 border-b border-border-light/50 bg-white shadow-sm flex-shrink-0 z-10">
          <button 
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-2 text-[13px] font-bold text-text-3 hover:text-brand transition-colors mb-4"
          >
            <div style={{ transform: 'rotate(180deg)' }} className="flex">
              <Icon name="arrow" size={14} />
            </div>
            Back to Projects
          </button>
          <div className="flex items-center justify-between">
            <div className="group flex items-start gap-4">
              <div>
                <h1 className="text-[28px] font-extrabold text-text-main tracking-tight leading-tight">{selectedProject.name}</h1>
                <div className="text-[14px] text-text-3 font-medium mt-1">{selectedProject.description || 'No description provided.'}</div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 mt-1">
                <button 
                  onClick={() => {
                    setEditProjectName(selectedProject.name);
                    setEditProjectDesc(selectedProject.description || '');
                    setShowEditProject(true);
                  }} 
                  className="p-1.5 bg-gray-100 hover:bg-brand-light/50 text-text-3 hover:text-brand rounded-lg transition-colors"
                  title="Edit Project"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button 
                  onClick={() => setShowDeleteProject(true)} 
                  className="p-1.5 bg-gray-100 hover:bg-red-50 text-text-3 hover:text-red-500 rounded-lg transition-colors"
                  title="Delete Project"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </button>
              </div>
            </div>
            <StatusPill status={selectedProject.status} />
          </div>

          {/* Tabs */}
          <div className="flex gap-8 mt-8">
            <button 
              onClick={() => setActiveTab('stories')}
              className={`pb-4 text-[14px] font-bold border-b-2 transition-colors ${activeTab === 'stories' ? 'border-brand text-brand' : 'border-transparent text-text-3 hover:text-text-main'}`}
            >
              User Story
            </button>
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`pb-4 text-[14px] font-bold border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-brand text-brand' : 'border-transparent text-text-3 hover:text-text-main'}`}
            >
              Tasks
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-gray-50/30">
          {activeTab === 'tasks' ? (
             <div className="flex-1 flex flex-col pt-6">
               <TasksPage projectId={selectedProject.id} />
             </div>
          ) : (
             <div className="flex-1 overflow-y-auto">
               <UserStoryTab projectId={selectedProject.id} isAdmin={isAdmin} />
             </div>
          )}
        </div>

        {/* Edit Project Modal */}
        {showEditProject && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!editProjectName.trim()) return;
              const { error } = await supabase.from('projects').update({ name: editProjectName, description: editProjectDesc }).eq('id', selectedProject.id);
              if (!error) {
                setSelectedProject({ ...selectedProject, name: editProjectName, description: editProjectDesc });
                setShowEditProject(false);
                fetchProjects();
              }
            }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-border-light/50">
              <h3 className="text-[20px] font-extrabold text-text-main mb-6">Edit Project</h3>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[12px] font-bold text-text-3 mb-2 uppercase tracking-wide">Project Name</label>
                  <input autoFocus required value={editProjectName} onChange={e => setEditProjectName(e.target.value)} className="w-full bg-gray-50 border border-border-light rounded-xl px-4 py-2.5 text-[14px] text-text-main focus:bg-white focus:border-brand outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-text-3 mb-2 uppercase tracking-wide">Description</label>
                  <textarea value={editProjectDesc} onChange={e => setEditProjectDesc(e.target.value)} className="w-full bg-gray-50 border border-border-light rounded-xl px-4 py-3 text-[14px] text-text-main focus:bg-white focus:border-brand outline-none transition-colors min-h-[100px] resize-y" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditProject(false)} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-text-3 hover:text-text-main hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-white bg-brand hover:bg-brand-dark shadow-sm transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Project Modal */}
        {showDeleteProject && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-border-light/50">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </div>
              <h3 className="text-[20px] font-extrabold text-text-main mb-2">Delete Project?</h3>
              <p className="text-[14px] text-text-3 font-medium mb-8 leading-relaxed">Are you sure you want to delete "{selectedProject.name}"? This action cannot be undone and will delete all user stories and tasks inside it.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteProject(false)} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-text-3 hover:text-text-main hover:bg-gray-100 transition-colors">Cancel</button>
                <button onClick={async () => {
                  await supabase.from('projects').delete().eq('id', selectedProject.id);
                  setShowDeleteProject(false);
                  setSelectedProject(null);
                  fetchProjects();
                }} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm transition-colors">Delete Project</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-8 relative">
      <div className="mb-8 mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-extrabold text-text-main tracking-tight leading-tight">Projects</h1>
          <p className="text-[14px] text-text-3 mt-1 font-medium">Select a project to view its user stories and tasks.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreateProject(true)} className="bg-brand text-white px-5 py-2.5 rounded-xl text-[14px] font-bold hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-[0_4px_12px_rgba(92,79,229,0.2)]">
            <Icon name="plus" size={16} /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-3xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-border-light/50 shadow-sm">
           <p className="text-text-3 font-medium">No projects found. Please add a project from the Dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className="bg-white rounded-3xl p-6 text-left border border-border-light/50 hover:border-brand/50 hover:shadow-lg transition-all group"
            >
               <div className="flex items-start justify-between mb-5">
                 <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-opacity-10" style={{ backgroundColor: `${p.color}18` }}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                   </svg>
                 </div>
                 <StatusPill status={p.status} />
               </div>
               <h3 className="text-[18px] font-extrabold text-text-main group-hover:text-brand transition-colors mb-2">{p.name}</h3>
               <p className="text-[13px] text-text-3 font-medium line-clamp-2 leading-relaxed">{p.description || 'No description.'}</p>
            </button>
          ))}
        </div>
      )}

      {showCreateProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateProject} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-border-light/50">
            <h3 className="text-[20px] font-extrabold text-text-main mb-6">Create New Project</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[12px] font-bold text-text-3 mb-2 uppercase tracking-wide">Project Name</label>
                <input 
                  autoFocus 
                  required 
                  value={newProjectName} 
                  onChange={e => setNewProjectName(e.target.value)} 
                  className="w-full bg-gray-50 border border-border-light rounded-xl px-4 py-2.5 text-[14px] text-text-main focus:bg-white focus:border-brand outline-none transition-colors" 
                  placeholder="e.g. Website Redesign" 
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-text-3 mb-2 uppercase tracking-wide">Description (Optional)</label>
                <textarea 
                  value={newProjectDesc} 
                  onChange={e => setNewProjectDesc(e.target.value)} 
                  className="w-full bg-gray-50 border border-border-light rounded-xl px-4 py-3 text-[14px] text-text-main focus:bg-white focus:border-brand outline-none transition-colors min-h-[100px] resize-y" 
                  placeholder="What is this project about?" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateProject(false)} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-text-3 hover:text-text-main hover:bg-gray-100 transition-colors">Cancel</button>
              <button type="submit" disabled={creatingProject} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-white bg-brand hover:bg-brand-dark shadow-sm transition-colors disabled:opacity-50">
                {creatingProject ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
