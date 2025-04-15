export const WORK_DAYS: string[] = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export const DEFAULT_WORKING_HOURS = {
  start: '09:00',
  end: '18:00'
};

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const APPOINTMENT_STATUS_TEXT = {
  [APPOINTMENT_STATUS.PENDING]: 'Ожидает',
  [APPOINTMENT_STATUS.COMPLETED]: 'Выполнен',
  [APPOINTMENT_STATUS.CANCELLED]: 'Отменен'
} as const;

export const APPOINTMENT_STATUS_COLOR = {
  [APPOINTMENT_STATUS.PENDING]: '#1976d2',
  [APPOINTMENT_STATUS.COMPLETED]: '#2e7d32',
  [APPOINTMENT_STATUS.CANCELLED]: '#d32f2f'
} as const;

export const QUERY_KEYS = {
  EMPLOYEE_SCHEDULE: 'employee_schedule',
  EMPLOYEE_SERVICES: 'employee_services',
  EMPLOYEE_APPOINTMENTS: 'employee_appointments',
  ALL_SERVICES: 'all_services'
} as const;

export const STALE_TIME = 5 * 60 * 1000; // 5 минут

export const DEFAULT_ERROR_MESSAGE = 'Произошла ошибка при загрузке данных';

export type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];
export type AppointmentStatusText = typeof APPOINTMENT_STATUS_TEXT[keyof typeof APPOINTMENT_STATUS_TEXT];
export type AppointmentStatusColor = typeof APPOINTMENT_STATUS_COLOR[keyof typeof APPOINTMENT_STATUS_COLOR];
export type QueryKey = typeof QUERY_KEYS[keyof typeof QUERY_KEYS]; 