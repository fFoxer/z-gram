import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, register } from '../store/authSlice';

// Список стран с кодами
const countries = [
  { name: 'Россия', code: '+7', flag: '🇺' },
  { name: 'Украина', code: '+380', flag: '🇺🇦' },
  { name: 'Беларусь', code: '+375', flag: '🇧🇾' },
  { name: 'Казахстан', code: '+7', flag: '🇰🇿' },
  { name: 'Узбекистан', code: '+998', flag: '🇺🇿' },
  { name: 'США', code: '+1', flag: '🇺🇸' },
  { name: 'Германия', code: '+49', flag: '🇩🇪' },
  { name: 'Франция', code: '+33', flag: '🇫🇷' },
  { name: 'Великобритания', code: '+44', flag: '🇬🇧' },
];

const AuthPage = () => {
  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  };
  const [isLogin, setIsLogin] = useState(true);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    phone: '',
    password: '',
    country_code: '+7',
    country_name: 'Россия'
  });
  
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectCountry = (country) => {
    setFormData({ 
      ...formData, 
      country_code: country.code, 
      country_name: country.name 
    });
    setShowCountryDropdown(false);
  };

  const handleSubmit = (e) => {
  e.preventDefault();
  
  // Формируем полный номер: код страны + номер без плюса
  const fullPhone = formData.country_code + formData.phone.replace(/\D/g, '');
  
  if (isLogin) {
    dispatch(login({ phone: fullPhone, password: formData.password }));
  } else {
    dispatch(register({
      username: formData.username,
      phone: fullPhone,
      password: formData.password,
      country_code: formData.country_code,
      full_name: formData.full_name
    }));
  }
};

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a]">
      
      {/* ✅ ВЕРХНЯЯ ПАНЕЛЬ (исправлено - теперь сверху, не слева) */}
      <div className="h-12 bg-[#333333] flex items-center justify-center shadow-lg z-20 border-b border-[#222]">
        <h1 className="text-white text-xl font-bold tracking-[0.2em] drop-shadow-md">Z-Gram</h1>
      </div>

      {/* Основной контент */}
      <div className="flex-1 flex items-center justify-center p-4">
        
        {/* Карточка */}
        <div className="w-full max-w-[450px] bg-[#555555] rounded-lg shadow-2xl p-10">
          
          {/* Заголовок */}
          <h2 className="text-3xl font-bold text-white text-center mb-3 uppercase tracking-wide drop-shadow-lg">
            Добро пожаловать
          </h2>
          
          <p className="text-gray-200 text-sm text-center mb-8 leading-relaxed">
            Пожалуйста, выберите свою страну и введите полный номер телефона.
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-400 text-red-300 text-sm p-3 rounded mb-6 text-center animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Выбор страны с выпадающим списком */}
            <div className="relative">
              <label className="block text-xs text-gray-300 mb-1 uppercase tracking-wide">Страна</label>
              <button
                type="button"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className="w-full flex items-center justify-between bg-transparent text-white text-sm border-b border-gray-400 pb-2 hover:border-blue-400 transition-colors"
              >
                <span>{formData.country_name}</span>
                <span className="text-gray-400">▼</span>
              </button>
              
              {/* Выпадающий список стран */}
              {showCountryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#444] border border-gray-500 rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto">
                  {countries.map((country) => (
                    <button
                      key={country.code + country.name}
                      type="button"
                      onClick={() => handleSelectCountry(country)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#555] text-left transition-colors"
                    >
                      <span className="text-lg">{country.flag}</span>
                      <span className="text-white text-sm">{country.name}</span>
                      <span className="text-gray-400 text-sm ml-auto">{country.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

     
            {/* Код и Телефон в одну строку */}
<div className="flex gap-4">
  <div className="w-1/4">
    <label className="block text-xs text-gray-300 mb-1 uppercase tracking-wide">Код</label>
    <div className="text-white text-sm border-b border-gray-400 pb-2">
      {formData.country_code}
    </div>
  </div>
  <div className="w-3/4">
    <label className="block text-xs text-gray-300 mb-1 uppercase tracking-wide">Номер телефона</label>
    <input
  name="phone"
  type="tel"
  value={formatPhone(formData.phone)}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, phone: digits });
  }}
  className="w-full bg-transparent text-white text-sm border-b border-gray-400 focus:border-blue-400 focus:outline-none pb-2 transition-colors placeholder-gray-400"
  placeholder="904 015 87 17"
  required
/>
  </div>
</div>

            {/* Пароль */}
            <div>
              <label className="block text-xs text-gray-300 mb-1 uppercase tracking-wide">Пароль</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-[#e8eef7] text-black text-sm border-b border-gray-400 focus:border-blue-400 focus:outline-none pb-2 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Поля для регистрации */}
            {!isLogin && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs text-gray-300 mb-1 uppercase tracking-wide">Ваше имя</label>
                  <input
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full bg-transparent text-white text-sm border-b border-gray-400 focus:border-blue-400 focus:outline-none pb-2 transition-colors placeholder-gray-400"
                    placeholder="Иван Иванов"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1 uppercase tracking-wide">Имя пользователя</label>
                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-transparent text-white text-sm border-b border-gray-400 focus:border-blue-400 focus:outline-none pb-2 transition-colors placeholder-gray-400"
                    placeholder="@username"
                    required
                  />
                </div>
              </div>
            )}

            {/* ✅ КНОПКИ (одинаковый стиль) */}
            <div className="flex items-center justify-between mt-8 pt-2">
              <button
                type="button"
                className="bg-[#444] hover:bg-[#555] text-gray-300 text-sm px-4 py-2 rounded transition-colors"
              >
                или войти по QR-code
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-[#444] hover:bg-[#555] text-white text-sm font-semibold px-8 py-2 rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'Загрузка...' : 'Далее'}
              </button>
            </div>
          </form>

          {/* Переключатель */}
          <div className="mt-8 text-center">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 text-sm hover:text-blue-300 hover:underline transition-colors"
            >
              {isLogin ? 'Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;