import React, { useState } from "react";
import { View, Alert, Text } from "react-native";
import { CustomInput, CustomButton } from "../../components";
import { useUpdateProfile, useVerifyPhoneNumber } from "../../hooks/useProfile";

const EditPhoneNumber = ({ onClose }: { onClose: () => void }) => {
  const verifyPhoneMutation = useVerifyPhoneNumber();
  const updateProfileMutation = useUpdateProfile();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberDisplay, setPhoneNumberDisplay] = useState("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyPhoneNumber = async () => {
    const formattedPhoneNumber = `+7${phoneNumber}`;
    verifyPhoneMutation.mutate(
      { phoneNumber: formattedPhoneNumber },
      {
        onSuccess: () => {
          setIsVerifying(true);
          Alert.alert("Код подтверждения отправлен", "Введите код из СМС");
        },
        onError: () => {
          Alert.alert("Ошибка", "Не удалось отправить код подтверждения");
        },
      }
    );
  };

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

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setCode(digits);
  };

  const handleUpdatePhoneNumber = () => {
    const formattedPhoneNumber = `+7${phoneNumber}`;
    updateProfileMutation.mutate(
      { phoneNumber: formattedPhoneNumber, code },
      {
        onSuccess: () => {
          onClose();
          setCode("");
          setIsVerifying(false);
        },
        onError: () => {
          Alert.alert("Ошибка", "Не удалось изменить номер телефона");
        },
      }
    );
  };

  return (
    <View className="items-center mt-[24px] px-[24px]">
      {!isVerifying ? (
        <>
          <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Изменение номера</Text>
          <Text className="text-white font-semibold text-[24px] leading-[32px] mb-[16px] text-center">Введите новый номер телефона:</Text>
          <Text className="text-white text-[16px] text-center mb-[22px]">
            Мы используем Ваш номер для уведомления о заказе
          </Text>
          <CustomInput
            onChangeText={handlePhoneNumberChange}
            value={phoneNumberDisplay}
            keyboardType="phone-pad"
            isPhoneNumber
            maxLength={13}
          />
          <CustomButton
            text={isVerifying ? "Сохранить" : "Отправить код"}
            onPress={isVerifying ? handleUpdatePhoneNumber : handleVerifyPhoneNumber}
            disabled={!isVerifying && phoneNumber.length !== 10}
            containerStyles="mt-[22px]"
          />
        </>
      ) : (
        <>
        <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Изменение номера</Text>
        <Text className="text-white font-semibold text-[24px] leading-[32px] mb-[16px] text-center">Введите код:</Text>
        <Text className="text-white text-[16px] text-center mb-[22px] w-[80%]">
          Код отправлен на номер{"\n"}+7 {" "}{phoneNumberDisplay}
        </Text>
        <CustomInput
          onChangeText={handleCodeChange}
          value={code}
          keyboardType="phone-pad"
          maxLength={4}
        />
        <CustomButton
          text={isVerifying ? "Сохранить" : "Отправить код"}
          onPress={isVerifying ? handleUpdatePhoneNumber : handleVerifyPhoneNumber}
          disabled={!isVerifying && phoneNumber.length !== 10}
          containerStyles="mt-[22px]"
        />
      </>
      )}
    </View>
  );
};

export default EditPhoneNumber;