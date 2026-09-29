import React, { useState } from 'react';
import { GuildSettings } from '../../types/guild';
import { Settings2, Download, Upload, RotateCcw, Copy, Check } from 'lucide-react';
import { createDefaultGuildSettings } from '../../services/multiGuildManager';

interface SettingsTabProps {
  settings: GuildSettings;
  onUpdate: (updated: Partial<GuildSettings>) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ settings, onUpdate }) => {
  const [copiedId, setCopiedId] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleCopyId = () => {
    navigator.clipboard.writeText(settings.guildId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `OneBot_Guild_${settings.guildId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        // Force the imported settings to strictly keep current guildId
        const sanitized = {
          ...parsed,
          guildId: settings.guildId,
          guildName: settings.guildName
        };
        onUpdate(sanitized);
        setImportStatus('تم استيراد الإعدادات بنجاح إلى هذا السيرفر!');
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err) {
        setImportStatus('خطأ: ملف الـ JSON غير صالح.');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm(`هل أنت متأكد من رغبتك في إعادة ضبط إعدادات سيرفر "${settings.guildName}" إلى القيم الافتراضية؟`)) {
      const defaults = createDefaultGuildSettings(settings.guildId, settings.guildName, settings.guildIcon);
      onUpdate(defaults);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#14141A] border border-[#262635] rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] flex items-center justify-center shrink-0">
          <Settings2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">إعدادات السيرفر العامة (Server Settings)</h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            الإعدادات الأساسية للغة والبادئة والنسخ الاحتياطي الخاصة بسيرفر <span className="text-white font-semibold">{settings.guildName}</span>.
          </p>
        </div>
      </div>

      {importStatus && (
        <div className="p-3 bg-[#E53935]/15 border border-[#E53935]/40 rounded-xl text-xs text-white">
          {importStatus}
        </div>
      )}

      {/* Basic Settings Form */}
      <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">معرف السيرفر الفريد (Guild ID)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={settings.guildId}
                className="flex-1 bg-[#121217] border border-[#2A2A38] rounded-xl px-3.5 py-2 text-xs text-gray-300 font-mono"
              />
              <button
                onClick={handleCopyId}
                className="bg-[#20202A] hover:bg-[#2A2A38] text-gray-300 p-2 rounded-xl transition-colors"
                title="نسخ المعرف"
              >
                {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">يضمن عزل البيانات بشكل مستقل لهذا السيرفر فقط.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">اسم السيرفر</label>
            <input
              type="text"
              value={settings.guildName}
              onChange={(e) => onUpdate({ guildName: e.target.value })}
              className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">بادئة الأوامر (Command Prefix)</label>
            <input
              type="text"
              value={settings.prefix}
              onChange={(e) => onUpdate({ prefix: e.target.value })}
              className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">لغة البوت المفضلة</label>
            <select
              value={settings.language}
              onChange={(e) => onUpdate({ language: e.target.value as any })}
              className="w-full bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3.5 py-2 text-xs text-white"
            >
              <option value="ar">العربية (Arabic)</option>
              <option value="en">الإنجليزية (English)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backup & Reset actions */}
      <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">النسخ الاحتياطي وإدارة ملفات التكوين</h3>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 bg-[#20202A] hover:bg-[#E53935] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            تصدير إعدادات السيرفر (Export JSON)
          </button>

          <label className="flex items-center gap-2 bg-[#20202A] hover:bg-[#E53935] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            استيراد إعدادات (Import JSON)
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-red-950/30 hover:bg-red-900/60 border border-red-800/40 text-red-300 px-4 py-2 rounded-xl text-xs font-bold transition-colors mr-auto"
          >
            <RotateCcw className="w-4 h-4" />
            إعادة تعيين إلى الافتراضي
          </button>
        </div>
      </div>
    </div>
  );
};
