import { useState } from "react";
import { View, Text } from "react-native";
import { CustomInput, CustomButton } from "../../components";
import { useUpdateProfile } from "../../hooks/useProfile";

const EditUsername = ({ oldUsername, onClose }: { oldUsername?: string, onClose: () => void }) => {
  const [username, setUsername] = useState("");
  const updateProfileMutation = useUpdateProfile();

  const handleUpdateUsername = () => {
    updateProfileMutation.mutate({ username },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <View className="items-center mt-[24px] px-[24px]">
      <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Изменение никнейма</Text>
      <Text className="text-white font-semibold text-[24px] leading-[32px] mb-[16px] text-center">Введите новый никнейм:</Text>
      <CustomInput onChangeText={(v) => setUsername(v)} value={username} placeholder={oldUsername} />
      <CustomButton
        text="Сохранить"
        onPress={handleUpdateUsername}
        disabled={!username}
        containerStyles="mt-[22px]"
      />
    </View>
  );
};

export default EditUsername;