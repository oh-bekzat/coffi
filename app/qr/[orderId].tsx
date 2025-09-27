import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useGiveAwayStore } from '../../hooks/useOrders';
import { useLocalSearchParams } from 'expo-router';
import NavigationHeader from '../../components/NavigationHeader';

export default function QRScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const code = useGiveAwayStore(state => state.getCode(orderId));

  if (!code) {
    return (
      <View className="flex-1 bg-mono_900 justify-center items-center">
        <Text className="text-white text-xl">QR код недоступен</Text>
      </View>
    );
  }

  const qrData = `${code}${orderId}`;

  return (
    <SafeAreaView className="flex-1 bg-mono_900">
      <NavigationHeader showBack={true} showClose={true} />
      <View className="flex-1 justify-center items-center">
        <QRCode
          value={qrData}
          size={250}
          backgroundColor="transparent"
          color="white"
        />
        <Text className="text-white mt-4">Покажите этот код кассиру</Text>
      </View>
    </SafeAreaView>
  );
} 