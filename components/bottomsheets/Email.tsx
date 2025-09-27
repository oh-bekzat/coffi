import { useState } from "react";
import { View, Alert, Text } from "react-native";
import { CustomInput, CustomButton } from "../../components";
import { useUpdateProfile } from "../../hooks/useProfile";

const EditEmail = ({ oldEmail, onClose }: { oldEmail?: string, onClose: () => void }) => {
  const [email, setEmail] = useState("");
  const updateProfileMutation = useUpdateProfile();

  const handleUpdateEmail = () => {
    updateProfileMutation.mutate(
      { email },
      {
        onSuccess: () => {
          onClose();
        },
        onError: () => {
          Alert.alert("Ошибка", "Не удалось изменить почту");
        },
      }
    );
  };

  return (
    <View className="items-center mt-[24px] px-[24px]">
      <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Изменение почты</Text>
      <Text className="text-white font-semibold text-[24px] leading-[32px] mb-[16px] text-center">
        Введите новую почту
      </Text>
      <Text className="text-white text-[16px] text-center mb-[22px] w-[80%]">Мы используем вашу почту для хранения чеков</Text>
      <CustomInput onChangeText={(v) => setEmail(v)} value={email} placeholder={oldEmail || "example@mail.com"} />
      <CustomButton
        text="Сохранить"
        onPress={handleUpdateEmail}
        disabled={!email}
        containerStyles="mt-[22px]"
      />
    </View>
  );
};

export default EditEmail;