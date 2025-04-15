-- Удаление столбца name из таблицы employees
ALTER TABLE employees DROP COLUMN IF EXISTS name;

-- Удаление столбца name из таблицы clients
ALTER TABLE clients DROP COLUMN IF EXISTS name; 