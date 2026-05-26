import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { IoCheckmark, IoClose } from 'react-icons/io5';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = url;
  });

const getCroppedBlob = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const size = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    size, size
  );

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
};

const ImageCropModal = ({ imageSrc, onConfirm, onCancel }) => {
  const [crop, setCrop]         = useState({ x: 0, y: 0 });
  const [zoom, setZoom]         = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);

  const onCropComplete = useCallback((_, pixelCrop) => {
    setCroppedArea(pixelCrop);
  }, []);

  const handleConfirm = async () => {
    if (!croppedArea) return;
    const blob = await getCroppedBlob(imageSrc, croppedArea);
    onConfirm(blob);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center">
      <div className="bg-[#2a2a2a] rounded-2xl overflow-hidden border border-white/10 shadow-2xl w-[420px] flex flex-col">

        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition">
            <IoClose size={22} />
          </button>
          <span className="text-white font-semibold text-base">Редактировать фото</span>
          <button
            onClick={handleConfirm}
            className="text-blue-400 hover:text-blue-300 transition font-semibold text-sm"
          >
            Готово
          </button>
        </div>

        {/* Кроппер */}
        <div className="relative w-full bg-black" style={{ height: 360 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: '#111' },
              cropAreaStyle:  { border: '2px solid rgba(255,255,255,0.7)' },
            }}
          />
        </div>

        {/* Слайдер зума */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/10">
          <span className="text-gray-400 text-lg select-none">−</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-blue-500 cursor-pointer"
          />
          <span className="text-gray-400 text-lg select-none">+</span>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-[#373737] hover:bg-[#444] text-white text-sm font-medium transition"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <IoCheckmark size={18} /> Применить
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImageCropModal;
