-- Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on employee_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_employee_id ON reviews(employee_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add sample data
INSERT INTO reviews (appointment_id, client_id, employee_id, service_id, rating, comment)
SELECT 
    a.id,
    a.client_id,
    a.employee_id,
    a.service_id,
    FLOOR(RANDOM() * 3) + 3, -- Random rating between 3-5
    CASE FLOOR(RANDOM() * 4)
        WHEN 0 THEN 'Отличный сервис, очень доволен(а)!'
        WHEN 1 THEN 'Профессиональный подход, рекомендую!'
        WHEN 2 THEN 'Всё было хорошо, приду ещё.'
        WHEN 3 THEN 'Качественная работа, спасибо!'
    END
FROM appointments a
WHERE a.status = 'completed'
AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.appointment_id = a.id)
LIMIT 20; 