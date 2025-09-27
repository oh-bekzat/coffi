import React, { useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import CustomButton from '../components/CustomButton';
import { setHasSeenOnboarding } from '../utils/asyncStorage';
import { useBottomSheetStore } from '../stores/bottomSheetStore';

const OnboardingScreen = () => {
  const { closeSheet } = useBottomSheetStore();

  // Close any open bottom sheet when component mounts
  useEffect(() => {
    closeSheet();
  }, [closeSheet]);

  const handleComplete = React.useCallback(async () => {
    try {
      await setHasSeenOnboarding();
      router.replace('/auth');
    } catch (error) {
      // If saving fails, still continue to avoid blocking user
      router.replace('/auth');
    }
  }, []);

  return (
    <View className="flex-1 bg-mono_900">
      {/* Image Container */}
      <View className="flex-1 bg-mono_900 justify-center items-center">
        <Image
          source={require('../assets/images/splash-icon.png')}
          style={{ 
            width: 200,
            height: 200,
            resizeMode: 'contain'
          }}
        />
      </View>

      {/* Content overlay */}
      <SafeAreaView className="absolute bottom-[15%] flex justify-center items-center w-full">
        <Text className="text-white text-[24px] leading-[41px] font-bold text-center mb-[20px] w-[80%]">
          Добро пожаловать в{"\n"}COFFI!
        </Text>
        <CustomButton 
          onPress={handleComplete}
          text="Начать"
        />
      </SafeAreaView>

      {/* Skip area */}
      <Pressable 
        onPress={handleComplete}
        className="absolute right-0 top-0 bottom-0 w-1/3"
      />
    </View>
  );
};

export default OnboardingScreen;