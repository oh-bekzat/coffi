import { router } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomButton } from "../../components";
import { useState, useEffect } from "react";
import { getHasSeenOnboarding } from "../../utils/asyncStorage";

const Welcome = () => {
  useEffect(() => {
    const checkOnboarding = async () => {
      const hasSeenOnboarding = await getHasSeenOnboarding();
      if (!hasSeenOnboarding) {
        router.replace("/onboarding");
      }
    };
    
    checkOnboarding();
  }, []);

  const handleSkip = () => {
    router.replace("/map");
  };

  return (
    <SafeAreaView className="bg-mono_900 flex-1">
      <View className="flex-1 justify-center items-center px-[24px]">
        <Text className="text-[32px] text-white font-bold mb-[20px] text-center">
          Стань частью{"\n"}нашей семьи!
        </Text>

        <CustomButton text="Войти по номеру телефона" onPress={() => (router.push("/auth/phonenumber"))} />
        
        <TouchableOpacity 
          className="mt-[16px]" 
          onPress={handleSkip}
        >
          <Text className="text-mono_300 text-[16px]">
            Пропустить
          </Text>
        </TouchableOpacity>

        <View className='absolute bottom-[20px] w-full items-center'>
          <Text className='text-white text-[12px]'>
            Читать {" "}
            <Text 
              className='text-blue-500 underline' 
              onPress={() => router.push("/auth/terms")}
            >
              Пользовательское соглашение
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;