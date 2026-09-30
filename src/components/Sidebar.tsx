import React from 'react';
import { BOT_CONFIG } from '../config/botConfig';
import { GuildCapabilities } from '../types/guild';
import { 
  ShieldAlert, 
  Gavel, 
  Ticket, 
  Bot, 
  UserCheck, 
  Sparkles, 
  TrendingUp, 
  FileText, 
  Settings2, 
  LayoutDashboard,
  ServerCrash,
  AlertCircle
} from 'lucide-react';

export type TabId = 
  | 'overview' 
  | 'protection' 
  | 'moderation' 
  | 'tickets' 
  | 'autoresponder' 
  | 'roles' 
  | 'welcome' 
  | 'levels' 
  | 'embeds' 
  | 'settings' 
  | 'inspector';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  guildName: string;
  capabilities?: GuildCapabilities | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  guildName,
  capabilities
}) => {
  const botCanManageRoles = capabilities ? capabilities.botPermissions.manageRoles : true;
  const botCanManageChannels = capabilities ? capabilities.botPermissions.manageChannels : true;

  const navItems = [
    { id: 'overview', label: 'لوحة التحكم العامة', icon: LayoutDashboard, badge: null, warning: null },
    { id: 'protection', label: 'الحماية وردع التخريب', icon: ShieldAlert, badge: 'Anti-Raid', warning: null },
    { id: 'moderation', label: 'الإشراف والمحكمة', icon: Gavel, badge: null, warning: null },
    { 
      id: 'tickets', 
      label: 'نظام التذاكر', 
      icon: Ticket, 
      badge: null,
      warning: !botCanManageChannels ? 'صلاحيات البوت غير كافية' : null
    },
    { id: 'autoresponder', label: 'المجيب التلقائي', icon: Bot, badge: null, warning: null },
    { 
      id: 'roles', 
      label: 'الرتب والأتمتة', 
      icon: UserCheck, 
      badge: null,
      warning: !botCanManageRoles ? 'البوت يفتقر لصلاحية Manage Roles' : null
    },
    { id: 'welcome', label: 'الترحيب والمغادرة', icon: Sparkles, badge: null, warning: null },
    { id: 'levels', label: 'المستويات ونقاط XP', icon: TrendingUp, badge: null, warning: null },
    { id: 'embeds', label: 'صانع الرسائل (Embeds)', icon: FileText, badge: 'Color #E53935', warning: null },
    { id: 'settings', label: 'إعدادات السيرفر', icon: Settings2, badge: null, warning: null },
    { id: 'inspector', label: 'فاحص عزل السيرفرات', icon: ServerCrash, badge: 'Multi-Guild', warning: null },
  ];

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 bg-[#0F0F13] border-b lg:border-b-0 lg:border-l border-[#22222B] p-3 lg:p-4 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            إدارة: <span className="text-gray-200 truncate">{guildName}</span>
          </div>

          <nav className="space-y-1 overflow-x-auto lg:overflow-visible flex lg:flex-col pb-2 lg:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id as TabId)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right shrink-0 lg:shrink cursor-pointer ${
                    isActive
                      ? 'bg-[#E53935] text-white shadow-lg shadow-[#E53935]/20'
                      : 'text-gray-400 hover:text-white hover:bg-[#181820]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#E53935]'}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.warning && (
                      <span title={item.warning} className="text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </span>
                    )}

                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#E53935]/15 text-[#E53935]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Branding Info */}
        <div className="hidden lg:block pt-4 border-t border-[#20202B] text-center text-[11px] text-gray-500 space-y-1.5">
          <div className="font-semibold text-gray-400">OneBot Dashboard</div>
          <div>Developed by <span className="text-[#E53935] font-bold">HyperSoft</span></div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 pt-1">
            <a href={BOT_CONFIG.privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 underline">سياسة الخصوصية</a>
            <span>•</span>
            <a href={BOT_CONFIG.termsOfServiceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 underline">شروط الخدمة</a>
          </div>
        </div>
      </aside>

      {/* Mobile Sticky Bottom Navigation (Touch-Friendly for Android) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F0F13]/95 backdrop-blur-md border-t border-[#22222B] px-2 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => onTabChange('overview')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'overview' ? 'text-[#E53935]' : 'text-gray-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>الرئيسية</span>
        </button>

        <button
          onClick={() => onTabChange('protection')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'protection' ? 'text-[#E53935]' : 'text-gray-400'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>الحماية</span>
        </button>

        <button
          onClick={() => onTabChange('moderation')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'moderation' ? 'text-[#E53935]' : 'text-gray-400'
          }`}
        >
          <Gavel className="w-4 h-4" />
          <span>المحكمة</span>
        </button>

        <button
          onClick={() => onTabChange('tickets')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'tickets' ? 'text-[#E53935]' : 'text-gray-400'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>التذاكر</span>
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold ${
            activeTab === 'settings' ? 'text-[#E53935]' : 'text-gray-400'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>الإعدادات</span>
        </button>
      </div>
    </>
  );
};
