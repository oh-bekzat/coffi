import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function NotFound() {
  const { isAuthenticated, role, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }
  
  return <Redirect href={role === 'cashier' ? "/cashier" : "/map"} />;
}