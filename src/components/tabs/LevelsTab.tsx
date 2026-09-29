import React, { useState } from 'react';
import { GuildSettings } from '../../types/guild';
import { TrendingUp, Plus, Trash2, Award } from 'lucide-react';

interface LevelsTabProps {
  settings: GuildSettings;
  onUpdate: (updated: Partial<GuildSettings>) => void;
}

export const LevelsTab: React.FC<LevelsTabProps> = ({ settings, onUpdate }) => {
  const l = settings.levels;
  const [newRewardLevel, setNewRewardLevel] = useState(5);
  const [newRewardRoleId, setNewRewardRoleId] = useState('');

  const updateLevels = (key: keyof typeof l, val: any) => {
    onUpdate({
      levels: {
        ...l,
        [key]: val
      }
    });
  };

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardRoleId.trim()) return;

    updateLevels('roleRewards', [
      ...l.roleRewards,
      { level: Number(newRewardLevel), roleId: newRewardRoleId.trim() }
    ]);

    setNewRewardRoleId('');
  };

  const handleRemoveReward = (index: number) => {
    updateLevels('roleRewards', l.roleRewards.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#14141A] border border-[#262635] rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">المستويات ونقاط التفاعل (Levels & XP)</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              تحفيز تفاعل الأعضاء في سيرفر {settings.guildName} بمكافآت ورتب عند ارتقاء المستوى.
            </p>
          </div>
        </div>

        <button
          onClick={() => updateLevels('enabled', !l.enabled)}
          className={`w-12 h-6.5 rounded-full transition-colors relative ${l.enabled ? 'bg-[#E53935]' : 'bg-[#2A2A38]'}`}
        >
          <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform absolute top-1 ${l.enabled ? 'left-1' : 'right-1'}`} />
        </button>
      </div>

      {/* Main Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
          <label className="block text-xs font-semibold text-gray-300">روم إعلانات الترقية (Level-up Channel)</label>
          <select
            value={l.levelUpChannelId}
            onChange={(e) => updateLevels('levelUpChannelId', e.target.value)}
            className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
          >
            <option value="current">في نفس الروم الحالي الذي كتب فيه العضو</option>
            <option value="dm">في الرسائل الخاصة (DM)</option>
            <option value="custom">روم مخصص محدد</option>
          </select>
        </div>

        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
          <label className="block text-xs font-semibold text-gray-300">مضاعف نقاط الخبرة (XP Multiplier)</label>
          <select
            value={l.xpRate}
            onChange={(e) => updateLevels('xpRate', parseFloat(e.target.value))}
            className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
          >
            <option value="1">1.0x (العادي)</option>
            <option value="1.5">1.5x (متوسط)</option>
            <option value="2">2.0x (مضاعف سريع)</option>
            <option value="3">3.0x (فعاليات خاصة)</option>
          </select>
        </div>

        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3 md:col-span-2">
          <label className="block text-xs font-semibold text-gray-300">رسالة التهنئة بالترقية</label>
          <input
            type="text"
            value={l.levelUpMessage}
            onChange={(e) => updateLevels('levelUpMessage', e.target.value)}
            className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
          />
        </div>

      </div>

      {/* Role Rewards List */}
      <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="font-bold text-white text-sm">مكافآت الرتب التلقائية لكل مستوى (Role Rewards)</h3>
          <p className="text-xs text-gray-400">تُعطى الرتبة للأعضاء فور وصولهم للمستوى المحدد</p>
        </div>

        <form onSubmit={handleAddReward} className="flex flex-col sm:flex-row gap-2 bg-[#1A1A24] p-3 rounded-xl border border-[#29293B]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">المستوى:</span>
            <input
              type="number"
              min="1"
              max="100"
              value={newRewardLevel}
              onChange={(e) => setNewRewardLevel(parseInt(e.target.value) || 1)}
              className="w-20 bg-[#121217] border border-[#2C2C3C] rounded-lg px-2.5 py-1.5 text-xs text-center text-white"
            />
          </div>

          <input
            type="text"
            placeholder="معرف الرتبة (Role ID)"
            value={newRewardRoleId}
            onChange={(e) => setNewRewardRoleId(e.target.value)}
            className="flex-1 bg-[#121217] border border-[#2C2C3C] rounded-lg px-3 py-1.5 text-xs text-white"
            required
          />

          <button
            type="submit"
            className="bg-[#E53935] hover:bg-[#D32F2F] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة رتبة
          </button>
        </form>

        <div className="space-y-2">
          {l.roleRewards.map((reward, idx) => (
            <div key={idx} className="flex items-center justify-between bg-[#181822] border border-[#262635] px-3.5 py-2.5 rounded-xl text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#E53935]/20 text-[#E53935] flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white">مستوى {reward.level}</span>
                  <span className="text-gray-400 font-mono text-[11px] mr-2">Role ID: {reward.roleId || 'غير محدد'}</span>
                </div>
              </div>

              <button
                onClick={() => handleRemoveReward(idx)}
                className="text-gray-400 hover:text-red-400 p-1"
                title="حذف"
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
