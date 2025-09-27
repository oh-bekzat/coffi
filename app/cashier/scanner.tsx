import { useState, useCallback, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { View, Text, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { fetchApi } from '../../api/fetch';
import { CustomButton } from '../../components';
import AuthGuard from '../../components/AuthGuard';
import NavigationHeader from '../../components/NavigationHeader';
import { useIsFocused } from '@react-navigation/native';

export default function ScannerScreen() {
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const isProcessing = useRef(false);
  const isFocused = useIsFocused();

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (scanned || isProcessing.current) return;

    // Basic payload validation before attempting any network calls
    if (!data || typeof data !== 'string' || data.length < 7) {
      Alert.alert('Ошибка', 'Неверный QR код');
      return;
    }

    try {
      isProcessing.current = true;
      setScanned(true);

      const code = data.substring(0, 6);
      const orderId = data.substring(6);

      await fetchApi(`/cashier/order/${orderId}/give-away/confirm?code=${code}`, {
        method: 'POST'
      });

      Alert.alert('Успешно', 'Заказ выдан', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Ошибка', 'Неверный QR код');
      setScanned(false);
    } finally {
      isProcessing.current = false;
    }
  }, [scanned]);

  const content = () => {
    if (!permission) {
      return <View className="flex-1 bg-mono_900" />;
    }

    if (!permission.granted) {
      const blocked = permission.status === 'denied' && !permission.canAskAgain;
      return (
        <View className="flex-1 justify-center items-center bg-mono_900">
          <Text className="text-white mb-4">Нужен доступ к камере</Text>
          {!blocked ? (
            <CustomButton text="Разрешить" onPress={requestPermission} />
          ) : (
            <CustomButton text="Открыть настройки" onPress={() => Linking.openSettings()} />
          )}
        </View>
      );
    }

    return (
      <AuthGuard requiredRole="cashier">
        <SafeAreaView className='bg-mono_900 flex-1'>
          <NavigationHeader showBack={true} showClose={false} />
          <View className="flex-1 bg-mono_900">
            {isFocused && (
              <CameraView
                facing="back"
                className="flex-1"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                mute={true}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </SafeAreaView>
      </AuthGuard>
    );
  };

  return content();
} 