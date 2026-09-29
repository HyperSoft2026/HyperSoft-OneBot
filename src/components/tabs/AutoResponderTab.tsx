import React, { useState } from 'react';
import { GuildSettings, AutoResponderTrigger } from '../../types/guild';
import { Bot, Plus, Trash2, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';

interface AutoResponderTabProps {
  settings: GuildSettings;
  onUpdate: (updated: Partial<GuildSettings>) => void;
}

export const AutoResponderTab: React.FC<AutoResponderTabProps> = ({ settings, onUpdate }) => {
  const [triggerWord, setTriggerWord] = useState('');
  const [responseMsg, setResponseMsg] = useState('');
  const [matchType, setMatchType] = useState<'exact' | 'contains' | 'startsWith'>('contains');
  const [embedResponse, setEmbedResponse] = useState(false);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerWord.trim() || !responseMsg.trim()) return;

    const newRule: AutoResponderTrigger = {
      id: `rule_${Date.now()}`,
      trigger: triggerWord.trim(),
      response: responseMsg.trim(),
      matchType,
      enabled: true,
      replyInDm: false,
      embedResponse
    };

    onUpdate({
      autoResponder: [...settings.autoResponder, newRule]
    });

    setTriggerWord('');
    setResponseMsg('');
    setEmbedResponse(false);
  };

  const handleRemoveRule = (id: string) => {
    onUpdate({
      autoResponder: settings.autoResponder.filter(r => r.id !== id)
    });
  };

  const handleToggleRule = (id: string) => {
    onUpdate({
      autoResponder: settings.autoResponder.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#14141A] border border-[#262635] rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">المجيب التلقائي (Auto-Responder)</h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            الرد التلقائي على الكلمات المفتاحية في الشات لسيرفر <span className="text-white font-semibold">{settings.guildName}</span> برسائل عادية أو مدمجة في Embed مميز بهوية OneBot.
          </p>
        </div>
      </div>

      {/* Add New Rule Form */}
      <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">إضافة رد تلقائي جديد</h3>
        <form onSubmit={handleAddRule} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">الكلمة أو الجملة المفتاحية (Trigger)</label>
              <input
                type="text"
                placeholder="مثال: ديسكورد الدعم، الشروط"
                value={triggerWord}
                onChange={(e) => setTriggerWord(e.target.value)}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">نوع المطابقة</label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as any)}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
              >
                <option value="contains">تحتوي على الكلمة (Contains)</option>
                <option value="exact">مطابقة تامة (Exact)</option>
                <option value="startsWith">تبدأ بالكلمة (Starts With)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">رد البوت (Response Message)</label>
            <textarea
              rows={2}
              placeholder="اكتب نص الرد الذي سيرسله البوت..."
              value={responseMsg}
              onChange={(e) => setResponseMsg(e.target.value)}
              className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={embedResponse}
                onChange={(e) => setEmbedResponse(e.target.checked)}
                className="rounded accent-[#E53935]"
              />
              <span>إرسال الرد كـ Embed بلون OneBot الأحمر (#E53935)</span>
            </label>

            <button
              type="submit"
              className="bg-[#E53935] hover:bg-[#D32F2F] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-[#E53935]/25"
            >
              <Plus className="w-3.5 h-3.5" />
              حفظ الرد
            </button>
          </div>
        </form>
      </div>

      {/* List of active rules */}
      <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white mb-2">قواعد الردود المحفوظة ({settings.autoResponder.length})</h3>

        {settings.autoResponder.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-[#242432] rounded-xl">
            لا توجد ردود تلقائية مضافة لهذا السيرفر بعد.
          </div>
        ) : (
          <div className="space-y-2.5">
            {settings.autoResponder.map((rule) => (
              <div 
                key={rule.id}
                className="bg-[#191924] border border-[#29293B] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{rule.trigger}</span>
                    <span className="text-[10px] bg-[#222230] text-gray-400 px-2 py-0.5 rounded-full font-mono">
                      {rule.matchType}
                    </span>
                    {rule.embedResponse && (
                      <span className="text-[10px] bg-[#E53935]/15 text-[#E53935] px-2 py-0.5 rounded-full font-semibold">
                        Embed Red
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3 text-[#E53935] shrink-0" />
                    <span>{rule.response}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                    title={rule.enabled ? 'تعطيل' : 'تفعيل'}
                  >
                    {rule.enabled ? (
                      <ToggleRight className="w-6 h-6 text-[#E53935]" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-500" />
                    )}
                  </button>

                  <button
                    onClick={() => handleRemoveRule(rule.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-[#20202E]"
                    title="حذف الرد"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
