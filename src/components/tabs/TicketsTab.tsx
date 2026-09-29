import React, { useState } from 'react';
import { GuildSettings, GuildTicketCategory } from '../../types/guild';
import { BOT_CONFIG } from '../../config/botConfig';
import { Ticket, Plus, Trash2, Hash, Shield } from 'lucide-react';

interface TicketsTabProps {
  settings: GuildSettings;
  onUpdate: (updated: Partial<GuildSettings>) => void;
}

export const TicketsTab: React.FC<TicketsTabProps> = ({ settings, onUpdate }) => {
  const t = settings.tickets;
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📩');

  const updateTicket = (key: keyof typeof t, val: any) => {
    onUpdate({
      tickets: {
        ...t,
        [key]: val
      }
    });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory: GuildTicketCategory = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      emoji: newCatEmoji.trim() || '📩',
      staffRoleId: "",
      channelCategoryId: "",
      welcomeMessage: "أهلاً بك، سيتواصل معك فريق الإدارة قريباً."
    };

    updateTicket('categories', [...t.categories, newCategory]);
    setNewCatName('');
    setNewCatEmoji('📩');
  };

  const handleRemoveCategory = (id: string) => {
    updateTicket('categories', t.categories.filter(c => c.id !== id));
  };

  const handleUpdateCategory = (id: string, field: keyof GuildTicketCategory, value: string) => {
    updateTicket(
      'categories',
      t.categories.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#14141A] border border-[#262635] rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">نظام التذاكر المتقدم (Ticket System)</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              إدارة تذاكر الدعم والشكاوى بأزرار تفاعلية مخصصة لسيرفر {settings.guildName}.
            </p>
          </div>
        </div>

        <button
          onClick={() => updateTicket('enabled', !t.enabled)}
          className={`w-12 h-6.5 rounded-full transition-colors relative ${t.enabled ? 'bg-[#E53935]' : 'bg-[#2A2A38]'}`}
        >
          <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform absolute top-1 ${t.enabled ? 'left-1' : 'right-1'}`} />
        </button>
      </div>

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-4.5 space-y-2">
          <label className="block text-xs font-semibold text-gray-300">روم بنل التذاكر (Panel Channel ID)</label>
          <input
            type="text"
            placeholder="مثال: 123456789012345678"
            value={t.panelChannelId}
            onChange={(e) => updateTicket('panelChannelId', e.target.value)}
            className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-4.5 space-y-2">
          <label className="block text-xs font-semibold text-gray-300">روم نسخ المحادثات (Transcript Channel ID)</label>
          <input
            type="text"
            placeholder="مثال: 123456789012345678"
            value={t.transcriptChannelId}
            onChange={(e) => updateTicket('transcriptChannelId', e.target.value)}
            className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-4.5 space-y-2">
          <label className="block text-xs font-semibold text-gray-300">أقصى تذاكر مفتوحة للمستخدم</label>
          <input
            type="number"
            min="1"
            max="5"
            value={t.maxOpenTicketsPerUser}
            onChange={(e) => updateTicket('maxOpenTicketsPerUser', parseInt(e.target.value) || 1)}
            className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      {/* Ticket Categories List */}
      <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">أقسام التذاكر المتاحة</h3>
            <p className="text-xs text-gray-400">تظهر هذه الأقسام في الرسالة التفاعلية داخل روم البنل</p>
          </div>
        </div>

        {/* Add new Category inline */}
        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2 bg-[#1A1A24] p-3 rounded-xl border border-[#282838]">
          <input
            type="text"
            placeholder="أيقونة (إيموجي)"
            value={newCatEmoji}
            onChange={(e) => setNewCatEmoji(e.target.value)}
            className="w-full sm:w-24 bg-[#14141A] border border-[#2C2C3A] rounded-lg px-2.5 py-1.5 text-xs text-center text-white"
          />
          <input
            type="text"
            placeholder="اسم القسم الجديد (مثال: الشكاوى والاقتراحات)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-[#14141A] border border-[#2C2C3A] rounded-lg px-3 py-1.5 text-xs text-white"
          />
          <button
            type="submit"
            className="bg-[#E53935] hover:bg-[#D32F2F] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة قسم
          </button>
        </form>

        {/* Categories cards */}
        <div className="space-y-3 pt-2">
          {t.categories.map((cat) => (
            <div key={cat.id} className="bg-[#181822] border border-[#282838] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#242434] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="font-bold text-sm text-white">{cat.name}</span>
                </div>
                <button
                  onClick={() => handleRemoveCategory(cat.id)}
                  className="text-gray-400 hover:text-red-400 p-1"
                  title="حذف القسم"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#E53935]" />
                    رتبة المشرفين المسؤولة (Staff Role ID)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 123456789012345678"
                    value={cat.staffRoleId}
                    onChange={(e) => handleUpdateCategory(cat.id, 'staffRoleId', e.target.value)}
                    className="w-full bg-[#121217] border border-[#2A2A38] rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-[#E53935]" />
                    تصنيف الرومات (Category ID)
                  </label>
                  <input
                    type="text"
                    placeholder="Category ID لفتح تذاكر القسم داخله"
                    value={cat.channelCategoryId}
                    onChange={(e) => handleUpdateCategory(cat.id, 'channelCategoryId', e.target.value)}
                    className="w-full bg-[#121217] border border-[#2A2A38] rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">رسالة الترحيب الأولى داخل التذكرة</label>
                <input
                  type="text"
                  value={cat.welcomeMessage}
                  onChange={(e) => handleUpdateCategory(cat.id, 'welcomeMessage', e.target.value)}
                  className="w-full bg-[#121217] border border-[#2A2A38] rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
