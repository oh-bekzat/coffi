import { useState } from "react";
import { View, Text, Image, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomButton } from "../components";
import { useGetProfile } from "../hooks/useProfile";
import { router } from "expo-router";
import { useBottomSheetStore } from "../stores/bottomSheetStore";
import { PhoneNumber, Username, Email, Terms } from "../components/bottomsheets";
import { useUnsubscribe, useSubscribe } from "../hooks/useSubscription";
import Svg, { Path } from "react-native-svg";
import { useLogout, useDeleteAccount } from "../hooks/useAuth";
import NavigationHeader from "../components/NavigationHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import { useQueryClient } from "@tanstack/react-query";
import PrivacyPolicy from "../components/bottomsheets/PrivacyPolicy";
import PaymentTerms from "../components/bottomsheets/PaymentTerms";
import AuthGuard from "../components/AuthGuard";
import AboutUs from "../components/bottomsheets/AboutUs";

const ProfilePage = () => {
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();
  const { openSheet, closeSheet } = useBottomSheetStore();
  const [isEditing, setIsEditing] = useState(false);
  const unsubscribeMutation = useUnsubscribe();
  const subscribeMutation = useSubscribe();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, error } = useGetProfile();
  type document = 'terms' | 'privacy' | 'payment' | 'about'| 'none';
  const [currentDocument, setCurrentDocument] = useState<document>('none');

  const openLogoutBottomSheet = () => {
    openSheet(
      <View className="flex justify-center items-center mt-[24px]">
        <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Выход</Text>
        <Text className="text-white font-bold text-[22px] leading-[28px] text-center w-[80%] mb-[22px]">Вы уверены{'\n'}что хотите выйти?</Text>
        <CustomButton
          text="Выход"
          onPress={handleLogout}
          isDanger={true}
        />
      </View>
    )
  };

  const handleLogout = async () => {
    try {
      closeSheet();
      logout.mutate();
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось выйти из системы.");
    }
  };

  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (error) {
    return (
      <SafeAreaView className="bg-mono_900 h-full flex-1 justify-center items-center">
        <Text className="text-white text-[17px]">Ошибка загрузки профиля</Text>
      </SafeAreaView>
    );
  }

  const handleDeleteAccount = () => {
    openSheet(
      <View className="flex justify-center items-center mt-[24px]">
        <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Удаление аккаунта</Text>
        <Text className="text-white font-bold text-[22px] leading-[28px] text-center w-[80%] mb-[22px]">Вы уверены что хотите удалить аккаунт?</Text>
        <CustomButton
          text="Удалить"
          onPress={async () => {
            try {
              closeSheet();
              await deleteAccount.mutateAsync();
            } catch (error) {
              Alert.alert("Ошибка", "Не удалось удалить аккаунт.");
            }
          }}
          isDanger={true}
        />
      </View>
    )
  };

  const openEndSubscriptionBottomSheet = () => {
    openSheet(
      <View className="flex justify-center items-center mt-[24px] px-[24px]">
        <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Разорвать подписку</Text>
        <Text className="text-white font-bold text-[22px] leading-[28px] text-center mb-[22px]">Вы уверены что хотите разорвать подписку?</Text>
        <CustomButton
          text="Разорвать"
          onPress={() => handleEndSubscription()}
          isDanger={true}
        />
      </View>
    )
  };

  const handleEndSubscription = () => {
    closeSheet();
    if (profile?.subscription?.subId) {
      unsubscribeMutation.mutate(profile.subscription.subId, {
        onSuccess: () => {
          openSheet(
            <View className="flex justify-center items-center mt-[24px] px-[24px]">
              <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Разорвать подписку</Text>
              <Text className="text-white font-bold text-[22px] leading-[28px] text-center mb-[22px]">Ваша подписка закончится после {profile?.subscription?.endDate}</Text>
              <Text className="text-mono_400 text-[18px] leading-[24px] text-center">Вы можете продлить подписку в любой момент для автоматического списания средств</Text>
            </View>
          )
        },
        onError: (error) => {
          // console.error("Error ending subscription:", error);
        }
      });
    }
  };

  const handleExtendSubscription = () => {
    if (profile?.subscription?.subId) {
      subscribeMutation.mutate({ sub_id: profile.subscription.subId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
          },
          onError: (error) => {
            // console.error("Error extending subscription:", error);
          }
        }
      );
    }
  };

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
  };

  return (
    <SafeAreaView className="bg-mono_900 flex-1">
      {currentDocument === 'terms' ?
        <View className="flex-1">
          <NavigationHeader showBack={true} onBack={() => setCurrentDocument('none')} showClose={false} />
          <Terms />
        </View>
      : currentDocument === 'privacy' ?
        <View className="flex-1">
          <NavigationHeader showBack={true} onBack={() => setCurrentDocument('none')} showClose={false} />
          <PrivacyPolicy />
        </View>
      : currentDocument === 'payment' ?
        <View className="flex-1">
          <NavigationHeader showBack={true} onBack={() => setCurrentDocument('none')} showClose={false} />
          <PaymentTerms />
        </View>
      : currentDocument === 'about' ?
        <View className="flex-1">
          <NavigationHeader showBack={true} onBack={() => setCurrentDocument('none')} showClose={false} />
          <AboutUs />
        </View>
      : <View className="flex-1">
        {isEditing ? 
          <NavigationHeader showBack={true} onBack={() => setIsEditing(false)} showClose={true} />
          : <NavigationHeader showBack={true} showClose={true} />
        }
        <View className="flex-1 px-[24px]">
          {!isEditing ? (
            <View>
              <TouchableOpacity onPress={() => setIsEditing(true)} className="flex-row bg-neutral-800 p-[16px] rounded-[48px] items-center gap-[16px]">
                {profile?.pfpUrl
                  ? <Image source={{ uri: profile?.pfpUrl }} style={{ width: 95, height: 95, borderRadius: 50 }} />
                  : <View className="bg-blue_500 w-[95px] h-[95px] rounded-full items-center justify-center">
                      <Svg width="39" height="39" viewBox="0 0 39 39" fill="none">
                        <Path d="M19.5003 0.389648C22.0346 0.389648 24.4651 1.39639 26.2571 3.18841C28.0491 4.98042 29.0558 7.41091 29.0558 9.9452C29.0558 12.4795 28.0491 14.91 26.2571 16.702C24.4651 18.494 22.0346 19.5008 19.5003 19.5008C16.966 19.5008 14.5355 18.494 12.7435 16.702C10.9515 14.91 9.94472 12.4795 9.94472 9.9452C9.94472 7.41091 10.9515 4.98042 12.7435 3.18841C14.5355 1.39639 16.966 0.389648 19.5003 0.389648ZM19.5003 24.2785C30.0592 24.2785 38.6114 28.5547 38.6114 33.8341V38.6119H0.38916V33.8341C0.38916 28.5547 8.94138 24.2785 19.5003 24.2785Z" fill="#2A2B2C"/>
                      </Svg>
                    </View>
                }
                <View className="flex-grow gap-[6px]">
                  <Text className="text-[22px] text-white font-bold">{profile?.username}</Text>
                  <Text className="text-[17px] text-white">{formatPhoneNumber(profile?.phoneNumber || "")}</Text>
                </View>
                <TouchableOpacity className="absolute right-[24px]">
                  <Svg width="9" height="13" viewBox="0 0 9 13" fill="none">
                    <Path d="M2.01986 0.5L0.609863 1.91L5.18986 6.5L0.609863 11.09L2.01986 12.5L8.01986 6.5L2.01986 0.5Z" fill="white"/>
                  </Svg>

                </TouchableOpacity>
              </TouchableOpacity>
              <View className="flex-col gap-[12px] mt-6">
                {/* <Text className="text-[17px] text-white">Поддержка</Text>
                <Text className="text-[17px] text-white">Пригласить друга</Text>
                <Text className="text-[17px] text-white">Достижения</Text>
                <Text className="text-[17px] text-white">О нас</Text> */}
                <Text className="text-[15px] leading-[21px] text-white" onPress={() => setCurrentDocument('privacy')}>Политика конфиденциальности</Text>
                <Text className="text-[15px] leading-[21px] text-white" onPress={() => setCurrentDocument('terms')}>Пользовательское соглашение</Text>
                <Text className="text-[15px] leading-[21px] text-white" onPress={() => setCurrentDocument('payment')}>Правила оплаты и возврата денежных средств</Text>
                <Text className="text-[15px] leading-[21px] text-white" onPress={() => setCurrentDocument('about')}>О нас</Text>
                <Text className="text-[15px] leading-[21px] text-white">Поддержка: +77064245188 sanzharrefill@mail.ru</Text>
              </View>
            </View>
          ) : (
            <View className="gap-[20px]">
              <View className="flex-row items-center gap-[12px]">
                <View className="w-[88px] h-[88px] bg-mono_800 rounded-full items-center justify-center">
                  <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                    <Path d="M13.1666 22.333V7.39134L8.39992 12.158L5.83325 9.49967L14.9999 0.333008L24.1666 9.49967L21.5999 12.158L16.8333 7.39134V22.333H13.1666ZM3.99992 29.6663C2.99159 29.6663 2.1287 29.3076 1.41125 28.5902C0.693807 27.8727 0.334474 27.0092 0.333252 25.9997V20.4997H3.99992V25.9997H25.9999V20.4997H29.6666V25.9997C29.6666 27.008 29.3079 27.8715 28.5904 28.5902C27.873 29.3088 27.0095 29.6676 25.9999 29.6663H3.99992Z" fill="#D4AB4E"/>
                  </Svg>
                </View>
                <View className="flex-grow gap-[8px]">
                  <TouchableOpacity onPress={() => openSheet(<Username onClose={closeSheet} oldUsername={profile?.username} />)} className="h-[40px] rounded-full justify-center px-[24px] bg-mono_700">
                    <Text className='text-white text-[16px]'>{profile?.username}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openSheet(<PhoneNumber onClose={closeSheet} />)} className="h-[40px] rounded-full justify-center px-[24px] bg-mono_700">
                    <Text className='text-white text-[16px]'>{formatPhoneNumber(profile?.phoneNumber || "")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="gap-[12px]">
                <Text className="text-white text-[17px]">Почта для чеков</Text>
                <TouchableOpacity onPress={() => openSheet(<Email onClose={closeSheet} oldEmail={profile?.email} />)} className="h-[40px] rounded-full justify-center px-[24px] bg-mono_700">
                  <Text className='text-white text-[16px]'>{profile?.email || "Впишите..."}</Text>
                </TouchableOpacity>
              </View>
              <View className="gap-[12px]">
                <Text className="text-white text-[17px]">Моя подписка</Text>
                {profile?.subscription ? (
                  <View className="py-[16px] px-[22px] bg-blue_500 rounded-[16px]">
                    <Text className="text-[20px] font-semibold text-white mb-[4px]">
                      {profile?.subscription?.subName}
                    </Text>
                    <Text className="text-[15px] text-mono_300 mb-[4px]">
                      до {profile?.subscription?.endDate}
                    </Text>
                    <Text className="text-white text-[15px]">Осталось использований: {profile?.subscription?.balance}</Text>
                    <View className="flex-row justify-end">
                      <TouchableOpacity onPress={profile?.subscription?.status === "active" ? openEndSubscriptionBottomSheet : handleExtendSubscription}>
                        <Text className="text-white text-[15px]">{profile?.subscription?.status === "active" ? "Разорвать" : "Продлить"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity className="" onPress={() => router.push("/subscription")}><Text className="text-blue_500 text-[17px]">Купить подписку</Text></TouchableOpacity>
                )}
              </View>
              <View className="gap-[12px]">
                <TouchableOpacity onPress={openLogoutBottomSheet} className=""><Text className="text-red_500 text-[17px]">Выход</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteAccount} className=""><Text className="text-red_500 text-[17px]">Удалить аккаунт</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>}
    </SafeAreaView>
  );
};

export default function Profile() {
  return (
    <AuthGuard>
      <ProfilePage />
    </AuthGuard>
  );
}