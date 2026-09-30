import React, { useState } from 'react';
import { BOT_CONFIG } from '../config/botConfig';
import { GuildSummary, DiscordUser } from '../types/guild';
import { 
  ChevronDown, 
  ShieldCheck, 
  Check, 
  Layers, 
  Server,
  LogOut,
  ExternalLink,
  Plus
} from 'lucide-react';

interface HeaderProps {
  currentGuildSummary: GuildSummary | undefined;
  guildList: GuildSummary[];
  user: DiscordUser | null;
  onSelectGuild: (guildId: string) => void;
  onOpenServerSelector: () => void;
  onLogout: () => void;
  hasUnsavedChanges: boolean;
  onSaveCurrentSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentGuildSummary,
  guildList,
  user,
  onSelectGuild,
  onOpenServerSelector,
  onLogout,
  hasUnsavedChanges,
  onSaveCurrentSettings
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeGuilds = guildList.filter(g => g.botInstalled && g.canManage);

  const userAvatar = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user?.discriminator || '0', 10) % 5}.png`;

  return (
    <header className="sticky top-0 z-40 bg-[#0F0F12]/95 backdrop-blur-md border-b border-[#22222B] px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand identity: OneBot by HyperSoft */}
        <div className="flex items-center gap-3.5">
          <div className="relative group cursor-pointer" onClick={onOpenServerSelector}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E53935] to-[#800F11] p-[2px] shadow-lg shadow-[#E53935]/25 transition-transform group-hover:scale-105">
              <img 
                src={BOT_CONFIG.logoUrl} 
                alt="OneBot Logo" 
                className="w-full h-full object-cover rounded-[10px] bg-black"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icon/Logo.png';
                }}
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0F0F12] rounded-full" title="Online Cluster" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5 cursor-pointer" onClick={onOpenServerSelector}>
                {BOT_CONFIG.name}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E53935]/15 text-[#E53935] border border-[#E53935]/30">
                Dashboard
              </span>
            </div>
            <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <span>بواسطة</span>
              <span className="text-red-400 font-bold hover:underline cursor-pointer">{BOT_CONFIG.developer}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-500 font-mono text-[10px]">v{BOT_CONFIG.version}</span>
            </div>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-3">
          
          {/* Server Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 bg-[#18181E] hover:bg-[#202028] border border-[#2A2A35] hover:border-[#E53935]/50 px-3.5 py-2 rounded-xl text-right transition-all group shadow-sm cursor-pointer"
              aria-label="اختيار السيرفر"
            >
              <div className="w-8 h-8 rounded-lg bg-[#272732] flex items-center justify-center font-bold text-sm text-[#E53935] border border-[#353545] overflow-hidden shrink-0">
                {currentGuildSummary?.guildIcon ? (
                  <img src={currentGuildSummary.guildIcon} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Server className="w-4 h-4 text-[#E53935]" />
                )}
              </div>

              <div className="hidden sm:block text-right">
                <div className="text-[10px] text-gray-400 font-medium">السيرفر المحدد</div>
                <div className="text-xs font-bold text-white max-w-[130px] md:max-w-[180px] truncate">
                  {currentGuildSummary?.guildName || "اختر سيرفراً"}
                </div>
              </div>

              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180 text-[#E53935]' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute left-0 sm:left-auto right-0 mt-2 w-72 sm:w-80 bg-[#16161C] border border-[#2C2C38] rounded-2xl shadow-2xl shadow-black/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-2 border-b border-[#252532] flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#E53935]" />
                    السيرفرات المفعلة ({activeGuilds.length})
                  </span>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenServerSelector();
                    }}
                    className="text-[10px] text-[#E53935] hover:underline font-bold"
                  >
                    عرض الكل
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto py-1 divide-y divide-[#20202B]/40">
                  {activeGuilds.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">
                      لا توجد سيرفرات مضافة حالياً.
                    </div>
                  ) : (
                    activeGuilds.map((guild) => {
                      const isSelected = guild.guildId === currentGuildSummary?.guildId;
                      return (
                        <button
                          key={guild.guildId}
                          onClick={() => {
                            onSelectGuild(guild.guildId);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[#1E1E26] transition-colors text-right cursor-pointer ${
                            isSelected ? 'bg-[#E53935]/10 border-r-4 border-[#E53935]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {guild.guildIcon ? (
                              <img src={guild.guildIcon} alt="" className="w-7 h-7 rounded-lg object-cover border border-[#2F2F3D] shrink-0" />
                            ) : (
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected ? 'bg-[#E53935] text-white' : 'bg-[#252533] text-gray-300'
                              }`}>
                                {guild.guildName.slice(0, 1)}
                              </div>
                            )}
                            <div className="truncate">
                              <div className={`text-xs font-bold truncate ${isSelected ? 'text-[#E53935]' : 'text-gray-200'}`}>
                                {guild.guildName}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                ID: {guild.guildId.slice(0, 8)}...
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-[#E53935] shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* All Servers and Add Bot actions */}
                <div className="p-2 border-t border-[#252532] mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenServerSelector();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#22222C] hover:bg-[#2C2C3A] text-gray-300 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    <span>إدارة جميع السيرفرات (My Servers)</span>
                  </button>

                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1542313642060419213&permissions=8&scope=bot%20applications.commands"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#E53935]/10 hover:bg-[#E53935]/20 text-[#E53935] py-2 rounded-xl text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة OneBot لسيرفر آخر</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={onSaveCurrentSettings}
            disabled={!hasUnsavedChanges}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              hasUnsavedChanges 
                ? 'bg-[#E53935] hover:bg-[#D32F2F] text-white shadow-[#E53935]/30 cursor-pointer animate-pulse'
                : 'bg-[#202028] text-gray-400 border border-[#2B2B38] cursor-default'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">{hasUnsavedChanges ? 'حفظ التغييرات' : 'الإعدادات محفوظة'}</span>
          </button>

          {/* Authenticated User Profile */}
          {user && (
            <div className="flex items-center gap-2.5 bg-[#181820] border border-[#272733] px-3 py-1.5 rounded-xl">
              <img 
                src={userAvatar} 
                alt={user.username} 
                className="w-7 h-7 rounded-full object-cover border border-[#3A3A4A]" 
              />
              <span className="text-xs font-bold text-white hidden md:block max-w-[100px] truncate">
                {user.global_name || user.username}
              </span>
              <button
                onClick={onLogout}
                className="text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
