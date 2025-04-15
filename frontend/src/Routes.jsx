import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './contexts/AuthContext';
import Login from './pages/Login';
import ClientApp from './pages/ClientApp';
import AdminPanel from './pages/AdminPanel';
import EmployeeDashboard from './pages/EmployeeDashboard';
import SalonList from './components/salons/SalonList';
import SalonDetails from './components/salons/SalonDetails';
import BookingForm from './components/booking/BookingForm';
import AppointmentList from './components/appointments/AppointmentList';
import NotFound from './components/common/NotFound';
import ProtectedRoute from './components/common/ProtectedRoute';
import EmployeeAppointments from './components/employee/EmployeeAppointments';
import EmployeeSchedule from './components/employee/EmployeeSchedule.tsx';
import EmployeeServices from './components/employee/EmployeeServices.tsx';
import EmployeePerformance from './components/employee/EmployeePerformance';
import PublicLayout from './layouts/PublicLayout';

const AppRoutes = () => {
  const { user, isLoading } = useAuthContext();

  // Маршруты для клиента
  const clientRoutes = (
    <>
      <Route path="salons" element={<SalonList />} />
      <Route path="salons/:salonId" element={<SalonDetails />} />
      <Route path="book/:salonId/service/:serviceId" element={<BookingForm />} />
      <Route path="appointments" element={<AppointmentList />} />
      <Route index element={<Navigate to="salons" />} />
    </>
  );

  // Маршруты для сотрудника
  const employeeRoutes = (
    <>
      <Route path="appointments" element={<EmployeeAppointments />} />
      <Route path="schedule" element={<EmployeeSchedule />} />
      <Route path="services" element={<EmployeeServices />} />
      <Route path="performance" element={<EmployeePerformance />} />
      <Route index element={<Navigate to="appointments" />} />
    </>
  );

  // Маршруты для администратора
  const adminRoutes = (
    <>
      <Route path="salons" element={null} />
      <Route path="salons/:salonId" element={<SalonDetails />} />
      <Route path="appointments" element={<AppointmentList />} />
      <Route index element={<Navigate to="salons" />} />
    </>
  );

  // Если загрузка данных пользователя еще не завершена, не рендерим маршруты
  if (isLoading) {
    return null;
  }

  return (
    <Routes>
      {/* Общедоступные маршруты */}
      <Route path="/login" element={<Login />} />

      {/* Прямой маршрут для бронирования */}
      <Route 
        path="/booking/:salonId/service/:serviceId" 
        element={
          <ProtectedRoute
            isAllowed={!!user && user.role === 'client'}
            redirectPath="/login"
          >
            <BookingForm />
          </ProtectedRoute>
        } 
      />

      {/* Общедоступная страница салонов */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<SalonList />} />
        <Route path="salon/:salonId" element={<SalonDetails />} />
        <Route path="salon/:salonId/service/:serviceId/booking" element={<BookingForm />} />
        <Route path="salon/:salonId/book" element={<Login />} />
        <Route path="salon/:salonId/service/:serviceId/book" element={<Login />} />
      </Route>

      {/* Маршруты для клиента */}
      <Route 
        path="/client/*" 
        element={
          <ProtectedRoute
            isAllowed={!!user && user.role === 'client'}
            redirectPath="/login"
          >
            <ClientApp />
          </ProtectedRoute>
        }
      >
        {clientRoutes}
      </Route>

      {/* Маршруты для сотрудника */}
      <Route 
        path="/employee/*" 
        element={
          <ProtectedRoute
            isAllowed={!!user && user.role === 'employee'}
            redirectPath="/login"
          >
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      >
        {employeeRoutes}
      </Route>

      {/* Маршруты для администратора */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute
            isAllowed={!!user && user.role === 'admin'}
            redirectPath="/login"
          >
            <AdminPanel />
          </ProtectedRoute>
        }
      >
        {adminRoutes}
      </Route>

      {/* Перенаправление на соответствующий домашний маршрут в зависимости от роли */}
      <Route 
        path="/" 
        element={
          user ? (
            <Navigate 
              to={
                user.role === 'client' 
                  ? '/client' 
                  : user.role === 'employee'
                    ? '/employee'
                    : '/admin'
              } 
              replace 
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Страница 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes; 