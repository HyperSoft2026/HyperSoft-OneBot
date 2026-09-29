import React, { useState } from 'react';
import { GuildSettings, GuildEmbedTemplate } from '../../types/guild';
import { BOT_CONFIG } from '../../config/botConfig';
import { FileText, Copy, Check, Plus, Trash2 } from 'lucide-react';

interface EmbedsTabProps {
  settings: GuildSettings;
  onUpdate: (updated: Partial<GuildSettings>) => void;
}

export const EmbedsTab: React.FC<EmbedsTabProps> = ({ settings, onUpdate }) => {
  const currentEmbed = settings.embeds[0] || {
    id: 'embed_default',
    title: `قوانين سيرفر ${settings.guildName}`,
    description: "مرحباً بجميع الأعضاء! يرجى الالتزام بالقواعد الآتية لضمان بيئة آمنة للجميع:",
    color: BOT_CONFIG.colors.primary,
    authorName: `إدارة ${settings.guildName}`,
    authorIcon: BOT_CONFIG.logoUrl,
    footerText: `OneBot by ${BOT_CONFIG.developer}`,
    footerIcon: BOT_CONFIG.logoUrl,
    timestamp: true,
    fields: [
      { name: "1. الاحترام المتبادل", value: "يمنع الشتم والإهانة بأي شكل.", inline: false },
      { name: "2. منع الإعلانات", value: "يمنع نشر روابط السيرفرات الأخرى بدون إذن.", inline: false }
    ]
  };

  const [copied, setCopied] = useState(false);

  const updateCurrentEmbed = (fields: Partial<GuildEmbedTemplate>) => {
    const updated = {
      ...currentEmbed,
      ...fields
    };
    onUpdate({
      embeds: [updated]
    });
  };

  const addField = () => {
    const newField = {
      name: `حقل جديد #${currentEmbed.fields.length + 1}`,
      value: "اكتب القيمة أو الشرح هنا...",
      inline: false
    };
    updateCurrentEmbed({
      fields: [...currentEmbed.fields, newField]
    });
  };

  const removeField = (index: number) => {
    updateCurrentEmbed({
      fields: currentEmbed.fields.filter((_, i) => i !== index)
    });
  };

  const updateField = (index: number, key: 'name' | 'value' | 'inline', val: any) => {
    const newFields = currentEmbed.fields.map((f, i) => i === index ? { ...f, [key]: val } : f);
    updateCurrentEmbed({ fields: newFields });
  };

  const handleCopyCode = () => {
    const djsCode = `const { EmbedBuilder } = require('discord.js');

const embed = new EmbedBuilder()
  .setTitle(${JSON.stringify(currentEmbed.title)})
  .setDescription(${JSON.stringify(currentEmbed.description)})
  .setColor(${JSON.stringify(currentEmbed.color || BOT_CONFIG.colors.primary)})
  .setAuthor({ name: ${JSON.stringify(currentEmbed.authorName || 'OneBot')}, iconURL: '${BOT_CONFIG.logoUrl}' })
  .setFooter({ text: ${JSON.stringify(currentEmbed.footerText || `OneBot by ${BOT_CONFIG.developer}`)}, iconURL: '${BOT_CONFIG.logoUrl}' })
  ${currentEmbed.timestamp ? '.setTimestamp()' : ''}
  ${currentEmbed.fields.map(f => `.addFields({ name: ${JSON.stringify(f.name)}, value: ${JSON.stringify(f.value)}, inline: ${f.inline} })`).join('\n  ')};`;

    navigator.clipboard.writeText(djsCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#14141A] border border-[#262635] rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">صانع الرسائل المضمّنة (Discord Embed Builder)</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              تصميم رسائل الإعلانات والقوانين لسيرفر {settings.guildName} مع محاكي ديسكورد حي.
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyCode}
          className="bg-[#20202A] hover:bg-[#E53935] text-gray-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'تم نسخ كود Discord.js' : 'نسخ كود البوت'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Inputs & Configuration */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">عنوان الرسالة (Title)</label>
              <input
                type="text"
                value={currentEmbed.title}
                onChange={(e) => updateCurrentEmbed({ title: e.target.value })}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">وصف الرسالة (Description)</label>
              <textarea
                rows={3}
                value={currentEmbed.description}
                onChange={(e) => updateCurrentEmbed({ description: e.target.value })}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">اسم الكاتب (Author Name)</label>
                <input
                  type="text"
                  value={currentEmbed.authorName || ''}
                  onChange={(e) => updateCurrentEmbed({ authorName: e.target.value })}
                  className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">لون الـ Embed (الأساسي #E53935)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentEmbed.color || BOT_CONFIG.colors.primary}
                    onChange={(e) => updateCurrentEmbed({ color: e.target.value })}
                    className="w-9 h-9 rounded-lg bg-transparent border border-white/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentEmbed.color || BOT_CONFIG.colors.primary}
                    onChange={(e) => updateCurrentEmbed({ color: e.target.value })}
                    className="flex-1 bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">تذييل الرسالة (Footer Text)</label>
              <input
                type="text"
                value={currentEmbed.footerText || ''}
                onChange={(e) => updateCurrentEmbed({ footerText: e.target.value })}
                className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Fields Editor */}
          <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">حقول إضافية (Fields)</span>
              <button
                onClick={addField}
                className="text-xs text-[#E53935] hover:underline flex items-center gap-1 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة حقل
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {currentEmbed.fields.map((field, idx) => (
                <div key={idx} className="bg-[#191924] border border-[#29293C] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateField(idx, 'name', e.target.value)}
                      placeholder="اسم الحقل"
                      className="bg-[#121217] border border-[#2A2A38] rounded-lg px-2.5 py-1 text-xs text-white font-bold w-3/4"
                    />
                    <button
                      onClick={() => removeField(idx)}
                      className="text-gray-400 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={field.value}
                    onChange={(e) => updateField(idx, 'value', e.target.value)}
                    placeholder="محتوى الحقل..."
                    className="w-full bg-[#121217] border border-[#2A2A38] rounded-lg px-2.5 py-1 text-xs text-gray-300 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Discord UI Emulator */}
        <div className="lg:col-span-6 bg-[#2B2D31] rounded-2xl p-4 border border-[#3A3C43] shadow-2xl">
          <div className="text-[11px] text-gray-400 font-bold mb-3 flex items-center justify-between">
            <span>محاكي ديسكورد (Discord Client View)</span>
            <span className="text-emerald-400 font-mono">Live Preview</span>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-black border border-[#E53935] p-0.5 shrink-0 overflow-hidden">
              <img src={BOT_CONFIG.logoUrl} alt="OneBot" className="w-full h-full object-cover rounded-full" />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{BOT_CONFIG.name}</span>
                <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.5 rounded uppercase">
                  BOT
                </span>
                <span className="text-[10px] text-gray-400">اليوم الساعة 12:30 م</span>
              </div>

              {/* The Embed Container */}
              <div 
                className="mt-1 bg-[#1E1F22] rounded-lg p-4 border-r-4 space-y-2.5 max-w-lg transition-all"
                style={{ borderRightColor: currentEmbed.color || BOT_CONFIG.colors.primary }}
              >
                {/* Author */}
                {currentEmbed.authorName && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={currentEmbed.authorIcon || BOT_CONFIG.logoUrl} 
                      alt="" 
                      className="w-5 h-5 rounded-full object-cover" 
                    />
                    <span className="text-xs font-bold text-white">{currentEmbed.authorName}</span>
                  </div>
                )}

                {/* Title */}
                <h4 className="text-sm font-bold text-white">{currentEmbed.title || "عنوان الرسالة"}</h4>

                {/* Description */}
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {currentEmbed.description || "الوصف يظهر هنا..."}
                </p>

                {/* Fields */}
                {currentEmbed.fields.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/5">
                    {currentEmbed.fields.map((f, i) => (
                      <div key={i} className="text-xs">
                        <div className="font-bold text-white">{f.name}</div>
                        <div className="text-gray-300 whitespace-pre-wrap mt-0.5">{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-gray-400">
                  <img src={BOT_CONFIG.logoUrl} alt="" className="w-4 h-4 rounded-full" />
                  <span>{currentEmbed.footerText || `OneBot by ${BOT_CONFIG.developer}`}</span>
                  {currentEmbed.timestamp && <span>• اليوم</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
