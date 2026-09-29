import React, { useState } from 'react';
import { BOT_CONFIG } from '../config/botConfig';
import { GuildSummary } from '../types/guild';
import { 
  ChevronDown, 
  Plus, 
  ShieldCheck, 
  Check, 
  Layers, 
  Globe, 
  Server
} from 'lucide-react';

interface HeaderProps {
  currentGuildSummary: GuildSummary | undefined;
  guildList: GuildSummary[];
  onSelectGuild: (guildId: string) => void;
  onAddNewGuild: (guildId: string, guildName: string) => void;
  hasUnsavedChanges: boolean;
  onSaveCurrentSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentGuildSummary,
  guildList,
  onSelectGuild,
  onAddNewGuild,
  hasUnsavedChanges,
  onSaveCurrentSettings
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuildId, setNewGuildId] = useState('');
  const [newGuildName, setNewGuildName] = useState('');
  const [addError, setAddError] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuildId.trim()) {
      setAddError('يرجى إدخال معرف السيرفر (Guild ID)');
      return;
    }
    if (!/^\d{16,20}$/.test(newGuildId.trim())) {
      setAddError('معرف السيرفر يجب أن يتكون من 16 إلى 20 رقماً (Discord Snowflake)');
      return;
    }

    onAddNewGuild(newGuildId.trim(), newGuildName.trim() || `سيرفر ${newGuildId.slice(-4)}`);
    setNewGuildId('');
    setNewGuildName('');
    setAddError('');
    setIsAddModalOpen(false);
    setDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0F0F12]/95 backdrop-blur-md border-b border-[#22222B] px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand identity: OneBot by HyperSoft */}
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E53935] to-[#800F11] p-[2px] shadow-lg shadow-[#E53935]/25 transition-transform group-hover:scale-105">
              <img 
                src={BOT_CONFIG.logoUrl} 
                alt="OneBot Logo" 
                className="w-full h-full object-cover rounded-[10px] bg-black"
                onError={(e) => {
                  // Fallback in case of image load failure
                  (e.target as HTMLImageElement).src = '/icon/Logo.png';
                }}
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0F0F12] rounded-full" title="Online Cluster" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                {BOT_CONFIG.name}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E53935]/15 text-[#E53935] border border-[#E53935]/30">
                Multi-Guild
              </span>
            </div>
            <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <span>بواسطة</span>
              <span className="text-red-400 font-bold hover:underline cursor-pointer">{BOT_CONFIG.developer}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-500 font-mono text-[10px]">v{BOT_CONFIG.version}</span>
            </div>
          </div>
        </div>

        {/* Multi-Guild Switcher Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 bg-[#18181E] hover:bg-[#202028] border border-[#2A2A35] hover:border-[#E53935]/50 px-3.5 py-2 rounded-xl text-right transition-all group shadow-sm"
              aria-label="اختيار السيرفر"
            >
              <div className="w-8 h-8 rounded-lg bg-[#272732] flex items-center justify-center font-bold text-sm text-[#E53935] border border-[#353545] overflow-hidden">
                {currentGuildSummary?.guildIcon ? (
                  <img src={currentGuildSummary.guildIcon} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Server className="w-4 h-4 text-[#E53935]" />
                )}
              </div>

              <div className="hidden sm:block text-right">
                <div className="text-xs text-gray-400 font-medium">السيرفر الحالي</div>
                <div className="text-sm font-bold text-white max-w-[140px] md:max-w-[200px] truncate">
                  {currentGuildSummary?.guildName || "اختر سيرفراً"}
                </div>
              </div>

              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180 text-[#E53935]' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute left-0 sm:left-auto right-0 mt-2 w-72 sm:w-80 bg-[#16161C] border border-[#2C2C38] rounded-2xl shadow-2xl shadow-black/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-2 border-b border-[#252532] flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#E53935]" />
                    سيرفراتك ({guildList.length})
                  </span>
                  <span className="text-[10px] text-gray-500 bg-[#20202B] px-2 py-0.5 rounded-full">
                    بيانات معزولة
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto py-1 divide-y divide-[#20202B]/40">
                  {guildList.map((guild) => {
                    const isSelected = guild.guildId === currentGuildSummary?.guildId;
                    return (
                      <button
                        key={guild.guildId}
                        onClick={() => {
                          onSelectGuild(guild.guildId);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[#1E1E26] transition-colors text-right ${
                          isSelected ? 'bg-[#E53935]/10 border-r-4 border-[#E53935]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-[#E53935] text-white' : 'bg-[#252533] text-gray-300'
                          }`}>
                            {guild.guildName.slice(0, 1)}
                          </div>
                          <div className="truncate">
                            <div className={`text-xs font-bold truncate ${isSelected ? 'text-[#E53935]' : 'text-gray-200'}`}>
                              {guild.guildName}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              ID: {guild.guildId.slice(0, 8)}...
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-[#E53935] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Add new Server action */}
                <div className="p-2 border-t border-[#252532] mt-1">
                  <button
                    onClick={() => {
                      setIsAddModalOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#22222C] hover:bg-[#E53935]/15 hover:text-[#E53935] text-gray-300 hover:border-[#E53935]/40 border border-transparent py-2 rounded-xl text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    ربط سيرفر ديسكورد جديد (Guild ID)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={onSaveCurrentSettings}
            disabled={!hasUnsavedChanges}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              hasUnsavedChanges 
                ? 'bg-[#E53935] hover:bg-[#D32F2F] text-white shadow-[#E53935]/30 cursor-pointer animate-pulse'
                : 'bg-[#202028] text-gray-400 border border-[#2B2B38] cursor-default'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{hasUnsavedChanges ? 'حفظ التغييرات' : 'الإعدادات محفوظة'}</span>
          </button>
        </div>

      </div>

      {/* Add Guild Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141419] border border-[#2A2A38] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#252533]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E53935]/15 flex items-center justify-center text-[#E53935]">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">إضافة سيرفر ديسكورد جديد</h3>
                  <p className="text-xs text-gray-400">عزل تام لإعدادات السيرفر عبر الـ Guild ID</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#20202A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              {addError && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  معرف السيرفر (Discord Guild ID) <span className="text-[#E53935]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: 123456789012345678"
                  value={newGuildId}
                  onChange={(e) => setNewGuildId(e.target.value)}
                  className="w-full bg-[#1B1B22] border border-[#2C2C3A] focus:border-[#E53935] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  يمكنك الحصول عليه عبر النقر بالزر الأيمن على السيرفر في ديسكورد ثم "نسخ المعرّف" (Copy ID).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  اسم السيرفر (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: سيرفر مجتمع اللاعبين"
                  value={newGuildName}
                  onChange={(e) => setNewGuildName(e.target.value)}
                  className="w-full bg-[#1B1B22] border border-[#2C2C3A] focus:border-[#E53935] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#E53935] hover:bg-[#D32F2F] text-white py-2.5 rounded-xl font-bold text-xs transition-colors shadow-lg shadow-[#E53935]/25"
                >
                  تأكيد وإضافة السيرفر
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-[#20202A] hover:bg-[#282835] text-gray-300 rounded-xl font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
