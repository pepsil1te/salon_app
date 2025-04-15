/**
 * Мок-данные для разработки при недоступности API
 */
export const mockData = {
  // Услуги сотрудника
  employeeServices: [
    { 
      id: 1, 
      name: 'Стрижка женская', 
      category: 'Волосы', 
      price: 2000, 
      duration: 60,
      active: true,
      description: 'Стрижка, укладка и консультация по уходу за волосами'
    },
    { 
      id: 3, 
      name: 'Окрашивание', 
      category: 'Волосы', 
      price: 4000, 
      duration: 120,
      active: true,
      description: 'Окрашивание волос любой сложности'
    },
    { 
      id: 4, 
      name: 'Массаж лица', 
      category: 'Косметология', 
      price: 2500, 
      duration: 40,
      active: true, 
      description: 'Расслабляющий и омолаживающий массаж лица'
    }
  ],
  
  // Доступные услуги салона
  salonServices: [
    { 
      id: 1, 
      name: 'Стрижка женская', 
      category: 'Волосы', 
      price: 2000, 
      duration: 60,
      active: true,
      description: 'Стрижка, укладка и консультация по уходу за волосами'
    },
    { 
      id: 2, 
      name: 'Стрижка мужская', 
      category: 'Волосы', 
      price: 1500, 
      duration: 45,
      active: true,
      description: 'Классическая мужская стрижка'
    },
    { 
      id: 3, 
      name: 'Окрашивание', 
      category: 'Волосы', 
      price: 4000, 
      duration: 120,
      active: true,
      description: 'Окрашивание волос любой сложности'
    },
    { 
      id: 4, 
      name: 'Массаж лица', 
      category: 'Косметология', 
      price: 2500, 
      duration: 40,
      active: true, 
      description: 'Расслабляющий и омолаживающий массаж лица'
    },
    { 
      id: 5, 
      name: 'Чистка лица', 
      category: 'Косметология', 
      price: 3000, 
      duration: 60,
      active: true,
      description: 'Глубокая чистка лица с использованием профессиональной косметики'
    }
  ]
}; 