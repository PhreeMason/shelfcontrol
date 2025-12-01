import { AlertTriangle, BookOpen, Check, ChevronLeft, ChevronRight, Database, ExternalLink, Eye, Info, Loader2, Palette, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

const SettingsScreen = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [theme, setTheme] = useState('default');
  const [fontSize, setFontSize] = useState(100);
  const [pendingThreshold, setPendingThreshold] = useState(20);
  const [readingPace, setReadingPace] = useState(50);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const BackButton = ({ onClick }) => (
    <button onClick={onClick} className="mb-6 text-gray-600 flex items-center gap-2 hover:text-gray-800">
      <ChevronLeft className="w-5 h-5" />
      Back to Settings
    </button>
  );

  const sections = [
    { id: 'appearance', title: 'Display & Appearance', icon: Palette, color: '#B8A9D9', desc: 'Theme, fonts, calendar' },
    { id: 'reading', title: 'Reading Preferences', icon: BookOpen, color: '#E8B4B8', desc: 'Pace, thresholds, progress' },
    { id: 'updates', title: 'App Updates', icon: RefreshCw, color: '#B8A9D9', desc: 'Check for new versions' },
    { id: 'data', title: 'Data & Privacy', icon: Database, color: '#E8B4B8', desc: 'Export, delete, policies' },
    { id: 'about', title: 'About & Support', icon: Info, color: '#B8A9D9', desc: 'Help, contact, version' }
  ];

  const ThemeSelector = () => {
    const themes = [
      { id: 'default', name: 'Default', primary: '#B8A9D9', secondary: '#E8B4B8' },
      { id: 'dark', name: 'Dark', primary: '#2B3D4F', secondary: '#374A5E' },
      { id: 'warm', name: 'Warm', primary: '#E8C2B9', secondary: '#F5C2A1' },
      { id: 'cool', name: 'Cool', primary: '#A8C5D1', secondary: '#B8D8E8' },
      { id: 'mint', name: 'Mint', primary: '#B8E8D9', secondary: '#C8F5E8' },
      { id: 'mono', name: 'Mono', primary: '#888888', secondary: '#AAAAAA' }
    ];

    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="p-6">
          <BackButton onClick={() => setActiveSection(null)} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#2B3D4F' }}>Display & Appearance</h2>
          <p className="text-gray-600 mb-6">Customize how ShelfControl looks</p>

          <h3 className="font-semibold mb-3">Color Theme</h3>
          <div className="space-y-3 mb-8">
            {themes.map((t) => (
              <button key={t.id} onClick={() => setTheme(t.id)}
                className="w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all"
                style={{ borderColor: theme === t.id ? t.primary : '#E5E7EB', backgroundColor: theme === t.id ? `${t.primary}15` : 'white' }}>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: t.primary }} />
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: t.secondary }} />
                  </div>
                  <span className="font-medium">{t.name}</span>
                </div>
                {theme === t.id && <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm" style={{ backgroundColor: t.primary }}><Check className="w-4 h-4" /></div>}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl mb-8" style={{ backgroundColor: '#F5F1EA' }}>
            <h3 className="font-medium mb-2">Colorblind Modes</h3>
            <div className="space-y-2">
              {['None', 'Red-Green (Deuteranopia)', 'Blue-Yellow (Tritanopia)'].map((mode) => (
                <label key={mode} className="flex items-center gap-2">
                  <input type="radio" name="colorblind" defaultChecked={mode === 'None'} className="w-4 h-4" style={{ accentColor: '#B8A9D9' }} />
                  <span className="text-sm">{mode}</span>
                </label>
              ))}
            </div>
          </div>

          <h3 className="font-semibold mb-3">Text Size</h3>
          <div className="mb-6">
            <input type="range" min="80" max="150" value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full" style={{ accentColor: '#B8A9D9' }} />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>Small</span><span>{fontSize}%</span><span>Large</span>
            </div>
          </div>
          <div className="p-4 rounded-xl mb-8" style={{ backgroundColor: '#F5F1EA', fontSize: `${fontSize}%` }}>
            <p className="font-bold mb-1">Preview: Book Title</p>
            <p className="text-gray-700">47 pages per day needed</p>
            <p className="text-sm text-gray-600">Due in 8 days</p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm">
            <Eye className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-800">Text will scale throughout the entire app</p>
          </div>
        </div>
      </div>
    );
  };

  const ReadingPreferences = () => (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="p-6">
        <BackButton onClick={() => setActiveSection(null)} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2B3D4F' }}>Reading Preferences</h2>
        <p className="text-gray-600 mb-6">Customize your reading tracking</p>

        <div className="p-5 rounded-2xl" style={{ backgroundColor: '#F5F1EA' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#2B3D4F' }}>Optional Prompts</h3>
          <p className="text-sm text-gray-600 mb-5">Choose when you'd like to be prompted to add notes</p>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-white rounded-xl">
              <div>
                <div className="font-medium" style={{ color: '#2B3D4F' }}>Require notes when pausing</div>
                <div className="text-sm text-gray-500">Add context for why you paused</div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-purple-400 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
              </label>
            </label>
            
            <label className="flex items-center justify-between p-4 bg-white rounded-xl">
              <div>
                <div className="font-medium" style={{ color: '#2B3D4F' }}>Require notes when DNFing</div>
                <div className="text-sm text-gray-500">Remember why you stopped reading</div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-purple-400 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
              </label>
            </label>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Tip:</span> Notes can help you remember your thoughts when writing reviews later!
          </p>
        </div>
      </div>
    </div>
  );

  const AppUpdates = () => {
    const handleCheckUpdate = () => {
      setIsCheckingUpdate(true);
      setUpdateStatus(null);
      setTimeout(() => {
        setIsCheckingUpdate(false);
        setUpdateStatus({ isAvailable: false, message: "You're on the latest version!" });
      }, 2000);
    };

    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="p-6">
          <BackButton onClick={() => setActiveSection(null)} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#2B3D4F' }}>App Updates</h2>
          <p className="text-gray-600 mb-6">Keep ShelfControl up to date</p>

          <div className="p-6 rounded-2xl text-center mb-6" style={{ backgroundColor: '#F5F1EA' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: '#B8A9D9' }}>📚</div>
            <h3 className="font-bold text-lg mb-1">ShelfControl</h3>
            <p className="text-gray-600 text-sm mb-1">Version 1.0.0</p>
            <p className="text-xs text-gray-500">Runtime: 1.0.0</p>
          </div>

          <button onClick={handleCheckUpdate} disabled={isCheckingUpdate}
            className="w-full p-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors mb-4"
            style={{ backgroundColor: isCheckingUpdate ? '#E5E7EB' : '#B8A9D9', color: isCheckingUpdate ? '#9CA3AF' : 'white' }}>
            {isCheckingUpdate ? (<><Loader2 className="w-5 h-5 animate-spin" />Checking...</>) : (<><RefreshCw className="w-5 h-5" />Check for Updates</>)}
          </button>

          {updateStatus && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${updateStatus.isAvailable ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${updateStatus.isAvailable ? 'text-green-600' : 'text-gray-600'}`} />
              <div>
                <p className={`font-medium ${updateStatus.isAvailable ? 'text-green-800' : 'text-gray-800'}`}>{updateStatus.message}</p>
                {!updateStatus.isAvailable && <p className="text-sm text-gray-600 mt-1">Last checked: just now</p>}
              </div>
            </div>
          )}

          <div className="mt-8 p-4 rounded-xl border border-gray-200">
            <h3 className="font-semibold mb-2">How Updates Work</h3>
            <p className="text-sm text-gray-600 mb-3">ShelfControl automatically checks for updates when you open the app. New features and fixes are downloaded in the background and applied on next launch.</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600"><Check className="w-4 h-4 text-green-500" />Automatic background updates</div>
              <div className="flex items-center gap-2 text-gray-600"><Check className="w-4 h-4 text-green-500" />No app store update needed</div>
              <div className="flex items-center gap-2 text-gray-600"><Check className="w-4 h-4 text-green-500" />Your data stays safe</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ConfirmationModal = ({ isOpen, onClose, title, description, onConfirm, confirmText }) => {
    if (!isOpen) return null;
    const isValid = deleteConfirmText.toLowerCase() === 'i understand';
    return (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-center mb-2" style={{ color: '#2B3D4F' }}>{title}</h3>
          <p className="text-gray-600 text-center text-sm mb-4">{description}</p>
          <p className="text-sm text-gray-700 mb-2">Type <span className="font-mono font-bold">i understand</span> to confirm:</p>
          <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="i understand"
            className="w-full p-3 rounded-lg border border-gray-300 mb-4 font-mono" />
          <div className="flex gap-3">
            <button onClick={() => { onClose(); setDeleteConfirmText(''); }} className="flex-1 p-3 rounded-xl border border-gray-300 font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={() => { if (isValid) { onConfirm(); onClose(); setDeleteConfirmText(''); }}} disabled={!isValid}
              className={`flex-1 p-3 rounded-xl font-medium transition-colors ${isValid ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>{confirmText}</button>
          </div>
        </div>
      </div>
    );
  };

  const DataPrivacy = () => (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="p-6">
        <BackButton onClick={() => setActiveSection(null)} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2B3D4F' }}>Data & Privacy</h2>
        <p className="text-gray-600 mb-6">Manage your data and privacy</p>

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Export Your Data</h3>
          <button className="w-full p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-medium">Export to CSV</div>
                <div className="text-sm text-gray-500">Download all your book data</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Privacy Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><div className="font-medium">Analytics</div><div className="text-sm text-gray-500">Help improve ShelfControl</div></div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-purple-400 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div><div className="font-medium">Crash Reporting</div><div className="text-sm text-gray-500">Send anonymous crash reports</div></div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-purple-400 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Legal</h3>
          <div className="space-y-2">
            <a href="https://www.shelfcontrolapp.com/privacy-policy" target="_blank" rel="noopener noreferrer"
              className="w-full p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between">
              <span className="text-sm">Privacy Policy</span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
            <a href="https://www.shelfcontrolapp.com/terms" target="_blank" rel="noopener noreferrer"
              className="w-full p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between">
              <span className="text-sm">Terms of Service</span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Danger Zone</h3>
          <p className="text-sm text-red-700 mb-4">These actions cannot be undone</p>
          <div className="space-y-3">
            <button onClick={() => setShowDeleteDataModal(true)} className="w-full p-3 rounded-lg border border-red-300 text-red-700 font-medium hover:bg-red-100 transition-colors">Delete All Data</button>
            <button onClick={() => setShowDeleteAccountModal(true)} className="w-full p-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors">Delete Account</button>
          </div>
        </div>
      </div>
      <ConfirmationModal isOpen={showDeleteDataModal} onClose={() => setShowDeleteDataModal(false)} title="Delete All Data?"
        description="This will permanently delete all your books, progress, and notes. Your account will remain active but empty."
        onConfirm={() => console.log('Data deleted')} confirmText="Delete Data" />
      <ConfirmationModal isOpen={showDeleteAccountModal} onClose={() => setShowDeleteAccountModal(false)} title="Delete Account?"
        description="This will permanently delete your account and all associated data. You will be signed out and cannot recover this account."
        onConfirm={() => console.log('Account deleted')} confirmText="Delete Account" />
    </div>
  );

  const AboutSupport = () => (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="p-6">
        <BackButton onClick={() => setActiveSection(null)} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2B3D4F' }}>About & Support</h2>
        <p className="text-gray-600 mb-6">Get help and learn more</p>

        <div className="mb-6 p-6 rounded-2xl text-center" style={{ backgroundColor: '#F5F1EA' }}>
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center text-4xl" style={{ backgroundColor: '#B8A9D9' }}>📚</div>
          <h3 className="font-bold text-xl mb-1">ShelfControl</h3>
          <p className="text-gray-600 text-sm mb-1">Version 1.0.0 (Build 42)</p>
          <p className="text-xs text-gray-500">Made with 💜 by readers, for readers</p>
        </div>

        {/* What's New */}
        <div className="mb-6 p-4 rounded-xl border border-purple-200 bg-purple-50">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            ✨ What's New in 1.0.0
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Custom themes and font sizes</li>
            <li>• Pending threshold customization</li>
            <li>• Export your data to CSV</li>
            <li>• Improved pages per day display</li>
            <li>• Calendar dot customization</li>
          </ul>
          <button className="text-sm mt-3 text-purple-600 font-medium hover:text-purple-800 transition-colors">
            View full changelog →
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Help & Support</h3>
          <div className="space-y-2">
            {[
              { title: 'Feature Tutorial', desc: 'Learn how to use ShelfControl', color: 'purple' },
              { title: 'Help & FAQ', desc: 'Common questions answered', color: 'blue' },
              { title: 'Contact Support', desc: 'Get help from our team', color: 'green' },
              { title: 'Report a Bug', desc: 'Help us improve', color: 'orange' },
              { title: 'Request a Feature', desc: 'Share your ideas', color: 'pink' }
            ].map((item) => (
              <button key={item.title} className="w-full p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${item.color}-50 flex items-center justify-center`}>
                    <Info className={`w-5 h-5 text-${item.color}-600`} />
                  </div>
                  <div className="text-left"><div className="font-medium">{item.title}</div><div className="text-sm text-gray-500">{item.desc}</div></div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Share ShelfControl</h3>
          <div className="space-y-2">
            <button className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 flex items-center justify-between hover:from-purple-100 hover:to-pink-100 transition-colors">
              <div className="text-left"><div className="font-medium">Share with Friends</div><div className="text-sm text-gray-600">Help others track their ARCs</div></div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button className="w-full p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 flex items-center justify-between hover:from-yellow-100 hover:to-orange-100 transition-colors">
              <div className="text-left"><div className="font-medium">Rate on App Store</div><div className="text-sm text-gray-600">⭐️⭐️⭐️⭐️⭐️</div></div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl" style={{ backgroundColor: '#F5F1EA' }}>
          <p className="text-sm text-gray-600 mb-2">ShelfControl was shaped by ARC reviewers who helped test and improve it.</p>
          <button className="text-sm text-purple-600 font-medium">View Credits & Acknowledgments →</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-purple-200 to-pink-200 p-6 pb-8 relative">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <div className="w-full h-full bg-green-200 flex items-center justify-center text-3xl">🌹</div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white drop-shadow">@Morton</h1>
            <p className="text-white/80 text-sm">test.user455@example.com</p>
            <p className="text-white/60 text-xs">Joined 9/24/2025</p>
          </div>
        </div>
        <button className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-white text-sm">✏️</span>
        </button>
      </div>

      {/* Settings List */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          {sections.map((section, i) => (
            <div key={section.id}>
              <button onClick={() => setActiveSection(section.id)}
                className="w-full py-4 flex items-center gap-4 hover:bg-gray-50 rounded-xl px-2 transition-colors">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${section.color}20` }}>
                  <section.icon className="w-6 h-6" style={{ color: section.color }} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold" style={{ color: '#2B3D4F' }}>{section.title}</h3>
                  <p className="text-sm text-gray-500">{section.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              {i < sections.length - 1 && <div className="h-px bg-gray-100 mx-2" />}
            </div>
          ))}
        </div>

        {/* Sign Out */}
        <button className="w-full mt-4 p-4 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors">
          Sign Out
        </button>
      </div>

      {/* Detail Views */}
      {activeSection === 'appearance' && <ThemeSelector />}
      {activeSection === 'reading' && <ReadingPreferences />}
      {activeSection === 'updates' && <AppUpdates />}
      {activeSection === 'data' && <DataPrivacy />}
      {activeSection === 'about' && <AboutSupport />}
    </div>
  );
};

export default SettingsScreen;''