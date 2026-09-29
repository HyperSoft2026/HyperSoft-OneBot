import React from 'react';
import { GuildSettings } from '../../types/guild';
import { BOT_CONFIG } from '../../config/botConfig';
import { Gavel, AlertTriangle, ShieldCheck, Scale, Lock, VolumeX } from 'lucide-react';

interface ModerationTabProps {
  settings: GuildSettings;
  onUpdate: (updated: Partial<GuildSettings>) => void;
}

export const ModerationTab: React.FC<ModerationTabProps> = ({ settings, onUpdate }) => {
  const m = settings.moderation;

  const updateMod = (key: keyof typeof m, val: any) => {
    onUpdate({
      moderation: {
        ...m,
        [key]: val
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#14141A] border border-[#262635] rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] flex items-center justify-center shrink-0">
          <Gavel className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">إعدادات الإشراف والمحكمة (Moderation & Court)</h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            تخصيص رتب الكتم والسجن والمحكمة ونظام التحذيرات التراكمي لسيرفر <span className="text-white font-semibold">{settings.guildName}</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Mute System */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <VolumeX className="w-4 h-4 text-[#E53935]" />
            <h3 className="font-bold text-white text-sm">نظام الكتم (Mute Role)</h3>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">رتبة الكتم (Mute Role ID)</label>
            <input
              type="text"
              placeholder="مثال: 123456789012345678"
              value={m.muteRoleId}
              onChange={(e) => updateMod('muteRoleId', e.target.value)}
              className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
            />
            <p className="text-[11px] text-gray-500 mt-1">يتم إعطاؤها تلقائياً عند تنفيذ أمر !mute في هذا السيرفر.</p>
          </div>
        </div>

        {/* Jail System */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#E53935]" />
            <h3 className="font-bold text-white text-sm">نظام السجن (Jail System)</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">رتبة السجن (Jail Role ID)</label>
              <input
                type="text"
                placeholder="أدخل ID رتبة السجن"
                value={m.jailRoleId}
                onChange={(e) => updateMod('jailRoleId', e.target.value)}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">روم السجن المخصص (Jail Room Channel ID)</label>
              <input
                type="text"
                placeholder="أدخل ID الروم المعزول"
                value={m.jailRoomId}
                onChange={(e) => updateMod('jailRoomId', e.target.value)}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Court Settings */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#E53935]" />
            <h3 className="font-bold text-white text-sm">هيئة المحكمة (Court System)</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">مسمى المحكمة</label>
              <input
                type="text"
                value={m.courtName}
                onChange={(e) => updateMod('courtName', e.target.value)}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">روم سجلات المحكمة (Court Log ID)</label>
              <input
                type="text"
                placeholder="أدخل ID الروم"
                value={m.courtLogChannelId}
                onChange={(e) => updateMod('courtLogChannelId', e.target.value)}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">شعار المحكمة (رابط أو مسار الشعار)</label>
              <input
                type="text"
                value={m.courtLogo || BOT_CONFIG.logoUrl}
                onChange={(e) => updateMod('courtLogo', e.target.value)}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white font-mono"
              />
              <p className="text-[11px] text-gray-500 mt-1">افتراضياً يستخدم شعار البوت الرسمي /icon/Logo.png</p>
            </div>
          </div>
        </div>

        {/* Warning System */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E53935]" />
            <h3 className="font-bold text-white text-sm">نظام التحذيرات التراكمي (Warnings)</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">أقصى عدد تحذيرات قبل العقوبة التلقائية</label>
              <input
                type="number"
                min="1"
                max="10"
                value={m.maxWarningsBeforeAction}
                onChange={(e) => updateMod('maxWarningsBeforeAction', parseInt(e.target.value) || 3)}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">العقوبة التلقائية عند بلوغ الحد</label>
              <select
                value={m.warnAction}
                onChange={(e) => updateMod('warnAction', e.target.value)}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
              >
                <option value="mute">كتم مؤقت (Mute)</option>
                <option value="jail">سجن مؤقت (Jail)</option>
                <option value="kick">طرد من السيرفر (Kick)</option>
                <option value="ban">حظر نهائي (Ban)</option>
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
