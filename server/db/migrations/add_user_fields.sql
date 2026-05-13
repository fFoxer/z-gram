-- Добавляем новые поля в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(5) DEFAULT '+7',
ADD COLUMN IF NOT EXISTS full_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);