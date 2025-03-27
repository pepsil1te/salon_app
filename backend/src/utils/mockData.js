/**
 * Централизованное хранилище мок-данных для использования в API
 * при отсутствии данных в базе данных или для тестирования
 */

// Салоны
const mockSalons = [
  {
    id: 1,
    name: 'Салон красоты "Элегант"',
    address: 'ул. Пушкина, д. 10, Москва',
    contact_info: {
      phone: '+7 (495) 123-45-67',
      email: 'info@elegant-salon.ru',
      website: 'www.elegant-salon.ru'
    },
    working_hours: {
      '1': { start: '09:00', end: '20:00' },
      '2': { start: '09:00', end: '20:00' },
      '3': { start: '09:00', end: '20:00' },
      '4': { start: '09:00', end: '20:00' },
      '5': { start: '09:00', end: '20:00' },
      '6': { start: '10:00', end: '18:00' }
    },
    status: 'active',
    image_url: '/images/salons/elegant.jpg',
    description: 'Современный салон красоты с полным спектром услуг'
  },
  {
    id: 2,
    name: 'Барбершоп "Бородач"',
    address: 'ул. Лермонтова, д. 5, Москва',
    contact_info: {
      phone: '+7 (495) 987-65-43',
      email: 'info@borodach.ru',
      website: 'www.borodach.ru'
    },
    working_hours: {
      '1': { start: '10:00', end: '19:00' },
      '2': { start: '10:00', end: '19:00' },
      '3': { start: '10:00', end: '19:00' },
      '4': { start: '10:00', end: '19:00' },
      '5': { start: '10:00', end: '19:00' },
      '6': { start: '11:00', end: '16:00' }
    },
    status: 'active',
    image_url: '/images/salons/borodach.jpg',
    description: 'Стильный барбершоп для настоящих мужчин'
  },
  {
    id: 3,
    name: 'Салон "Ноготок"',
    address: 'ул. Гоголя, д. 15, Москва',
    contact_info: {
      phone: '+7 (495) 111-22-33',
      email: 'info@nogotok.ru',
      website: 'www.nogotok.ru'
    },
    working_hours: {
      '1': { start: '10:00', end: '20:00' },
      '2': { start: '10:00', end: '20:00' },
      '3': { start: '10:00', end: '20:00' },
      '4': { start: '10:00', end: '20:00' },
      '5': { start: '10:00', end: '20:00' },
      '6': { start: '10:00', end: '18:00' },
      '0': { start: '10:00', end: '16:00' }
    },
    status: 'active',
    image_url: '/images/salons/nogotok.jpg',
    description: 'Специализированный салон маникюра и педикюра'
  }
];

// Услуги
const mockServices = [
  {
    id: 1,
    name: 'Женская стрижка',
    category: 'Волосы',
    price: 1500,
    duration: 60,
    description: 'Профессиональная женская стрижка с учетом типа волос и формы лица',
    salon_id: 1,
    active: true,
    image_url: '/images/services/haircut.jpg'
  },
  {
    id: 2,
    name: 'Маникюр',
    category: 'Ногти',
    price: 1200,
    duration: 45,
    description: 'Маникюр с покрытием гель-лаком',
    salon_id: 1,
    active: true,
    image_url: '/images/services/manicure.jpg'
  },
  {
    id: 3,
    name: 'Окрашивание волос',
    category: 'Волосы',
    price: 3000,
    duration: 120,
    description: 'Окрашивание волос любой сложности',
    salon_id: 2,
    active: true,
    image_url: '/images/services/coloring.jpg'
  },
  {
    id: 4,
    name: 'Мужская стрижка',
    category: 'Волосы',
    price: 1000,
    duration: 30,
    description: 'Стильная мужская стрижка',
    salon_id: 2,
    active: true,
    image_url: '/images/services/menscut.jpg'
  },
  {
    id: 5,
    name: 'Наращивание ногтей',
    category: 'Ногти',
    price: 2500,
    duration: 120,
    description: 'Наращивание ногтей гелем',
    salon_id: 3,
    active: true,
    image_url: '/images/services/nails.jpg'
  }
];

