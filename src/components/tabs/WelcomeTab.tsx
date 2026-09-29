import React from 'react';
import { GuildSettings } from '../../types/guild';
import { BOT_CONFIG } from '../../config/botConfig';
import { Sparkles, UserPlus, UserMinus, Rocket, Eye } from 'lucide-react';

interface WelcomeTabProps {
  settings: GuildSettings;
  onUpdate: (updated: Partial<GuildSettings>) => void;
}

export const WelcomeTab: React.FC<WelcomeTabProps> = ({ settings, onUpdate }) => {
  const w = settings.welcome;

  const updateWelcome = (key: keyof typeof w, val: any) => {
    onUpdate({
      welcome: {
        ...w,
        [key]: val
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#14141A] border border-[#262635] rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">الترحيب والمغادرة والبوست (Welcome & Boosts)</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              رسائل وبطاقات ترحيبية ذكية لسيرفر {settings.guildName} مع تصميم أحمر داكن مطابق لهوية OneBot.
            </p>
          </div>
        </div>

        <button
          onClick={() => updateWelcome('enabled', !w.enabled)}
          className={`w-12 h-6.5 rounded-full transition-colors relative ${w.enabled ? 'bg-[#E53935]' : 'bg-[#2A2A38]'}`}
        >
          <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform absolute top-1 ${w.enabled ? 'left-1' : 'right-1'}`} />
        </button>
      </div>

      {/* Live Welcome Card Visual Preview */}
      <div className="bg-[#14141B] border border-[#262635] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[#E53935]" />
            معاينة بطاقة الترحيب التفاعلية (Welcome Image Card)
          </span>
          <span className="text-[11px] text-gray-500 font-mono">
            {w.showAvatarCard ? 'مفعّلة' : 'نص فقط'}
          </span>
        </div>

        {/* The Card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#E53935]/40 bg-gradient-to-br from-[#1A0E10] via-[#0E0E12] to-[#0A0A0C] p-6 text-center shadow-xl shadow-black/80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,57,53,0.18)_0,transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Avatar with red neon ring */}
            <div className="w-20 h-20 rounded-full bg-[#181820] border-2 border-[#E53935] p-1 shadow-lg shadow-[#E53935]/40 mb-3 relative">
              <img
                src={BOT_CONFIG.logoUrl}
                alt="Avatar Preview"
                className="w-full h-full object-cover rounded-full"
              />
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0A0A0C]" />
            </div>

            <div className="inline-block bg-[#E53935]/20 border border-[#E53935]/50 text-[#EF5350] text-[11px] font-bold px-3 py-0.5 rounded-full mb-1">
              مرحباً بك في السيرفر
            </div>

            <h3 className="text-xl font-black text-white tracking-wide">
              عضو جديد #4290
            </h3>

            <p className="text-xs text-gray-400 mt-1 max-w-md">
              أنت العضو رقم <span className="text-[#E53935] font-bold font-mono">{settings.memberCount + 1}</span> في سيرفر <span className="text-white font-bold">{settings.guildName}</span>
            </p>

            <div className="mt-4 pt-3 border-t border-white/10 w-full max-w-sm flex items-center justify-between text-[11px] text-gray-500 font-mono">
              <span>{BOT_CONFIG.name} by {BOT_CONFIG.developer}</span>
              <span className="text-[#E53935]">OneBot Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome & Leave Channels Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Welcome Section */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#E53935]" />
            <h3 className="font-bold text-white text-sm">رسالة الترحيب (Welcome)</h3>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">روم الترحيب (Welcome Channel ID)</label>
            <input
              type="text"
              placeholder="مثال: 123456789012345678"
              value={w.welcomeChannelId}
              onChange={(e) => updateWelcome('welcomeChannelId', e.target.value)}
              className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">نص رسالة الترحيب</label>
            <textarea
              rows={2}
              value={w.welcomeMessage}
              onChange={(e) => updateWelcome('welcomeMessage', e.target.value)}
              className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
            <p className="text-[10px] text-gray-500 mt-1">المتغيرات: {'{user}'} لمنشن العضو، {'{server}'} لاسم السيرفر.</p>
          </div>
        </div>

        {/* Leave Section */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <UserMinus className="w-4 h-4 text-[#E53935]" />
            <h3 className="font-bold text-white text-sm">رسالة المغادرة (Leave)</h3>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">روم المغادرة (Leave Channel ID)</label>
            <input
              type="text"
              placeholder="مثال: 123456789012345678"
              value={w.leaveChannelId}
              onChange={(e) => updateWelcome('leaveChannelId', e.target.value)}
              className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">نص رسالة المغادرة</label>
            <textarea
              rows={2}
              value={w.leaveMessage}
              onChange={(e) => updateWelcome('leaveMessage', e.target.value)}
              className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Server Boost Alert Section */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[#E53935]" />
            <h3 className="font-bold text-white text-sm">تنبيهات البوست (Server Boost Alerts)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">روم إعلانات البوست (Channel ID)</label>
              <input
                type="text"
                placeholder="أدخل ID روم شكر البوست"
                value={w.boostChannelId}
                onChange={(e) => updateWelcome('boostChannelId', e.target.value)}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">رتبة مميزة لداعمي البوست (Role ID)</label>
              <input
                type="text"
                placeholder="أدخل ID رتبة البوستر"
                value={w.boostRoleId}
                onChange={(e) => updateWelcome('boostRoleId', e.target.value)}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
