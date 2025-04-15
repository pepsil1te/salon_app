-- =============================================
-- ПОЛНЫЙ СКРИПТ ИНИЦИАЛИЗАЦИИ БАЗЫ ДАННЫХ
-- =============================================

-- ЧАСТЬ 1: СОЗДАНИЕ ТИПОВ
-- =============================================

-- Создание необходимых типов перечислений
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'employee', 'client');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
    END IF;
END$$;

-- ЧАСТЬ 2: СОЗДАНИЕ ОСНОВНЫХ ТАБЛИЦ
-- =============================================

-- Создание таблицы салонов
CREATE TABLE IF NOT EXISTS salons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    contact_info JSONB NOT NULL,
    working_hours JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    image_url TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы услуг
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    salon_id INTEGER REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- в минутах
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы категорий услуг
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    salon_id INTEGER REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#3f51b5',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for service categories
CREATE INDEX IF NOT EXISTS idx_service_categories_salon_id ON service_categories(salon_id);

-- Создание таблицы сотрудников
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    salon_id INTEGER REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    position VARCHAR(100),
    contact_info JSONB NOT NULL,
    working_hours JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы клиентов
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    contact_info JSONB NOT NULL,
    birth_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы записей на прием
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    salon_id INTEGER REFERENCES salons(id) ON DELETE CASCADE,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы отзывов
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    salon_id INTEGER REFERENCES salons(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы связи сотрудников и услуг (многие ко многим)
CREATE TABLE IF NOT EXISTS employee_services (
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (employee_id, service_id)
);

-- ЧАСТЬ 3: СОЗДАНИЕ ТАБЛИЦ СТАТИСТИКИ
-- =============================================

-- Таблица для отслеживания статистики записей
CREATE TABLE IF NOT EXISTS appointment_statistics (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER,
    salon_id INTEGER,
    service_id INTEGER,
    employee_id INTEGER,
    date_time TIMESTAMP WITH TIME ZONE,
    status appointment_status,
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action_type VARCHAR(20) NOT NULL
);

-- Таблица для финансовой статистики
CREATE TABLE IF NOT EXISTS financial_statistics (
    id SERIAL PRIMARY KEY,
    salon_id INTEGER,
    date DATE NOT NULL,
    revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    appointments_count INTEGER NOT NULL DEFAULT 0,
    completed_count INTEGER NOT NULL DEFAULT 0,
    cancelled_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для статистики по услугам
CREATE TABLE IF NOT EXISTS service_statistics (
    id SERIAL PRIMARY KEY,
    service_id INTEGER,
    salon_id INTEGER,
    date DATE NOT NULL,
    booking_count INTEGER NOT NULL DEFAULT 0,
    revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для статистики по сотрудникам
CREATE TABLE IF NOT EXISTS employee_statistics (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER,
    salon_id INTEGER,
    date DATE NOT NULL,
    booking_count INTEGER NOT NULL DEFAULT 0,
    revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица бонусных баллов клиентов
CREATE TABLE IF NOT EXISTS client_bonuses (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    source VARCHAR(100) NOT NULL, -- appointment, referral, promotion, etc.
    source_id INTEGER, -- id of the appointment, promotion, etc.
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица избранных салонов клиента
CREATE TABLE IF NOT EXISTS favorite_salons (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    salon_id INTEGER REFERENCES salons(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, salon_id)
);

-- ЧАСТЬ 4: СОЗДАНИЕ ИНДЕКСОВ
-- =============================================

-- Индексы для основных таблиц
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_employees_salon_id ON employees(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_employee_id ON appointments(employee_id);
CREATE INDEX IF NOT EXISTS idx_appointments_salon_id ON appointments(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_salon_id ON reviews(salon_id);
CREATE INDEX IF NOT EXISTS idx_reviews_appointment_id ON reviews(appointment_id);

-- Индексы для таблиц статистики
CREATE INDEX IF NOT EXISTS idx_appointment_statistics_appointment_id ON appointment_statistics(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_statistics_salon_id ON appointment_statistics(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointment_statistics_service_id ON appointment_statistics(service_id);
CREATE INDEX IF NOT EXISTS idx_appointment_statistics_employee_id ON appointment_statistics(employee_id);
CREATE INDEX IF NOT EXISTS idx_appointment_statistics_date_time ON appointment_statistics(date_time);
CREATE INDEX IF NOT EXISTS idx_appointment_statistics_status ON appointment_statistics(status);

CREATE INDEX IF NOT EXISTS idx_financial_statistics_salon_id ON financial_statistics(salon_id);
CREATE INDEX IF NOT EXISTS idx_financial_statistics_date ON financial_statistics(date);

CREATE INDEX IF NOT EXISTS idx_service_statistics_service_id ON service_statistics(service_id);
CREATE INDEX IF NOT EXISTS idx_service_statistics_salon_id ON service_statistics(salon_id);
CREATE INDEX IF NOT EXISTS idx_service_statistics_date ON service_statistics(date);

CREATE INDEX IF NOT EXISTS idx_employee_statistics_employee_id ON employee_statistics(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_statistics_salon_id ON employee_statistics(salon_id);
CREATE INDEX IF NOT EXISTS idx_employee_statistics_date ON employee_statistics(date);

-- Индексы для таблиц клиентских данных
CREATE INDEX IF NOT EXISTS idx_client_bonuses_client_id ON client_bonuses(client_id);
CREATE INDEX IF NOT EXISTS idx_client_bonuses_source ON client_bonuses(source);

CREATE INDEX IF NOT EXISTS idx_favorite_salons_client_id ON favorite_salons(client_id);
CREATE INDEX IF NOT EXISTS idx_favorite_salons_salon_id ON favorite_salons(salon_id);

-- ЧАСТЬ 5: СОЗДАНИЕ ФУНКЦИЙ И ТРИГГЕРОВ
-- =============================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для обновления updated_at
DROP TRIGGER IF EXISTS update_salons_updated_at ON salons;
CREATE TRIGGER update_salons_updated_at
BEFORE UPDATE ON salons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Функция для извлечения телефона из contact_info
CREATE OR REPLACE FUNCTION get_phone_from_contact_info(contact_info JSONB) RETURNS TEXT AS $$
BEGIN
    RETURN contact_info->>'phone';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Уникальный индекс для телефонов сотрудников
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_employees_phone_unique'
    ) THEN
        CREATE UNIQUE INDEX idx_employees_phone_unique 
        ON employees (get_phone_from_contact_info(contact_info))
        WHERE is_active = true;
    END IF;
END
$$;

-- Уникальный индекс для телефонов клиентов
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_clients_phone_unique'
    ) THEN
        CREATE UNIQUE INDEX idx_clients_phone_unique 
        ON clients (get_phone_from_contact_info(contact_info));
    END IF;
END
$$;

-- ЧАСТЬ 6: ТРИГГЕРЫ ДЛЯ СТАТИСТИКИ
-- =============================================

-- Функция для добавления записи в таблицу статистики
CREATE OR REPLACE FUNCTION add_to_appointment_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO appointment_statistics (
        appointment_id, salon_id, service_id, employee_id, date_time, status, action_type
    ) VALUES (
        NEW.id, NEW.salon_id, NEW.service_id, NEW.employee_id, NEW.date_time, NEW.status, 'INSERT'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для добавления записи в таблицу статистики при создании записи
DROP TRIGGER IF EXISTS appointment_insert_statistics_trigger ON appointments;
CREATE TRIGGER appointment_insert_statistics_trigger
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION add_to_appointment_statistics();

-- Функция для обновления статистики при изменении статуса записи
CREATE OR REPLACE FUNCTION update_appointment_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Добавляем запись в таблицу статистики при изменении статуса
    INSERT INTO appointment_statistics (
        appointment_id, salon_id, service_id, employee_id, date_time, status, action_type
    ) VALUES (
        NEW.id, NEW.salon_id, NEW.service_id, NEW.employee_id, NEW.date_time, NEW.status, 'UPDATE'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления статистики при изменении статуса записи
DROP TRIGGER IF EXISTS appointment_update_statistics_trigger ON appointments;
CREATE TRIGGER appointment_update_statistics_trigger
AFTER UPDATE ON appointments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_appointment_statistics();

-- Функция для обновления финансовой статистики
CREATE OR REPLACE FUNCTION update_financial_statistics()
RETURNS TRIGGER AS $$
DECLARE
    appointment_date DATE;
    salon_id_val INTEGER;
BEGIN
    appointment_date := DATE(NEW.date_time);
    salon_id_val := NEW.salon_id;
    
    -- Обновляем финансовую статистику на основе статуса
    IF NEW.status IN ('completed', 'cancelled') THEN
        -- Проверяем существование записи
        IF EXISTS (
            SELECT 1 FROM financial_statistics
            WHERE salon_id = salon_id_val AND date = appointment_date
        ) THEN
            -- Обновляем существующую запись
            UPDATE financial_statistics SET
                revenue = CASE 
                    WHEN NEW.status = 'completed' THEN revenue + (SELECT price FROM services WHERE id = NEW.service_id)
                    ELSE revenue
                END,
                appointments_count = CASE 
                    WHEN NEW.status = 'completed' THEN appointments_count + 1
                    ELSE appointments_count
                END,
                completed_count = CASE 
                    WHEN NEW.status = 'completed' THEN completed_count + 1
                    ELSE completed_count
                END,
                cancelled_count = CASE 
                    WHEN NEW.status = 'cancelled' THEN cancelled_count + 1
                    ELSE cancelled_count
                END
            WHERE salon_id = salon_id_val AND date = appointment_date;
        ELSE
            -- Создаем новую запись
            INSERT INTO financial_statistics (
                salon_id, date, revenue, appointments_count, completed_count, cancelled_count
            )
            VALUES (
                salon_id_val,
                appointment_date,
                CASE WHEN NEW.status = 'completed' THEN (SELECT price FROM services WHERE id = NEW.service_id) ELSE 0 END,
                CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
                CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
                CASE WHEN NEW.status = 'cancelled' THEN 1 ELSE 0 END
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления финансовой статистики
DROP TRIGGER IF EXISTS appointment_financial_statistics_trigger ON appointments;
CREATE TRIGGER appointment_financial_statistics_trigger
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW
WHEN (NEW.status IN ('completed', 'cancelled'))
EXECUTE FUNCTION update_financial_statistics();

-- Функция для обновления статистики услуг
CREATE OR REPLACE FUNCTION update_service_statistics()
RETURNS TRIGGER AS $$
DECLARE
    appointment_date DATE;
    salon_id_val INTEGER;
    service_id_val INTEGER;
BEGIN
    appointment_date := DATE(NEW.date_time);
    salon_id_val := NEW.salon_id;
    service_id_val := NEW.service_id;
    
    -- Если статус "completed", обновляем статистику услуг
    IF NEW.status = 'completed' THEN
        -- Проверяем существует ли запись для этой услуги, салона и даты
        IF EXISTS (
            SELECT 1 FROM service_statistics
            WHERE service_id = service_id_val AND salon_id = salon_id_val AND date = appointment_date
        ) THEN
            -- Обновляем существующую запись
            UPDATE service_statistics SET
                booking_count = booking_count + 1,
                revenue = revenue + (SELECT price FROM services WHERE id = service_id_val)
            WHERE service_id = service_id_val AND salon_id = salon_id_val AND date = appointment_date;
        ELSE
            -- Создаем новую запись
            INSERT INTO service_statistics (
                service_id, salon_id, date, booking_count, revenue
            )
            VALUES (
                service_id_val,
                salon_id_val,
                appointment_date,
                1,
                (SELECT price FROM services WHERE id = service_id_val)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления статистики услуг
DROP TRIGGER IF EXISTS appointment_service_statistics_trigger ON appointments;
CREATE TRIGGER appointment_service_statistics_trigger
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_service_statistics();

-- Функция для обновления статистики сотрудников
CREATE OR REPLACE FUNCTION update_employee_statistics()
RETURNS TRIGGER AS $$
DECLARE
    appointment_date DATE;
    salon_id_val INTEGER;
    employee_id_val INTEGER;
BEGIN
    appointment_date := DATE(NEW.date_time);
    salon_id_val := NEW.salon_id;
    employee_id_val := NEW.employee_id;
    
    -- Если статус "completed", обновляем статистику сотрудников
    IF NEW.status = 'completed' THEN
        -- Проверяем существует ли запись для этого сотрудника, салона и даты
        IF EXISTS (
            SELECT 1 FROM employee_statistics
            WHERE employee_id = employee_id_val AND salon_id = salon_id_val AND date = appointment_date
        ) THEN
            -- Обновляем существующую запись
            UPDATE employee_statistics SET
                booking_count = booking_count + 1,
                revenue = revenue + (SELECT price FROM services WHERE id = NEW.service_id)
            WHERE employee_id = employee_id_val AND salon_id = salon_id_val AND date = appointment_date;
        ELSE
            -- Создаем новую запись
            INSERT INTO employee_statistics (
                employee_id, salon_id, date, booking_count, revenue
            )
            VALUES (
                employee_id_val,
                salon_id_val,
                appointment_date,
                1,
                (SELECT price FROM services WHERE id = NEW.service_id)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления статистики сотрудников
DROP TRIGGER IF EXISTS appointment_employee_statistics_trigger ON appointments;
CREATE TRIGGER appointment_employee_statistics_trigger
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_employee_statistics(); 