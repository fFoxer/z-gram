import React, { useEffect } from 'react';

const NotificationToast = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {notifications.map(n => (
        <div
          key={n.id}
          className="bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3 pointer-events-auto max-w-[300px] animate-slide-in"
          onClick={() => onRemove(n.id)}
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
            {n.avatar
              ? <img src={n.avatar} alt="" className="w-full h-full object-cover rounded-full" />
              : (n.name?.[0] || 'Z').toUpperCase()
            }
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{n.name}</p>
            <p className="text-gray-400 text-xs truncate">{n.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
