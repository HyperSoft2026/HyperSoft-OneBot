/**
 * OneBot by HyperSoft
 * Official Multi-Guild Management Dashboard
 */

import React, { useState, useEffect } from 'react';
import { multiGuildManager } from './services/multiGuildManager';
import { GuildSettings, GuildSummary } from './types/guild';
import { Header } from './components/Header';
import { Sidebar, TabId } from './components/Sidebar';
import { OverviewTab } from './components/tabs/OverviewTab';
import { ProtectionTab } from './components/tabs/ProtectionTab';
import { ModerationTab } from './components/tabs/ModerationTab';
import { TicketsTab } from './components/tabs/TicketsTab';
import { AutoResponderTab } from './components/tabs/AutoResponderTab';
import { RolesTab } from './components/tabs/RolesTab';
import { WelcomeTab } from './components/tabs/WelcomeTab';
import { LevelsTab } from './components/tabs/LevelsTab';
import { EmbedsTab } from './components/tabs/EmbedsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { IsolationInspectorTab } from './components/tabs/IsolationInspectorTab';
import { BOT_CONFIG } from './config/botConfig';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [guildList, setGuildList] = useState<GuildSummary[]>([]);
  const [activeGuildId, setActiveGuildId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [settings, setSettings] = useState<GuildSettings | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load initial guild list
  useEffect(() => {
    const list = multiGuildManager.getGuildList();
    setGuildList(list);
    if (list.length > 0) {
      const initialId = list[0].guildId;
      setActiveGuildId(initialId);
      const initialSettings = multiGuildManager.getGuildSettings(initialId);
      setSettings(initialSettings);
    }
  }, []);

  // Switch guild handler
  const handleSelectGuild = (newGuildId: string) => {
    if (newGuildId === activeGuildId) return;

    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm("لديك تعديلات غير محفوظة على هذا السيرفر. هل تريد الانتقال وحفظ التغييرات أولاً؟");
      if (confirmSwitch) {
        handleSaveSettings();
      }
    }

    setActiveGuildId(newGuildId);
    const newSettings = multiGuildManager.getGuildSettings(newGuildId);
    setSettings(newSettings);
    setHasUnsavedChanges(false);

    showToast(`تم التبديل إلى سيرفر "${newSettings.guildName}" (ID: ${newGuildId})`);
  };

  // Add new guild handler
  const handleAddNewGuild = (guildId: string, guildName: string) => {
    try {
      const newSettings = multiGuildManager.registerNewGuild(guildId, guildName);
      const updatedList = multiGuildManager.getGuildList();
      setGuildList(updatedList);
      setActiveGuildId(guildId);
      setSettings(newSettings);
      setHasUnsavedChanges(false);
      showToast(`تمت إضافة وربط سيرفر "${guildName}" بنجاح!`);
    } catch (e: any) {
      alert(e.message || "فشلت إضافة السيرفر");
    }
  };

  // Update current settings in memory
  const handleUpdateSettings = (partial: Partial<GuildSettings>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      ...partial
    });
    setHasUnsavedChanges(true);
  };

  // Save changes to persistent storage
  const handleSaveSettings = () => {
    if (!settings || !activeGuildId) return;

    const saved = multiGuildManager.saveGuildSettings(activeGuildId, settings);
    setSettings(saved);
    setHasUnsavedChanges(false);
    
    // Refresh guild list in case name changed
    setGuildList(multiGuildManager.getGuildList());

    showToast(`تم حفظ جميع إعدادات سيرفر "${saved.guildName}" بنجاح!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const currentSummary = guildList.find(g => g.guildId === activeGuildId);

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#E53935]/20 border border-[#E53935] p-2 flex items-center justify-center animate-pulse">
            <img src={BOT_CONFIG.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs text-gray-400 font-mono">جاري تحميل بيانات السيرفرات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6] flex flex-col selection:bg-[#E53935] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#16161D] border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentGuildSummary={currentSummary}
        guildList={guildList}
        onSelectGuild={handleSelectGuild}
        onAddNewGuild={handleAddNewGuild}
        hasUnsavedChanges={hasUnsavedChanges}
        onSaveCurrentSettings={handleSaveSettings}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          guildName={settings.guildName}
        />

        {/* Tab Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              settings={settings}
              onUpdate={handleUpdateSettings}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'protection' && (
            <ProtectionTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'moderation' && (
            <ModerationTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'tickets' && (
            <TicketsTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'autoresponder' && (
            <AutoResponderTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'roles' && (
            <RolesTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'welcome' && (
            <WelcomeTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'levels' && (
            <LevelsTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'embeds' && (
            <EmbedsTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'inspector' && (
            <IsolationInspectorTab
              currentSettings={settings}
              guildList={guildList}
            />
          )}
        </main>
      </div>
    </div>
  );
}
