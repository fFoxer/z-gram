import React from 'react';
import { FaComments } from 'react-icons/fa';

const NoChatSelected = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-bg-chat">
      <div className="text-center">
        <div className="w-20 h-20 bg-bg-hover rounded-full flex items-center justify-center mx-auto mb-6">
          <FaComments size={40} className="text-text-muted" />
        </div>
        <h2 className="text-text-secondary text-2xl font-medium mb-2">
          Выберите чат
        </h2>
        <p className="text-text-muted text-base">
          или создайте новый, чтобы начать общение
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;