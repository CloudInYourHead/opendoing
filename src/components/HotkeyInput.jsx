import React, { useState, useRef, useEffect } from 'react';

function HotkeyInput({ value, onChange }) {
  const [isRecording, setIsRecording] = useState(false);
  const [tempHotkey, setTempHotkey] = useState('');
  const inputRef = useRef(null);

  const formatHotkey = (hotkey) => {
    if (!hotkey) return 'Click to set';
    
    const parts = hotkey.split('+').map(part => {
      const lower = part.toLowerCase();
      if (lower === 'control') return 'Ctrl';
      if (lower === 'meta') return 'Win';
      if (lower === 'arrowup') return '\u2191';
      if (lower === 'arrowdown') return '\u2193';
      if (lower === 'arrowleft') return '\u2190';
      if (lower === 'arrowright') return '\u2192';
      return part.charAt(0).toUpperCase() + part.slice(1);
    });
    return parts.join('+');
  };

  const handleKeyDown = (e) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    const parts = [];
    
    if (e.ctrlKey) parts.push('Control');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');
    
    const key = e.key;
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      parts.push(key);
    }

    if (parts.length > 1) {
      setTempHotkey(parts.join('+'));
    }
  };

  const handleKeyUp = (e) => {
    if (!isRecording) return;
    
    if (tempHotkey) {
      onChange(tempHotkey);
      setIsRecording(false);
      setTempHotkey('');
    }
  };

  const handleClick = () => {
    setIsRecording(true);
    setTempHotkey('');
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (isRecording && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRecording]);

  const displayValue = tempHotkey || value;

  return (
    <div className="hotkey-input">
      <input
        ref={inputRef}
        type="text"
        readOnly
        value={formatHotkey(displayValue)}
        placeholder="Click to set hotkey"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        className={isRecording ? 'recording' : ''}
      />
      {isRecording && (
        <span className="recording-hint">Press keys...</span>
      )}
    </div>
  );
}

export default HotkeyInput;
