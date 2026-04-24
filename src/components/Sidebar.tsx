import React from 'react';
import { Icon } from './Common';

export const Sidebar = ({ page, setPage }: { page: string, setPage: (p: string) => void }) => {
  const nav = [
    {
      label: '', items: [
        { id: 'dashboard', icon: 'dashboard', name: 'Dashboard' },
        { id: 'projects', icon: 'tasks', name: 'Projects' },
        { id: 'calendar', icon: 'calendar', name: 'Calendar' },
        { id: 'analytics', icon: 'analytics', name: 'Analytics' },
        { id: 'team', icon: 'team', name: 'Team' },
      ]
    },
    {
      label: 'GENERAL', items: [
        { id: 'settings', icon: 'settings', name: 'Settings' },
      ]
    }
  ];
  return (
    <div className="w-[240px] min-w-[240px] bg-white flex flex-col pb-4 overflow-y-auto">
      <div className="px-6 pt-7 pb-6 flex items-center gap-2">
        <span className="text-[26px] font-extrabold text-brand tracking-tighter" style={{ fontFamily: 'Plus Jakarta Sans' }}>Sprintly</span>
      </div>
      {nav.map(group => (
        <div key={group.label} className="mt-2">
          {group.label && <div className="text-[11px] font-bold text-text-3 tracking-[1.5px] uppercase px-6 py-2">{group.label}</div>}
          {group.items.map(item => {
            const isActive = page === item.id;
            return (
              <div key={item.id} className={`flex items-center gap-3 px-6 py-[12px] my-0.5 text-[14px] font-semibold cursor-pointer transition-all duration-150 relative ${isActive ? 'text-text-main' : 'text-text-3 hover:text-text-main'}`} onClick={() => setPage(item.id)}>
                {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-[4px] bg-brand rounded-r-md shadow-[2px_0_8px_rgba(92,79,229,0.5)]" />}
                <span className={`flex-shrink-0 ${isActive ? 'text-brand' : ''}`}><Icon name={item.icon} size={20} /></span>
                {item.name}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
