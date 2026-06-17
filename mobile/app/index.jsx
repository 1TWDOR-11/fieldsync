import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) router.replace('/tasks');
      else router.replace('/login');
    }
  }, [user, loading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E3A8A' }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}
