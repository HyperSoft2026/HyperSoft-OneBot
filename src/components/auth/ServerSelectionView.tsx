import React from 'react';
import { GuildSummary, DiscordUser } from '../../types/guild';
import { BOT_CONFIG } from '../../config/botConfig';
import { 
  Server, 
  Plus, 
  ExternalLink, 
  ShieldCheck, 
  LogOut, 
  RotateCw,
  Crown,
  Settings
} from 'lucide-react';

interface ServerSelectionViewProps {
  user: DiscordUser;
  guilds: GuildSummary[];
  onSelectGuild: (guildId: string) => void;
  onRefreshGuilds: () => void;
  onLogout: () => void;
  isRefreshing?: boolean;
}

export const ServerSelectionView: React.FC<ServerSelectionViewProps> = ({
  user,
  guilds,
  onSelectGuild,
  onRefreshGuilds,
  onLogout,
  isRefreshing = false
}) => {
  const activeGuilds = guilds.filter(g => g.botInstalled && g.canManage);
  const uninstalledGuilds = guilds.filter(g => !g.botInstalled && g.canManage);

  const getInviteUrl = (guildId: string) => {
    return `https://discord.com/oauth2/authorize?client_id=1542313642060419213&permissions=8&scope=bot%20applications.commands&guild_id=${guildId}&disable_guild_select=true`;
  };

  const userAvatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0', 10) % 5}.png`;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6] flex flex-col selection:bg-[#E53935] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0F0F13]/95 backdrop-blur-md border-b border-[#22222B] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E53935] to-[#800F11] p-[2px] shadow-lg shadow-[#E53935]/25">
              <img src={BOT_CONFIG.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-[10px] bg-black" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white">{BOT_CONFIG.name}</span>
              <span className="text-[10px] text-gray-400 block font-mono">سيرفراتي (My Servers)</span>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={onRefreshGuilds}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-[#181820] hover:bg-[#22222C] border border-[#2A2A38] text-gray-300 hover:text-white transition-all cursor-pointer"
              title="تحديث قائمة السيرفرات"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#E53935]' : ''}`} />
            </button>

            <div className="flex items-center gap-3 bg-[#181820] border border-[#262633] px-3.5 py-1.5 rounded-2xl">
              <img 
                src={userAvatar} 
                alt={user.username} 
                className="w-7 h-7 rounded-full object-cover border border-[#3A3A4A]" 
              />
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-white block leading-tight">{user.global_name || user.username}</span>
                <span className="text-[10px] font-mono text-gray-400">@{user.username}</span>
              </div>

              <button
                onClick={onLogout}
                className="mr-2 p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-10">
        
        {/* Active Servers Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#20202A] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-base sm:text-lg font-black text-white">السيرفرات المفعلة (Active Servers)</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                {activeGuilds.length}
              </span>
            </div>
            <span className="text-xs text-gray-400">OneBot مثبت وجاهز للإدارة</span>
          </div>

          {activeGuilds.length === 0 ? (
            <div className="bg-[#121216] border border-[#22222B] rounded-2xl p-8 text-center text-gray-400 space-y-2">
              <Server className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-sm font-bold text-gray-300">لم يتم العثور على سيرفرات مضاف فيها البوت حالياً.</p>
              <p className="text-xs text-gray-500">اختر أحد سيرفراتك من القائمة أدناه واضغط "إضافة OneBot".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGuilds.map((guild) => (
                <div 
                  key={guild.guildId}
                  className="bg-[#131318] hover:bg-[#181822] border border-[#22222E] hover:border-[#E53935]/50 rounded-2xl p-5 transition-all flex flex-col justify-between gap-4 group shadow-sm hover:shadow-xl hover:shadow-[#E53935]/5"
                >
                  <div className="flex items-start gap-3.5">
                    {guild.guildIcon ? (
                      <img 
                        src={guild.guildIcon} 
                        alt={guild.guildName} 
                        className="w-12 h-12 rounded-2xl object-cover border border-[#2F2F3D] shrink-0" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#22222B] to-[#16161D] border border-[#2F2F3D] flex items-center justify-center font-bold text-base text-gray-300 shrink-0">
                        {guild.guildName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="overflow-hidden text-right flex-1">
                      <h3 className="font-extrabold text-sm text-white truncate group-hover:text-[#E53935] transition-colors">
                        {guild.guildName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {guild.isOwner ? (
                          <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-bold">
                            <Crown className="w-3 h-3" /> مالك السيرفر
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded-md">
                            إدارة السيرفر
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectGuild(guild.guildId)}
                    className="w-full flex items-center justify-center gap-2 bg-[#E53935] hover:bg-[#D32F2F] active:scale-[0.99] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-[#E53935]/20 transition-all cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    <span>إدارة السيرفر (Dashboard)</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Add OneBot Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#20202A] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#5865F2]" />
              <h2 className="text-base sm:text-lg font-black text-white">إضافة OneBot إلى سيرفراتك (Add OneBot)</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/30 font-mono">
                {uninstalledGuilds.length}
              </span>
            </div>
            <span className="text-xs text-gray-400">سيرفرات تديرها لم يتم تثبيت البوت فيها بعد</span>
          </div>

          {uninstalledGuilds.length === 0 ? (
            <div className="bg-[#121216] border border-[#22222B] rounded-2xl p-6 text-center text-gray-400 text-xs">
              جميع السيرفرات التي تديرها مفعلة حالياً ومزودة بـ OneBot!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {uninstalledGuilds.map((guild) => (
                <div 
                  key={guild.guildId}
                  className="bg-[#121217] border border-[#202028] hover:border-[#5865F2]/50 rounded-2xl p-5 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    {guild.guildIcon ? (
                      <img 
                        src={guild.guildIcon} 
                        alt={guild.guildName} 
                        className="w-12 h-12 rounded-2xl object-cover border border-[#252530] shrink-0 opacity-80 group-hover:opacity-100" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[#1A1A22] border border-[#252530] flex items-center justify-center font-bold text-base text-gray-400 shrink-0">
                        {guild.guildName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="overflow-hidden text-right flex-1">
                      <h3 className="font-bold text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                        {guild.guildName}
                      </h3>
                      <span className="text-[10px] text-gray-500 font-mono block mt-1">
                        ID: {guild.guildId}
                      </span>
                    </div>
                  </div>

                  <a
                    href={getInviteUrl(guild.guildId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#20202C] hover:bg-[#5865F2] hover:text-white text-gray-300 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer border border-[#2A2A38] hover:border-transparent"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة OneBot</span>
                    <ExternalLink className="w-3 h-3 mr-auto opacity-70" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
};
