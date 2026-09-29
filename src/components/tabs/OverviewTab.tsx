import React from 'react';
import { GuildSettings } from '../../types/guild';
import { BOT_CONFIG } from '../../config/botConfig';
import { 
  ShieldCheck, 
  Users, 
  Bot, 
  Ticket, 
  Terminal, 
  Zap, 
  Cpu, 
  Activity,
  Layers
} from 'lucide-react';

interface OverviewTabProps {
  settings: GuildSettings;
  onUpdate: (updated: Partial<GuildSettings>) => void;
  onSwitchTab: (tab: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ settings, onSwitchTab }) => {
  const activeProtectionsCount = [
    settings.protection.antiBan.enabled,
    settings.protection.antiKick.enabled,
    settings.protection.antiBots.enabled,
    settings.protection.antiChannelCreate.enabled,
    settings.protection.antiRoleCreate.enabled,
    settings.protection.antiWebhooks.enabled
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Hero Server Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#171720] via-[#14141A] to-[#121217] border border-[#272733] rounded-3xl p-6 lg:p-8 shadow-xl">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#E53935]/10 rounded-full blur-3xl pointer-events-none -translate-x-12 -translate-y-12" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#7f1315] p-[2px] shadow-lg shadow-[#E53935]/30">
              <div className="w-full h-full rounded-[14px] bg-[#14141A] flex items-center justify-center font-extrabold text-2xl text-white">
                {settings.guildName.slice(0, 1)}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">{settings.guildName}</h2>
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  نشط ومحمي
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-1">
                معرف السيرفر (Guild ID): <span className="text-[#E53935] font-bold">{settings.guildId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#1C1C24] border border-[#2D2D3D] rounded-2xl px-4 py-2.5 text-center">
              <div className="text-[10px] text-gray-400 font-semibold">بادئة الأوامر (Prefix)</div>
              <div className="text-base font-black text-[#E53935] font-mono">{settings.prefix}</div>
            </div>

            <div className="bg-[#1C1C24] border border-[#2D2D3D] rounded-2xl px-4 py-2.5 text-center">
              <div className="text-[10px] text-gray-400 font-semibold">الأعضاء المقدرون</div>
              <div className="text-base font-black text-white">{settings.memberCount.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131318] border border-[#22222E] rounded-2xl p-4.5 transition-all hover:border-[#E53935]/40 group">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold">أنظمة الحماية النشطة</span>
            <div className="w-8 h-8 rounded-lg bg-[#E53935]/15 flex items-center justify-center text-[#E53935] group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{activeProtectionsCount} / 6</div>
          <p className="text-[11px] text-gray-500 mt-1">حماية ضد البوتات والحذف الجماعي</p>
        </div>

        <div className="bg-[#131318] border border-[#22222E] rounded-2xl p-4.5 transition-all hover:border-[#E53935]/40 group">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold">قواعد المجيب التلقائي</span>
            <div className="w-8 h-8 rounded-lg bg-[#E53935]/15 flex items-center justify-center text-[#E53935] group-hover:scale-110 transition-transform">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{settings.autoResponder.length}</div>
          <p className="text-[11px] text-gray-500 mt-1">ردود مخصصة لكلمات معينة</p>
        </div>

        <div className="bg-[#131318] border border-[#22222E] rounded-2xl p-4.5 transition-all hover:border-[#E53935]/40 group">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold">أقسام التذاكر المتاحة</span>
            <div className="w-8 h-8 rounded-lg bg-[#E53935]/15 flex items-center justify-center text-[#E53935] group-hover:scale-110 transition-transform">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{settings.tickets.categories.length}</div>
          <p className="text-[11px] text-gray-500 mt-1">{settings.tickets.enabled ? 'النظام مفعّل' : 'معطّل'}</p>
        </div>

        <div className="bg-[#131318] border border-[#22222E] rounded-2xl p-4.5 transition-all hover:border-[#E53935]/40 group">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold">عزل السيرفرات (Isolation)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">100%</div>
          <p className="text-[11px] text-gray-500 mt-1">لا تداخل بين السيرفرات</p>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Anti-Raid Card */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#E53935]/15 text-[#E53935] flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">نظام مكافحة التخريب (Anti-Raid & Protection)</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              يراقب محاولات الطرد والحظر الجماعي وتعديل الرتب والقنوات، مع اتخاذ إجراءات فورية بحظر أو سحب رتب المخالفين وتنبيه الإدارة.
            </p>
          </div>
          <button 
            onClick={() => onSwitchTab('protection')}
            className="mt-4 w-full bg-[#1C1C26] hover:bg-[#E53935] text-gray-200 hover:text-white py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            تخصيص حدود الحماية
          </button>
        </div>

        {/* Discord Embeds Card */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#E53935]/15 text-[#E53935] flex items-center justify-center">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">صانع الرسائل المضمّنة (Discord Embed Builder)</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              إنشاء رسائل فخمة ومضمّنة بهوية OneBot باللون الأساسي <span className="text-[#E53935] font-mono font-bold">#E53935</span> مع معاينة فورية لما سيظهر داخل ديسكورد.
            </p>
          </div>
          <button 
            onClick={() => onSwitchTab('embeds')}
            className="mt-4 w-full bg-[#1C1C26] hover:bg-[#E53935] text-gray-200 hover:text-white py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            فتح محاكي الرسائل
          </button>
        </div>

      </div>

      {/* Bot Engine Status banner */}
      <div className="bg-[#111116] border border-[#22222E] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-200">{BOT_CONFIG.displayName}</span>
            <span>- محرك الـ Multi-Guild يعمل بشكل سليم ومستقل لكل سيرفر</span>
          </div>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px] text-gray-500">
          <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> Node v22</span>
          <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> استجابة 18ms</span>
        </div>
      </div>
    </div>
  );
};
