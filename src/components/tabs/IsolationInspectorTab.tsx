import React, { useState } from 'react';
import { GuildSettings, GuildSummary } from '../../types/guild';
import { multiGuildManager } from '../../services/multiGuildManager';
import { ServerCrash, ShieldCheck, Play, CheckCircle2, AlertCircle, Database } from 'lucide-react';

interface IsolationInspectorTabProps {
  currentSettings: GuildSettings;
  guildList: GuildSummary[];
}

export const IsolationInspectorTab: React.FC<IsolationInspectorTabProps> = ({ currentSettings, guildList }) => {
  const [targetComparisonGuildId, setTargetComparisonGuildId] = useState<string>(
    guildList.find(g => g.guildId !== currentSettings.guildId)?.guildId || ''
  );
  const [testResult, setTestResult] = useState<{
    ran: boolean;
    isolated: boolean;
    details: string;
  } | null>(null);

  const compareSettings = targetComparisonGuildId
    ? multiGuildManager.getGuildSettings(targetComparisonGuildId)
    : null;

  const runLiveAudit = () => {
    if (!targetComparisonGuildId) {
      alert("يرجى اختيار سيرفر ثانٍ لإجراء فحص المقارنة والعزل.");
      return;
    }
    const result = multiGuildManager.verifyMultiGuildIsolation(
      currentSettings.guildId,
      targetComparisonGuildId
    );
    setTestResult({
      ran: true,
      isolated: result.isolated,
      details: result.details
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#14141A] border border-[#262635] rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">فاحص عزل السيرفرات (Multi-Guild Architecture Inspector)</h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            يتحقق هذا الفاحص التقني من أن بنية OneBot تقوم بعزل كامل لبيانات كل سيرفر عبر مفتاح <span className="text-[#E53935] font-mono font-bold">guildId</span> المستقل، مع عدم وجود أي إعدادات مشتركة أو متداخلة.
          </p>
        </div>
      </div>

      {/* Live Audit Action */}
      <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">فحص عزل الذاكرة الحية (Live Isolation Audit)</h3>
            <p className="text-xs text-gray-400">
              يختبر تعديل خاصية في السيرفر الحالي للتأكد من عدم تسرب التعديل إلى السيرفر الآخر.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={targetComparisonGuildId}
              onChange={(e) => setTargetComparisonGuildId(e.target.value)}
              className="bg-[#1C1C24] border border-[#2B2B38] rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="">-- اختر سيرفر للمقارنة --</option>
              {guildList
                .filter(g => g.guildId !== currentSettings.guildId)
                .map(g => (
                  <option key={g.guildId} value={g.guildId}>
                    {g.guildName} ({g.guildId.slice(0, 8)}...)
                  </option>
                ))}
            </select>

            <button
              onClick={runLiveAudit}
              className="bg-[#E53935] hover:bg-[#D32F2F] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-md shadow-[#E53935]/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              تشغيل الفحص
            </button>
          </div>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            testResult.isolated
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
              : 'bg-red-950/40 border-red-800/60 text-red-300'
          }`}>
            {testResult.isolated ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <div className="font-bold mb-0.5">
                {testResult.isolated ? 'نجح الفحص: العزل التام مفعل بنسبة 100%' : 'فشل الفحص: يوجد تداخل في البيانات'}
              </div>
              <div>{testResult.details}</div>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-side Guild Comparison Matrix */}
      {compareSettings && (
        <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-[#E53935]" />
            مقارنة العزل الحي بين السيرفرين
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Server A */}
            <div className="bg-[#181822] border-2 border-[#E53935]/50 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-white text-sm">السيرفر الحالي (A)</span>
                <span className="font-mono text-[#E53935] font-bold text-[11px]">{currentSettings.guildName}</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px] text-gray-300">
                <div><span className="text-gray-500">Guild ID:</span> {currentSettings.guildId}</div>
                <div><span className="text-gray-500">Prefix:</span> {currentSettings.prefix}</div>
                <div><span className="text-gray-500">Language:</span> {currentSettings.language}</div>
                <div><span className="text-gray-500">Anti-Ban Limit:</span> {currentSettings.protection.antiBan.limit}</div>
                <div><span className="text-gray-500">Whitelist Count:</span> {currentSettings.protection.whitelistUsers.length}</div>
                <div><span className="text-gray-500">Auto-Responder Rules:</span> {currentSettings.autoResponder.length}</div>
              </div>
            </div>

            {/* Server B */}
            <div className="bg-[#181822] border-2 border-[#3A3A4A] rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-white text-sm">السيرفر المقارن (B)</span>
                <span className="font-mono text-gray-300 font-bold text-[11px]">{compareSettings.guildName}</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px] text-gray-300">
                <div><span className="text-gray-500">Guild ID:</span> {compareSettings.guildId}</div>
                <div><span className="text-gray-500">Prefix:</span> {compareSettings.prefix}</div>
                <div><span className="text-gray-500">Language:</span> {compareSettings.language}</div>
                <div><span className="text-gray-500">Anti-Ban Limit:</span> {compareSettings.protection.antiBan.limit}</div>
                <div><span className="text-gray-500">Whitelist Count:</span> {compareSettings.protection.whitelistUsers.length}</div>
                <div><span className="text-gray-500">Auto-Responder Rules:</span> {compareSettings.autoResponder.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Verification Checkpoints */}
      <div className="bg-[#14141B] border border-[#252535] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white">معايير التحقق من Multi-Guild في OneBot</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-[#191924] border border-[#262635] p-3 rounded-xl flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white">مفتاح التخزين المخصص</div>
              <div className="text-gray-400 text-[11px]">مفتاح كل سيرفر يبدأ بـ onebot_guild_ متبوعاً بالـ guildId فقط.</div>
            </div>
          </div>

          <div className="bg-[#191924] border border-[#262635] p-3 rounded-xl flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white">لا يوجد Guild ID ثابت</div>
              <div className="text-gray-400 text-[11px]">كل العمليات البرمجية تستقبل الـ guildId كمعامل ديناميكي إلزامي.</div>
            </div>
          </div>

          <div className="bg-[#191924] border border-[#262635] p-3 rounded-xl flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white">عزل الإشراف والحماية</div>
              <div className="text-gray-400 text-[11px]">حدود الحماية والقائمة البيضاء ورتب الكتم خاصة بكل سيرفر على حدة.</div>
            </div>
          </div>

          <div className="bg-[#191924] border border-[#262635] p-3 rounded-xl flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white">التنقل السلس في اللوحة</div>
              <div className="text-gray-400 text-[11px]">التبديل بين السيرفرات يحفظ التغييرات ويحمل بيانات السيرفر المختار فوراً.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
