import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { CustomInput, CustomButton } from "../../components";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useUpdateProfile, useGetProfile } from "../../hooks/useProfile";
import { router } from "expo-router";

const FinishScreen = () => {
  const updateProfileMutation = useUpdateProfile();
  const [username, setUsername] = useState("");

  // Log when this screen mounts
  // useEffect(() => {
  //   console.log("Finish screen mounted");
  //   return () => console.log("Finish screen unmounted");
  // }, []);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
  };

  const handlePress = () => {
    // console.log("Finish - Submit button pressed with username:", username);
    
    updateProfileMutation.mutate(
      { username },
      {
        onSuccess: () => {
          // console.log("Finish - Profile update successful, navigating to subscription");
          
          // Use setTimeout to ensure navigation happens after state is updated
          setTimeout(() => {
            //console.log("Finish - Executing navigation to subscription");
            router.navigate("/subscription");
            // console.log("Finish - Navigation command executed");
          }, 300);
        },
        onError: (error) => {
          // console.error("Finish - Profile update failed:", error);
          Toast.show({
            type: "error",
            text1: "Failed to update profile. Please try again."
          });
        }
      }
    );
  };

  return (
    <SafeAreaView className="bg-primary flex-1 bg-mono_900">
      <View className="flex-1 justify-center items-center px-[48px]">
        <Text className="text-white text-[20px] leading-[25px] font-bold mb-[10px]">Введите ваше имя</Text>
        <Text className="text-white text-[17px] leading-[22px] font-medium text-center mb-[20px]">
          По нему мы сможем{'\n'}к вам обращаться
        </Text>
        <CustomInput onChangeText={handleUsernameChange} value={username} />
        <CustomButton
          containerStyles="mt-[22px]"
          text="Завершить"
          onPress={handlePress}
          disabled={!username || updateProfileMutation.isPending}
        />
      </View>
    </SafeAreaView>
  );
};

export default FinishScreen;