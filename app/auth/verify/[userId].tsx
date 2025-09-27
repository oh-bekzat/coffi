import React, { useState } from "react";
import { View, Text, SafeAreaView, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CustomButton, CustomInput } from "../../../components";
import { useConfirmCode } from "../../../hooks/useAuth";
import NavigationHeader from "../../../components/NavigationHeader";

const VerifyPhoneNumberScreen = () => {
  const [code, setCode] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { userId: rawUserId, phoneNumber: rawPhoneNumber, isCashier: rawIsCashier } = useLocalSearchParams();
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  const phoneNumber = Array.isArray(rawPhoneNumber) ? rawPhoneNumber[0] : rawPhoneNumber;
  const isCashier = (Array.isArray(rawIsCashier) ? rawIsCashier[0] : rawIsCashier) === "true";
  const { mutate, isPending } = useConfirmCode();

  const handleCodeChange = (value: string) => {
    const rawValue = value.replace(/\D/g, "");
    setCode(rawValue);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
  };

  const handlePress = () => {
    if (!userId || (!code && !password)) {
      Alert.alert("Error", "User ID or code is missing");
      return;
    }

    // console.log("Verify - Submitting with isCashier:", isCashier);
    
    mutate(
      { userId, ...(isCashier ? { password } : { code }) },
      {
        onSuccess: async (response) => {
          // console.log("Verify - Login success, response role:", response.role);
          // console.log("Verify - Login success, response isNewUser:", response.isNewUser);
          // Determine where to navigate based on role and if new user
          const navigateTo = isCashier 
            ? "/cashier" 
            : (response.isNewUser ? "/auth/finish" : "/map");
          
          // console.log(`Verify - Navigating to ${navigateTo} BEFORE state processing`);
          
          // Use requestAnimationFrame to ensure DOM is updated before navigation
          requestAnimationFrame(() => {
            router.replace(navigateTo);
          });
        },
      }
    );
  };

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  };

  return (
    <SafeAreaView className="bg-primary flex-1 bg-mono_900">
      <NavigationHeader showBack={true} showClose={false} />
      {!isCashier ? <View className="flex-1 justify-center items-center bg-mono_900 px-[48px]">
        <Text className="text-white text-[20px] leading-[25px] font-bold mb-[10px]">Введите код</Text>
        
        <Text className="text-white text-[17px] leading-[22px] font-normal text-center mb-[20px]">
          Код отправлен на номер{"\n"}+7 {formatPhoneNumber(phoneNumber)}
        </Text>
        <View className="items-center w-[60%] min-w-[240px]">
          <CustomInput onChangeText={handleCodeChange} value={code} keyboardType="phone-pad" maxLength={4} />
        </View>
        <CustomButton containerStyles="mt-[22px]" onPress={handlePress} text={isPending ? "Подтверждение..." : "Продолжить"} disabled={!code || code.length !== 4 || isPending} />
      </View>
      :
      <View className="flex-1 justify-center items-center bg-mono_900 px-[24px]">
        <Text className="text-white text-[20px] leading-[25px] font-bold mb-[20px]">Введите пароль</Text>
        <CustomInput onChangeText={handlePasswordChange} value={password} isPassword />
        <CustomButton containerStyles="mt-[22px]" onPress={handlePress} text={isPending ? "Подтверждение..." : "Продолжить"} disabled={!password || password.length < 8 || isPending} />
      </View>
      }
    </SafeAreaView>
  );
};

export default VerifyPhoneNumberScreen;