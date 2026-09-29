import React, { useState } from 'react';
import { GuildSettings } from '../../types/guild';
import { UserCheck, Bot, Clock, Plus, Trash2 } from 'lucide-react';

interface RolesTabProps {
  settings: GuildSettings;
  onUpdate: (updated: Partial<GuildSettings>) => void;
}

export const RolesTab: React.FC<RolesTabProps> = ({ settings, onUpdate }) => {
  const r = settings.roles;
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetRoleIds, setNewPresetRoleIds] = useState('');

  const updateRoles = (key: keyof typeof r, val: any) => {
    onUpdate({
      roles: {
        ...r,
        [key]: val
      }
    });
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const ids = newPresetRoleIds
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newPreset = {
      id: `preset_${Date.now()}`,
      name: newPresetName.trim(),
      roleIds: ids
    };

    updateRoles('multipleRolePresets', [...r.multipleRolePresets, newPreset]);
    setNewPresetName('');
    setNewPresetRoleIds('');
  };

  const handleRemovePreset = (id: string) => {
    updateRoles(
      'multipleRolePresets',
      r.multipleRolePresets.filter(p => p.id !== id)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#14141A] border border-[#262635] rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] flex items-center justify-center shrink-0">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">الرتب التلقائية والأتمتة (Roles & Automation)</h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            إعطاء الرتب تلقائياً للأعضاء والبوتات فور انضمامهم لسيرفر {settings.guildName} مع دعم الرتب المتعددة والرتب المؤقتة.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Human Auto-Role */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#E53935]" />
            <h3 className="font-bold text-white text-sm">رتبة الأعضاء التلقائية (Human Auto-Role)</h3>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">رتبة العضو الجديد (Role ID)</label>
            <input
              type="text"
              placeholder="مثال: 123456789012345678"
              value={r.autoRoleHumanId}
              onChange={(e) => updateRoles('autoRoleHumanId', e.target.value)}
              className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
            />
            <p className="text-[11px] text-gray-500 mt-1">تُعطى تلقائياً لأي شخص ينضم للسيرفر.</p>
          </div>
        </div>

        {/* Bot Auto-Role */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#E53935]" />
            <h3 className="font-bold text-white text-sm">رتبة البوتات التلقائية (Bot Auto-Role)</h3>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">رتبة البوت الجديد (Role ID)</label>
            <input
              type="text"
              placeholder="مثال: 123456789012345678"
              value={r.autoRoleBotId}
              onChange={(e) => updateRoles('autoRoleBotId', e.target.value)}
              className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
            />
            <p className="text-[11px] text-gray-500 mt-1">تُعطى تلقائياً لأي بوت مصرح له بالدخول.</p>
          </div>
        </div>

        {/* Temp-Role Support */}
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E53935]" />
              <div>
                <h3 className="font-bold text-white text-sm">نظام الرتب المؤقتة (Temp Roles)</h3>
                <p className="text-xs text-gray-400">السماح بتوزيع رتب بمدة زمنية محددة تسحب تلقائياً بعد انتهاء الوقت</p>
              </div>
            </div>

            <button
              onClick={() => updateRoles('tempRoleAllowed', !r.tempRoleAllowed)}
              className={`w-11 h-6 rounded-full transition-colors relative ${r.tempRoleAllowed ? 'bg-[#E53935]' : 'bg-[#2A2A38]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${r.tempRoleAllowed ? 'left-1' : 'right-1'}`} />
            </button>
          </div>
        </div>

      </div>

      {/* Multiple Roles Presets */}
      <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="font-bold text-white text-sm">حزم الرتب المتعددة (Multiple Roles Presets)</h3>
          <p className="text-xs text-gray-400">حزم تمكن المشرفين من إعطاء أو سحب عدة رتب بنقرة واحدة</p>
        </div>

        <form onSubmit={handleAddPreset} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#1A1A24] p-3 rounded-xl border border-[#29293B]">
          <input
            type="text"
            placeholder="اسم الحزمة (مثال: طاقم الفعاليات)"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            className="bg-[#121217] border border-[#2C2C3C] rounded-lg px-3 py-1.5 text-xs text-white"
            required
          />
          <input
            type="text"
            placeholder="معرفات الرتب مفصولة بفاصلة (,)"
            value={newPresetRoleIds}
            onChange={(e) => setNewPresetRoleIds(e.target.value)}
            className="bg-[#121217] border border-[#2C2C3C] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            required
          />
          <button
            type="submit"
            className="bg-[#E53935] hover:bg-[#D32F2F] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            حفظ الحزمة
          </button>
        </form>

        <div className="space-y-2">
          {r.multipleRolePresets.map((preset) => (
            <div key={preset.id} className="flex items-center justify-between bg-[#181822] border border-[#262635] px-3.5 py-2.5 rounded-xl text-xs">
              <div>
                <span className="font-bold text-white">{preset.name}</span>
                <span className="text-[11px] text-gray-400 mr-2">
                  ({preset.roleIds.length} رتب)
                </span>
                <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                  {preset.roleIds.join(', ') || 'لا توجد رتب محددة'}
                </div>
              </div>
              <button
                onClick={() => handleRemovePreset(preset.id)}
                className="text-gray-400 hover:text-red-400 p-1"
                title="حذف الحزمة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
