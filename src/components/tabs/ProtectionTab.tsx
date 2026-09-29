import React, { useState } from 'react';
import { GuildSettings } from '../../types/guild';
import { BOT_CONFIG } from '../../config/botConfig';
import { 
  ShieldAlert, 
  UserMinus, 
  Bot, 
  Hash, 
  UserCheck, 
  Webhook, 
  Check, 
  Trash2, 
  Plus, 
  Info 
} from 'lucide-react';

interface ProtectionTabProps {
  settings: GuildSettings;
  onUpdate: (updated: Partial<GuildSettings>) => void;
}

export const ProtectionTab: React.FC<ProtectionTabProps> = ({ settings, onUpdate }) => {
  const [newWhitelistId, setNewWhitelistId] = useState('');
  const p = settings.protection;

  const updateProtection = (key: keyof typeof p, val: any) => {
    onUpdate({
      protection: {
        ...p,
        [key]: val
      }
    });
  };

  const handleAddWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhitelistId.trim()) return;
    if (!p.whitelistUsers.includes(newWhitelistId.trim())) {
      updateProtection('whitelistUsers', [...p.whitelistUsers, newWhitelistId.trim()]);
    }
    setNewWhitelistId('');
  };

  const handleRemoveWhitelist = (id: string) => {
    updateProtection('whitelistUsers', p.whitelistUsers.filter(u => u !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#14141A] border border-[#262635] rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">إعدادات الحماية وردع التخريب (Anti-Raid)</h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            أنظمة الحماية الذكية تحمي هذا السيرفر (<span className="text-white font-semibold">{settings.guildName}</span>) فقط عبر حد السجلات المسموح بها لكل مشرف. البيانات معزولة ولا تؤثر على السيرفرات الأخرى.
          </p>
        </div>
      </div>

      {/* Grid of Protection Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Anti-Ban Module */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <UserMinus className="w-4 h-4 text-[#E53935]" />
              <span className="text-sm font-bold text-white">مكافحة الحظر الجماعي (Anti-Ban)</span>
            </div>
            <button
              onClick={() => updateProtection('antiBan', { ...p.antiBan, enabled: !p.antiBan.enabled })}
              className={`w-11 h-6 rounded-full transition-colors relative ${p.antiBan.enabled ? 'bg-[#E53935]' : 'bg-[#2A2A38]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${p.antiBan.enabled ? 'left-1' : 'right-1'}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">الحد المسموح (خلال دقيقة)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={p.antiBan.limit}
                onChange={(e) => updateProtection('antiBan', { ...p.antiBan, limit: parseInt(e.target.value) || 1 })}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">الإجراء المتخذ ضد المخالف</label>
              <select
                value={p.antiBan.action}
                onChange={(e) => updateProtection('antiBan', { ...p.antiBan, action: e.target.value })}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="ban">حظر (Ban)</option>
                <option value="kick">طرد (Kick)</option>
                <option value="remove_roles">سحب رتب (Remove Roles)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Anti-Kick Module */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <UserMinus className="w-4 h-4 text-[#E53935]" />
              <span className="text-sm font-bold text-white">مكافحة الطرد الجماعي (Anti-Kick)</span>
            </div>
            <button
              onClick={() => updateProtection('antiKick', { ...p.antiKick, enabled: !p.antiKick.enabled })}
              className={`w-11 h-6 rounded-full transition-colors relative ${p.antiKick.enabled ? 'bg-[#E53935]' : 'bg-[#2A2A38]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${p.antiKick.enabled ? 'left-1' : 'right-1'}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">الحد المسموح (خلال دقيقة)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={p.antiKick.limit}
                onChange={(e) => updateProtection('antiKick', { ...p.antiKick, limit: parseInt(e.target.value) || 1 })}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">الإجراء المتخذ ضد المخالف</label>
              <select
                value={p.antiKick.action}
                onChange={(e) => updateProtection('antiKick', { ...p.antiKick, action: e.target.value })}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="ban">حظر (Ban)</option>
                <option value="kick">طرد (Kick)</option>
                <option value="remove_roles">سحب رتب</option>
              </select>
            </div>
          </div>
        </div>

        {/* Anti-Bots Module */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4 text-[#E53935]" />
              <span className="text-sm font-bold text-white">مكافحة البوتات غير الموثقة (Anti-Bots)</span>
            </div>
            <button
              onClick={() => updateProtection('antiBots', { ...p.antiBots, enabled: !p.antiBots.enabled })}
              className={`w-11 h-6 rounded-full transition-colors relative ${p.antiBots.enabled ? 'bg-[#E53935]' : 'bg-[#2A2A38]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${p.antiBots.enabled ? 'left-1' : 'right-1'}`} />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            طرد فوري لأي بوت تتم إضافته بواسطة شخص غير موجود في القائمة البيضاء.
          </p>
          <div>
            <select
              value={p.antiBots.action}
              onChange={(e) => updateProtection('antiBots', { ...p.antiBots, action: e.target.value })}
              className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-1.5 text-xs text-white"
            >
              <option value="kick">طرد البوت فوراً</option>
              <option value="ban">حظر البوت وطرد من أضافه</option>
            </select>
          </div>
        </div>

        {/* Anti-Channels Module */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Hash className="w-4 h-4 text-[#E53935]" />
              <span className="text-sm font-bold text-white">حماية الرومات (إنشاء / حذف)</span>
            </div>
            <button
              onClick={() => {
                const newState = !p.antiChannelDelete.enabled;
                updateProtection('antiChannelDelete', { ...p.antiChannelDelete, enabled: newState });
                updateProtection('antiChannelCreate', { ...p.antiChannelCreate, enabled: newState });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${p.antiChannelDelete.enabled ? 'bg-[#E53935]' : 'bg-[#2A2A38]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${p.antiChannelDelete.enabled ? 'left-1' : 'right-1'}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">حد حذف الرومات</label>
              <input
                type="number"
                min="1"
                max="10"
                value={p.antiChannelDelete.limit}
                onChange={(e) => updateProtection('antiChannelDelete', { ...p.antiChannelDelete, limit: parseInt(e.target.value) || 1 })}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">حد إنشاء الرومات</label>
              <input
                type="number"
                min="1"
                max="10"
                value={p.antiChannelCreate.limit}
                onChange={(e) => updateProtection('antiChannelCreate', { ...p.antiChannelCreate, limit: parseInt(e.target.value) || 1 })}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Anti-Webhooks Module */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Webhook className="w-4 h-4 text-[#E53935]" />
              <span className="text-sm font-bold text-white">مكافحة الويبهوك (Anti-Webhooks)</span>
            </div>
            <button
              onClick={() => updateProtection('antiWebhooks', { ...p.antiWebhooks, enabled: !p.antiWebhooks.enabled })}
              className={`w-11 h-6 rounded-full transition-colors relative ${p.antiWebhooks.enabled ? 'bg-[#E53935]' : 'bg-[#2A2A38]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${p.antiWebhooks.enabled ? 'left-1' : 'right-1'}`} />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            حذف أي Webhook يتم إنشاؤه بدون إذن وتجريد العضو المنشئ من الصلاحيات.
          </p>
        </div>

        {/* Action Log Channel & Custom Color */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-[#E53935]" />
            <span className="text-sm font-bold text-white">سجل الحماية واللون المميز</span>
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1">روم سجلات الحماية (Log Channel ID)</label>
            <input
              type="text"
              placeholder="مثال: 123456789012345678"
              value={p.logChannelId}
              onChange={(e) => updateProtection('logChannelId', e.target.value)}
              className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1">لون تحذيرات الحماية (Color)</label>
            <div className="flex items-center gap-2">
              <div 
                className="w-7 h-7 rounded-lg border border-white/20 shadow-sm"
                style={{ backgroundColor: p.actionColor || BOT_CONFIG.colors.primary }}
              />
              <input
                type="text"
                value={p.actionColor || BOT_CONFIG.colors.primary}
                onChange={(e) => updateProtection('actionColor', e.target.value)}
                className="flex-1 bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Whitelist Management */}
      <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <UserCheck className="w-5 h-5 text-[#E53935]" />
          <h3 className="font-bold text-white text-sm">القائمة البيضاء لسيرفر {settings.guildName} (Whitelist)</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          الأعضاء المدرجون هنا يتم استثناؤهم تماماً من جميع قيود الحماية وردع التخريب في هذا السيرفر فقط.
        </p>

        <form onSubmit={handleAddWhitelist} className="flex gap-2 max-w-md mb-4">
          <input
            type="text"
            placeholder="أدخل Discord User ID"
            value={newWhitelistId}
            onChange={(e) => setNewWhitelistId(e.target.value)}
            className="flex-1 bg-[#1C1C24] border border-[#2B2B38] focus:border-[#E53935] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
          />
          <button
            type="submit"
            className="bg-[#E53935] hover:bg-[#D32F2F] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة
          </button>
        </form>

        <div className="space-y-2">
          {p.whitelistUsers.length === 0 ? (
            <div className="text-xs text-gray-500 py-3 text-center border border-dashed border-[#262635] rounded-xl">
              لا يوجد أعضاء في القائمة البيضاء حالياً (فقط مالك السيرفر مستثنى تلقائياً).
            </div>
          ) : (
            p.whitelistUsers.map((userId) => (
              <div
                key={userId}
                className="flex items-center justify-between bg-[#1A1A24] border border-[#282838] px-3.5 py-2 rounded-xl text-xs text-gray-200"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono text-gray-300">{userId}</span>
                </div>
                <button
                  onClick={() => handleRemoveWhitelist(userId)}
                  className="text-gray-400 hover:text-red-400 p-1 transition-colors"
                  title="حذف من القائمة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
