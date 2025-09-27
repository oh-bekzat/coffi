import React, { useState } from "react";
import { Text, View } from "react-native";
import { CustomButton, CustomInput } from "../../components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLogin } from "../../hooks/useAuth";
import { router } from "expo-router";
import NavigationHeader from "../../components/NavigationHeader";

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberDisplay, setPhoneNumberDisplay] = useState("");

  const { mutate, isPending } = useLogin();

  const handlePhoneNumberChange = (value: string) => {
    const rawValue = value.replace(/\D/g, "");
    setPhoneNumber(rawValue);

    let formattedValue = rawValue
      .slice(0, 11)
      .replace(/(\d{3})(\d{0,3})(\d{0,2})(\d{0,2})/, (_, g1, g2, g3, g4) => {
        let formatted = g1;
        if (g2) formatted += ` ${g2}`;
        if (g3) formatted += ` ${g3}`;
        if (g4) formatted += ` ${g4}`;
        return formatted;
      });
    
    setPhoneNumberDisplay(formattedValue);
  };

  const handlePress = () => {
    const formattedPhoneNumber = `+7${phoneNumber}`;

    mutate(
      { phoneNumber: formattedPhoneNumber },
      {
        onSuccess: (data) => {
          const { userId } = data;
          router.push({
            pathname: "/auth/verify/[userId]",
            params: {
              userId: userId,
              phoneNumber: phoneNumber,
              isCashier: data.role === "cashier" ? "true" : "false"
            }
          });
        },
      }
    );
  };

  return (
    <SafeAreaView className="bg-primary flex-1 bg-mono_900">
      <NavigationHeader showBack={true} showClose={false} />
      <View className="flex-1 justify-center items-center px-[48px]">
        <Text className="text-white text-[20px] leading-[25px] font-bold mb-[10px]">
          Введите номер телефона
        </Text>
        <Text className="text-white text-[17px] leading-[22px] text-center mb-[20px]">
          Мы используем Ваш номер телефона для уведомлений о заказе
        </Text>
        <CustomInput onChangeText={handlePhoneNumberChange} value={phoneNumberDisplay} keyboardType="phone-pad" isPhoneNumber maxLength={13} />
        <CustomButton containerStyles="mt-[22px]" text="Продолжить" disabled={!phoneNumber || phoneNumber.length !== 10 || isPending} onPressOut={handlePress} />
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;