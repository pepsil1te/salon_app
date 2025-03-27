-- Вставка тестовых данных в таблицу салонов
INSERT INTO salons (name, address, contact_info, working_hours, status, image_url, description)
VALUES
  ('Салон Красоты "Элегант"', 'ул. Центральная, 123', 
   '{"phone": "+7 (999) 123-45-67", "email": "elegant@example.com"}',
   '{"monday": {"start": "09:00", "end": "20:00"}, 
     "tuesday": {"start": "09:00", "end": "20:00"}, 
     "wednesday": {"start": "09:00", "end": "20:00"}, 
     "thursday": {"start": "09:00", "end": "20:00"}, 
     "friday": {"start": "09:00", "end": "20:00"}, 
     "saturday": {"start": "10:00", "end": "18:00"}, 
     "sunday": {"start": "10:00", "end": "16:00"}}',
   'active', 'https://example.com/salon1.jpg', 'Премиум салон красоты в центре города'),
  ('Спа-Салон "Релакс"', 'ул. Морская, 45', 
   '{"phone": "+7 (999) 987-65-43", "email": "relax@example.com"}',
   '{"monday": {"start": "10:00", "end": "21:00"}, 
     "tuesday": {"start": "10:00", "end": "21:00"}, 
     "wednesday": {"start": "10:00", "end": "21:00"}, 
     "thursday": {"start": "10:00", "end": "21:00"}, 
     "friday": {"start": "10:00", "end": "22:00"}, 
     "saturday": {"start": "11:00", "end": "22:00"}, 
     "sunday": {"start": "11:00", "end": "20:00"}}',
   'active', 'https://example.com/salon2.jpg', 'Спа-салон с полным спектром услуг')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    address = EXCLUDED.address,
    contact_info = EXCLUDED.contact_info,
    working_hours = EXCLUDED.working_hours,
    status = EXCLUDED.status,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description;

-- Вставка тестовых данных в таблицу услуг
INSERT INTO services (salon_id, name, description, duration, price, category, is_active)
VALUES
  (1, 'Стрижка женская', 'Модельная женская стрижка любой сложности', 60, 1500.00, 'Парикмахерские услуги', true),
  (1, 'Маникюр классический', 'Обработка ногтей и покрытие лаком', 45, 800.00, 'Ногтевой сервис', true),
  (1, 'Массаж лица', 'Расслабляющий массаж для лица', 30, 1200.00, 'Косметология', true),
  (2, 'Спа-программа "Релакс"', 'Полная спа-программа для тела', 120, 4500.00, 'Спа-процедуры', true),
  (2, 'Педикюр', 'Полный уход за ногами', 60, 1200.00, 'Ногтевой сервис', true),
  (2, 'Стрижка мужская', 'Модельная мужская стрижка', 30, 1000.00, 'Парикмахерские услуги', true)
ON CONFLICT (id) DO UPDATE
SET salon_id = EXCLUDED.salon_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration = EXCLUDED.duration,
    price = EXCLUDED.price,
    category = EXCLUDED.category,
    is_active = EXCLUDED.is_active;

-- Вставка тестовых данных в таблицу сотрудников
INSERT INTO employees (salon_id, name, first_name, last_name, role, position, contact_info, working_hours, is_active)
VALUES
  (1, 'Анна Иванова', 'Анна', 'Иванова', 'employee', 'Старший парикмахер',
   '{"phone": "+7 (999) 111-22-33", "email": "anna@example.com"}',
   '{"monday": {"start": "09:00", "end": "18:00"}, 
     "tuesday": {"start": "09:00", "end": "18:00"}, 
     "wednesday": {"start": "09:00", "end": "18:00"}, 
     "thursday": {"start": "09:00", "end": "18:00"}, 
     "friday": {"start": "09:00", "end": "18:00"}, 
     "saturday": {"start": "10:00", "end": "16:00"}, 
     "sunday": null}',
   true),
  (1, 'Елена Петрова', 'Елена', 'Петрова', 'employee', 'Мастер маникюра',
   '{"phone": "+7 (999) 222-33-44", "email": "elena@example.com"}',
   '{"monday": {"start": "10:00", "end": "19:00"}, 
     "tuesday": {"start": "10:00", "end": "19:00"}, 
     "wednesday": {"start": "10:00", "end": "19:00"}, 
     "thursday": {"start": "10:00", "end": "19:00"}, 
     "friday": {"start": "10:00", "end": "19:00"}, 
     "saturday": null, 
     "sunday": {"start": "11:00", "end": "16:00"}}',
   true),
  (2, 'Марина Сидорова', 'Марина', 'Сидорова', 'employee', 'Косметолог',
   '{"phone": "+7 (999) 333-44-55", "email": "marina@example.com"}',
   '{"monday": {"start": "11:00", "end": "20:00"}, 
     "tuesday": {"start": "11:00", "end": "20:00"}, 
     "wednesday": null, 
     "thursday": {"start": "11:00", "end": "20:00"}, 
     "friday": {"start": "11:00", "end": "20:00"}, 
     "saturday": {"start": "11:00", "end": "18:00"}, 
     "sunday": null}',
   true),
  (2, 'Олег Кузнецов', 'Олег', 'Кузнецов', 'employee', 'Массажист',
   '{"phone": "+7 (999) 444-55-66", "email": "oleg@example.com"}',
   '{"monday": null, 
     "tuesday": {"start": "10:00", "end": "21:00"}, 
     "wednesday": {"start": "10:00", "end": "21:00"}, 
     "thursday": {"start": "10:00", "end": "21:00"}, 
     "friday": {"start": "10:00", "end": "21:00"}, 
     "saturday": {"start": "11:00", "end": "16:00"}, 
     "sunday": {"start": "11:00", "end": "16:00"}}',
   true),
  (1, 'Администратор', 'Администратор', 'Системы', 'admin', 'Администратор',
   '{"phone": "+7 (999) 999-99-99", "email": "admin@example.com"}',
   '{"monday": {"start": "09:00", "end": "18:00"}, 
     "tuesday": {"start": "09:00", "end": "18:00"}, 
     "wednesday": {"start": "09:00", "end": "18:00"}, 
     "thursday": {"start": "09:00", "end": "18:00"}, 
     "friday": {"start": "09:00", "end": "18:00"}, 
     "saturday": null, 
     "sunday": null}',
   true)
