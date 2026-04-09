import React, { useState, useEffect } from 'react';
import HotkeyInput from './HotkeyInput';

function Settings({ isOpen, onClose, hotkey, onHotkeyChange }) {
  const [localHotkey, setLocalHotkey] = useState(hotkey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalHotkey(hotkey);
  }, [hotkey]);

  const handleSave = async () => {
    try {
      await window.electronAPI.setHotkey(localHotkey);
      onHotkeyChange(localHotkey);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save hotkey:', err);
    }
  };

  const handleReset = () => {
    setLocalHotkey('Control+Shift+V');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="settings-section">
          <h3>Hotkey</h3>
          <p className="settings-description">
            Global shortcut to show/hide the clipboard window
          </p>
          <div className="hotkey-setting">
            <HotkeyInput 
              value={localHotkey} 
              onChange={setLocalHotkey} 
            />
            <div className="hotkey-actions">
              <button className="reset-btn" onClick={handleReset}>
                Reset
              </button>
              <button className="save-btn" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
          {saved && (
            <p className="save-success">Hotkey saved!</p>
          )}
        </div>

        <div className="settings-section">
          <h3>About</h3>
          <p className="app-info">
            <strong>Clipboard History Manager</strong><br/>
            Version 1.0.0<br/>
            Built with Electron
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