// Сотрудники
const mockEmployees = [
  {
    id: 1,
    first_name: 'Анна',
    last_name: 'Иванова',
    email: 'anna@example.com',
    phone: '+7 (999) 123-45-67',
    position: 'Старший парикмахер',
    salon_id: 1,
    is_active: true,
    service_ids: [1, 3],
    service_names: ['Женская стрижка', 'Окрашивание волос'],
    photo_url: 'https://i.pravatar.cc/150?img=1',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    working_hours: {
      "1": {"start": "09:00", "end": "18:00"},
      "2": {"start": "09:00", "end": "18:00"},
      "3": {"start": "09:00", "end": "18:00"},
      "4": {"start": "09:00", "end": "18:00"},
      "5": {"start": "09:00", "end": "18:00"}
    }
  },
  {
    id: 2,
    first_name: 'Михаил',
    last_name: 'Петров',
    email: 'mikhail@example.com',
    phone: '+7 (999) 765-43-21',
    position: 'Барбер',
    salon_id: 2,
    is_active: true,
    service_ids: [4],
    service_names: ['Мужская стрижка'],
    photo_url: 'https://i.pravatar.cc/150?img=3',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    working_hours: {
      "1": {"start": "10:00", "end": "19:00"},
      "2": {"start": "10:00", "end": "19:00"},
      "3": {"start": "10:00", "end": "19:00"},
      "4": {"start": "10:00", "end": "19:00"},
      "5": {"start": "10:00", "end": "19:00"},
      "6": {"start": "11:00", "end": "16:00"}
    }
  },
  {
    id: 3,
    first_name: 'Елена',
    last_name: 'Смирнова',
    email: 'elena@example.com',
    phone: '+7 (999) 111-22-33',
    position: 'Мастер маникюра',
    salon_id: 1,
    is_active: true,
    service_ids: [2],
    service_names: ['Маникюр'],
    photo_url: 'https://i.pravatar.cc/150?img=5',
    created_at: '2023-01-03T00:00:00Z',
    updated_at: '2023-01-03T00:00:00Z',
    working_hours: {
      "1": {"start": "10:00", "end": "19:00"},
      "3": {"start": "10:00", "end": "19:00"},
      "5": {"start": "10:00", "end": "19:00"}
    }
  }
];

// Записи
const mockAppointments = [
  {
    id: 1,
    client_id: 1,
    client_name: 'Анна Смирнова',
    service_id: 1,
    service_name: 'Женская стрижка',
    salon_id: 1,
    salon_name: 'Салон красоты "Элегант"',
    salon_address: 'ул. Пушкина, д. 10',
    employee_id: 1,
    date_time: '2023-10-01T13:00:00Z',
    duration: 60,
    price: 1500,
    status: 'pending',
    notes: 'Постоянный клиент',
    client_contact: '+7 (999) 123-45-67'
  },
  {
    id: 2,
    client_id: 2,
    client_name: 'Ольга Петрова',
    service_id: 2,
    service_name: 'Маникюр',
    salon_id: 1,
    salon_name: 'Салон красоты "Элегант"',
    salon_address: 'ул. Пушкина, д. 10',
    employee_id: 3,
    date_time: '2023-10-01T15:00:00Z',
    duration: 45,
    price: 800,
    status: 'completed',
    notes: 'Клиент предпочитает светлые тона',
    client_contact: '+7 (999) 987-65-43'
  },
  {
    id: 3,
    client_id: 3,
    client_name: 'Иван Иванов',
    service_id: 4,
    service_name: 'Мужская стрижка',
    salon_id: 2,
    salon_name: 'Барбершоп "Бородач"',
    salon_address: 'ул. Лермонтова, д. 5',
    employee_id: 2,
    date_time: '2023-10-01T17:00:00Z',
    duration: 30,
    price: 1000,
    status: 'cancelled',
    notes: '',
    cancel_reason: 'Клиент не смог прийти',
    client_contact: '+7 (999) 555-55-55'
  }
];