ON CONFLICT (id) DO UPDATE
SET salon_id = EXCLUDED.salon_id,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    position = EXCLUDED.position,
    contact_info = EXCLUDED.contact_info,
    working_hours = EXCLUDED.working_hours,
    is_active = EXCLUDED.is_active;

-- Вставка тестовых данных в таблицу связей сотрудников и услуг
INSERT INTO employee_services (employee_id, service_id)
VALUES
  (1, 1),  -- Анна Иванова - Стрижка женская
  (2, 2),  -- Елена Петрова - Маникюр классический
  (3, 3),  -- Марина Сидорова - Массаж лица
  (3, 4),  -- Марина Сидорова - Спа-программа "Релакс"
  (4, 4),  -- Олег Кузнецов - Спа-программа "Релакс"
  (2, 5),  -- Елена Петрова - Педикюр
  (1, 6)   -- Анна Иванова - Стрижка мужская
ON CONFLICT DO NOTHING;

-- Вставка тестовых данных в таблицу клиентов
INSERT INTO clients (name, first_name, last_name, contact_info, birth_date)
VALUES
  ('Дмитрий Смирнов', 'Дмитрий', 'Смирнов', '{"phone": "+7 (999) 555-66-77", "email": "dmitry@example.com"}', '1985-05-15'),
  ('Ольга Козлова', 'Ольга', 'Козлова', '{"phone": "+7 (999) 666-77-88", "email": "olga@example.com"}', '1990-10-20'),
  ('Алексей Соколов', 'Алексей', 'Соколов', '{"phone": "+7 (999) 777-88-99", "email": "alex@example.com"}', '1982-03-08'),
  ('Ирина Новикова', 'Ирина', 'Новикова', '{"phone": "+7 (999) 888-99-00", "email": "irina@example.com"}', '1995-12-25')
ON CONFLICT DO NOTHING;

-- Вставка тестовых данных в таблицу записей на прием
-- Добавляем записи за последние 30 дней для показа статистики
INSERT INTO appointments (client_id, employee_id, service_id, salon_id, date_time, status, notes)
VALUES
  -- Завершенные записи в прошлом
  (1, 1, 1, 1, CURRENT_DATE - INTERVAL '25 days' + TIME '14:00', 'completed', 'Клиент доволен'),
  (2, 2, 2, 1, CURRENT_DATE - INTERVAL '20 days' + TIME '11:30', 'completed', 'Все прошло хорошо'),
  (3, 3, 3, 2, CURRENT_DATE - INTERVAL '18 days' + TIME '16:00', 'completed', 'Клиент очень доволен'),
  (4, 4, 4, 2, CURRENT_DATE - INTERVAL '15 days' + TIME '15:00', 'completed', 'Рекомендована повторная процедура'),
  (1, 2, 5, 2, CURRENT_DATE - INTERVAL '14 days' + TIME '13:00', 'completed', 'Клиент доволен'),
  (2, 1, 6, 1, CURRENT_DATE - INTERVAL '12 days' + TIME '17:30', 'completed', 'Все прошло хорошо'),
  (3, 3, 4, 2, CURRENT_DATE - INTERVAL '10 days' + TIME '12:00', 'completed', 'Клиент очень доволен'),
  (4, 1, 1, 1, CURRENT_DATE - INTERVAL '7 days' + TIME '10:00', 'completed', 'Рекомендована укладка'),
  
  -- Отмененные записи
  (1, 3, 3, 2, CURRENT_DATE - INTERVAL '9 days' + TIME '11:00', 'cancelled', 'Клиент заболел'),
  (2, 4, 4, 2, CURRENT_DATE - INTERVAL '6 days' + TIME '16:30', 'cancelled', 'Перенесена на следующую неделю'),
  
  -- Подтвержденные записи в будущем
  (3, 2, 2, 1, CURRENT_DATE + INTERVAL '2 days' + TIME '14:30', 'confirmed', 'Предпочитает гель-лак'),
  (4, 1, 6, 1, CURRENT_DATE + INTERVAL '3 days' + TIME '11:00', 'confirmed', 'Короткая стрижка'),
  
  -- Ожидающие подтверждения записи
  (1, 4, 4, 2, CURRENT_DATE + INTERVAL '5 days' + TIME '17:00', 'pending', 'Нужен предварительный звонок'),
  (2, 3, 3, 2, CURRENT_DATE + INTERVAL '7 days' + TIME '15:30', 'pending', '')
ON CONFLICT DO NOTHING; 