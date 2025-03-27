import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * Компонент для защиты маршрутов от неавторизованного доступа
 * @param {Object} props - Свойства компонента
 * @param {boolean} props.isAllowed - Флаг разрешения доступа
 * @param {string} props.redirectPath - Путь для перенаправления при отсутствии доступа
 * @param {React.ReactNode} props.children - Дочерние компоненты
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ isAllowed, redirectPath, children }) => {
  const location = useLocation();

  if (!isAllowed) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  isAllowed: PropTypes.bool.isRequired,
  redirectPath: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

export default ProtectedRoute; 