/**
 * Генерирует тестовые данные о производительности сотрудника
 * @param {number} employeeId ID сотрудника
 * @param {string} startDate Дата начала (YYYY-MM-DD)
 * @param {string} endDate Дата окончания (YYYY-MM-DD)
 * @returns {Object} Объект с производительностью
 */
function generateMockPerformanceData(employeeId, startDate, endDate) {
  if (!startDate || !endDate) {
    startDate = '2023-09-01';
    endDate = '2023-09-30';
  }
  
  // Create dummy data for summary stats
  const totalAppointments = Math.floor(Math.random() * 50) + 20;
  const completedAppointments = Math.floor(totalAppointments * 0.8);
  const cancelledAppointments = Math.floor(totalAppointments * 0.1);
  const totalRevenue = completedAppointments * (Math.floor(Math.random() * 50) + 50);
  
  // Create dummy data for service breakdown
  const services = [
    {
      name: 'Женская стрижка',
      appointment_count: Math.floor(Math.random() * 15) + 5,
      revenue: Math.floor(Math.random() * 500) + 200
    },
    {
      name: 'Окрашивание волос',
      appointment_count: Math.floor(Math.random() * 10) + 3,
      revenue: Math.floor(Math.random() * 800) + 300
    },
    {
      name: 'Мужская стрижка',
      appointment_count: Math.floor(Math.random() * 8) + 2,
      revenue: Math.floor(Math.random() * 400) + 150
    },
    {
      name: 'Маникюр',
      appointment_count: Math.floor(Math.random() * 6) + 1,
      revenue: Math.floor(Math.random() * 200) + 100
    }
  ];
  
  // Create dummy data for daily stats
  const daily = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Skip weekends for more realistic data
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    const appointmentCount = Math.floor(Math.random() * 5) + 1;
    const revenue = appointmentCount * (Math.floor(Math.random() * 60) + 40);
    
    daily.push({
      date: d.toISOString().split('T')[0],
      appointment_count: appointmentCount,
      revenue: revenue
    });
  }
  
  return {
    summary: {
      total_appointments: totalAppointments,
      completed_appointments: completedAppointments,
      cancelled_appointments: cancelledAppointments,
      total_revenue: totalRevenue
    },
    services: services,
    daily: daily
  };
}

// Данные для отчетов
const mockReportData = {
  totalRevenue: 450000,
  totalAppointments: 256,
  thisMonthRevenue: 145000,
  thisMonthAppointments: 78,
  activeEmployees: 12,
  totalServices: 45,
  popularServices: [
    { name: 'Женская стрижка', count: 43, revenue: 64500 },
    { name: 'Маникюр', count: 36, revenue: 43200 },
    { name: 'Окрашивание волос', count: 28, revenue: 84000 },
    { name: 'Мужская стрижка', count: 22, revenue: 22000 },
    { name: 'Педикюр', count: 18, revenue: 27000 }
  ],
  revenueByDay: [
    { date: '2023-05-01', amount: 12000 },
    { date: '2023-05-02', amount: 15400 },
    { date: '2023-05-03', amount: 9800 },
    { date: '2023-05-04', amount: 11200 },
    { date: '2023-05-05', amount: 16500 },
    { date: '2023-05-06', amount: 21000 },
    { date: '2023-05-07', amount: 18000 }
  ],
  topEmployees: [
    { name: 'Анна Иванова', appointments: 32, revenue: 48000 },
    { name: 'Михаил Петров', appointments: 28, revenue: 42000 },
    { name: 'Елена Смирнова', appointments: 25, revenue: 37500 },
    { name: 'Ольга Козлова', appointments: 22, revenue: 33000 },
    { name: 'Дмитрий Соколов', appointments: 19, revenue: 28500 }
  ]
};

module.exports = {
  mockSalons,
  mockServices,
  mockEmployees,
  mockAppointments,
  mockReportData,
  generateMockPerformanceData
}; 