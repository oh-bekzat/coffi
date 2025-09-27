import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomButton } from "../components";
import { useBottomSheetStore } from "../stores/bottomSheetStore";
import { useGetProfile } from "../hooks/useProfile";
import { useGetSubscriptions } from "../hooks/useSubscription";
import { useState } from "react";
import { Cards, CafeSelection } from "../components/bottomsheets";
import { Cafe } from "../api/cafe";
import { router } from "expo-router";
import NavigationHeader from "../components/NavigationHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import AuthGuard from "../components/AuthGuard";

const SubscriptionPage = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const { openSheet, closeSheet } = useBottomSheetStore();
  const { data: profile, isLoading, error } = useGetProfile();
  const { data: subscriptions, isLoading: isSubsLoading, error: subsError, refetch } = useGetSubscriptions();

  const BUTTON_CONTAINER_PADDING = 16;
  const BOTTOM_SPACING = BUTTON_CONTAINER_PADDING * 2 + 56;

  if (isLoading || isSubsLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (error || subsError) {
    return (
      <View className="flex-1 justify-center items-center bg-mono_900">
        <Text className="text-white text-[17px] mb-4">Произошла ошибка при загрузке данных</Text>
        <CustomButton text="Повторить" onPress={() => refetch()} />
        <TouchableOpacity className="mt-[20px]" onPress={() => router.push("/map")}><Text className="text-white text-[16px] underline">Пропустить</Text></TouchableOpacity>
      </View>
    );
  }

  if (!subscriptions?.length) return <Text>Нет доступных подписок</Text>;

  return (
    <View className="flex-1 bg-mono_900">
      <SafeAreaView edges={['top', 'left', 'right']} className="bg-mono_900">
        <NavigationHeader showBack={true} showClose={true} />
        <View className="px-[20px] pb-[20px]">
          <Text className="text-white text-[31px] leading-[41px] font-bold text-left mb-[10px]">
            Добро пожаловать{"\n"}в семью, {profile?.username}!
          </Text>
          <Text className="text-white text-[17px] leading-[22px] text-left w-[80%]">
            Давайте выберем вам подписку
          </Text>
        </View>
      </SafeAreaView>

      <FlatList
        className="flex-1"
        contentContainerStyle={{ 
          paddingBottom: BOTTOM_SPACING,
          paddingHorizontal: 24
        }}
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item: sub }) => (
          <TouchableOpacity 
            onPress={() => setSelectedOption(sub.id)} 
            activeOpacity={0.8}
            className={`rounded-[12px] mb-[20px] w-full px-[24px] py-[18px] gap-[8px] ${
              selectedOption === sub.id ? 'bg-blue_500' : 'bg-blue_700'
            }`}
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-white text-[22px] font-bold">{sub.name}</Text>
              <TouchableOpacity className="px-[6px] pb-[6px] border-white" onPress={() => router.push(`/subscription-details/${sub.id}`)}>
                <Text className="text-white text-[12px] underline">подробнее</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-white text-[17px] mb-[16px]">{sub.price}₸/месяц</Text>
            <View className="flex-row flex-wrap gap-[6px]">
              <View className="h-[23px] justify-center px-[12px] items-center bg-mono_900 rounded-full">
                <Text className="text-white text-[14px]">{sub.monthlyLimit} кофе/мес.</Text>
              </View>
              <View className="h-[23px] justify-center px-[12px] items-center bg-mono_900 rounded-full">
                <Text className="text-white text-[14px]">{sub.dailyLimit} кофе/день</Text>
              </View>
              <View className="h-[23px] justify-center px-[12px] items-center bg-mono_900 rounded-full">
                <Text className="text-white text-[14px]">Экономия от 50%</Text>
              </View>
              <View className="h-[23px] justify-center px-[12px] items-center bg-mono_900 rounded-full">
                <Text className="text-white text-[14px]">Предзаказ</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />

      <View className="absolute bottom-[12px] left-0 right-0 bg-transparent">
        <SafeAreaView edges={['bottom']}>
          <View className="items-center">
          <View className="bg-blue_700 px-[16px] w-full py-[16px] rounded-t-[12px]">
            <Text className="text-white text-[16px] font-semibold text-center leading-[18px]">
              Подписка работает во всех филиалах. Эта информация нужна нам для анализа.
            </Text>
          </View>
            {selectedCafe ? (
              <View className="mb-4 px-[16px] py-[16px] rounded-b-[12px] bg-mono_800 w-full">
                <Text className="text-white text-[16px] text-center font-semibold">{selectedCafe.name}</Text>
                <Text className="text-mono_400 text-[12px] text-center">{selectedCafe.streetName}, {selectedCafe.streetNumber}</Text>
              </View>
            ) : (
              <View className="mb-4 px-[16px] py-[16px] rounded-b-[12px] bg-mono_800 w-full">
                <Text className="text-mono_400 text-[16px] text-center">Выберите кафе</Text>
              </View>
            )}
            <CustomButton 
              text={selectedCafe ? "Изменить кафе" : "Выбрать кафе"} 
              onPress={() => openSheet(
                <CafeSelection 
                  onClose={closeSheet} 
                  onSelect={async (cafe) => {
                    setSelectedCafe(cafe);
                    closeSheet();
                  }}
                  isSubscription={true}
                />
              )} 
              disabled={!selectedOption} 
            />
            {selectedCafe && (
              <View className="mt-4 px-6">
                <CustomButton 
                  text="Продолжить к оплате"
                  onPress={() => openSheet(
                    <Cards 
                      onClose={closeSheet} 
                      subscriptionId={selectedOption || ""} 
                      isSubscription={true}
                      selectedCafeId={selectedCafe.id}
                    />
                  )}
                />
              </View>
            )}
            <TouchableOpacity className="mt-[20px]" onPress={() => router.push("/map")}><Text className="text-white text-[16px] underline">Пропустить</Text></TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

export default function Subscription() {
  return (
    <AuthGuard>
      <SubscriptionPage />
    </AuthGuard>
  );
}