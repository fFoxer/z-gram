import React, { useState, useRef, useEffect } from 'react';
import { IoClose, IoAdd, IoSend } from 'react-icons/io5';

const getFileType = (file) => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/i)) return 'audio';
  return 'file';
};

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const FilePreviewModal = ({ files: initialFiles, onSend, onClose }) => {
  const [files, setFiles] = useState(Array.from(initialFiles));
  const [caption, setCaption] = useState('');
  const [previews, setPreviews] = useState({});
  const addFileRef = useRef(null);

  useEffect(() => {
    const map = {};
    Array.from(initialFiles).forEach(f => {
      if (f.type.startsWith('image/')) map[f.name + f.size] = URL.createObjectURL(f);
    });
    setPreviews(map);
    return () => Object.values(map).forEach(URL.revokeObjectURL);
  }, [initialFiles]);

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles);
    setFiles(prev => [...prev, ...arr]);
    const newPreviews = {};
    arr.forEach(f => {
      if (f.type.startsWith('image/')) newPreviews[f.name + f.size] = URL.createObjectURL(f);
    });
    setPreviews(prev => ({ ...prev, ...newPreviews }));
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (files.length === 0) { onClose(); return null; }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm">
            {files.length === 1 ? 'Отправить файл' : `Отправить файлы (${files.length})`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <IoClose size={20} />
          </button>
        </div>

        {/* File list */}
        <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
          {files.map((file, i) => {
            const type = getFileType(file);
            const preview = previews[file.name + file.size];
            return (
              <div key={i} className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-2.5">
                <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-[#333] flex items-center justify-center">
                  {type === 'image' && preview
                    ? <img src={preview} alt="" className="w-full h-full object-cover" />
                    : <span className="text-xl">{type === 'video' ? '🎬' : type === 'audio' ? '🎵' : '📄'}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{file.name}</p>
                  <p className="text-gray-400 text-xs">{formatSize(file.size)}</p>
                </div>
                <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400 transition flex-shrink-0 p-1">
                  <IoClose size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Caption */}
        <div className="px-4 pb-3">
          <input
            value={caption}
            onChange={e => setCaption(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSend(files, caption.trim())}
            placeholder="Добавить подпись..."
            autoFocus
            className="w-full bg-[#1a1a1a] text-white text-sm rounded-xl px-4 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
          <div>
            <input type="file" ref={addFileRef} onChange={e => addFiles(e.target.files)} className="hidden" multiple />
            <button
              onClick={() => addFileRef.current?.click()}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition px-3 py-1.5 rounded-lg hover:bg-white/10"
            >
              <IoAdd size={17} />
              Добавить
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-gray-400 hover:text-white text-sm transition px-4 py-1.5 rounded-lg hover:bg-white/10">
              Отмена
            </button>
            <button
              onClick={() => onSend(files, caption.trim())}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
            >
              <IoSend size={13} />
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
