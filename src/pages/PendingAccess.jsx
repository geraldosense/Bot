import { Navigate } from 'react-router-dom';

/** Legado — membros acedem ao Dashboard directamente */
export default function PendingAccess() {
  return <Navigate to="/Dashboard" replace />;
}
