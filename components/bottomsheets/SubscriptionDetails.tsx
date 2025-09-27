import { useState } from "react";
import { View, Alert, Text, TouchableOpacity, ScrollView } from "react-native";
import { CustomInput, CustomButton } from "../../components";
import { useGetSubscriptionDetails, useSubscribe } from "../../hooks/useSubscription";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";

const SubscriptionDetails = ({ onClose, subscriptionId }: { onClose: () => void, subscriptionId: string }) => {
  const { data: sub } = useGetSubscriptionDetails(subscriptionId);

  return (
    <View className="flex justify-center items-center mt-[24px]">
      <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Детали подписки</Text>
      <ScrollView className="w-full max-h-[520px]" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="gap-[14px]">
          <Text className="text-white text-[16px] leading-[28px] font-bold text-center">
            Бесплатный напиток каждый день с COFFI!
          </Text>

          <Text className="text-white text-[14px] leading-[22px] text-center">
            ✨ Получайте 1 бесплатный напиток среднего объема (350 мл) каждый день по подписке и экономьте от 50% каждый день! ✨
          </Text>

          <View className="gap-[6px]">
            <Text className="text-white text-[14px] leading-[22px] text-center">☕ В акции участвуют все кофейные и чайные напитки из списка.</Text>
            <Text className="text-white text-[14px] leading-[22px] text-center">🥤 Напиток можно забрать с собой или насладиться им прямо в кофейне.</Text>
            <Text className="text-white text-[14px] leading-[22px] text-center">📅 Акция действует месяц для участников подписки COFFI.</Text>
          </View>

          <View className="mt-[6px] gap-[8px]">
            <Text className="text-white text-[14px] leading-[22px] font-semibold text-center">📌 Как получить бесплатный напиток:</Text>
            <View className="gap-[4px]">
              <Text className="text-white text-[14px] leading-[22px] text-center">🔸Оформите подписку на месяц</Text>
              <Text className="text-white text-[14px] leading-[22px] text-center">🔸Выберите кофейню на карте, в которой хотите забрать напиток</Text>
              <Text className="text-white text-[14px] leading-[22px] text-center">🔸Укажите напиток и нажмите «Заказать»</Text>
              <Text className="text-white text-[14px] leading-[22px] text-center">🔸Заберите свой напиток у бариста или закажите прямо за стойкой</Text>
            </View>
          </View>

          <View className="mt-[6px] gap-[8px]">
            <Text className="text-white text-[14px] leading-[22px] font-semibold text-center">В акции участвуют напитки (350 мл):</Text>
            <View className="gap-[6px]">
              <Text className="text-white text-[14px] leading-[22px] text-center">☕ Кофе:</Text>
              <View className="gap-[4px]">
                <Text className="text-white text-[14px] leading-[22px] text-center"> • Капучино</Text>
                <Text className="text-white text-[14px] leading-[22px] text-center"> • Латте</Text>
                <Text className="text-white text-[14px] leading-[22px] text-center"> • Американо</Text>
              </View>
            </View>

            <View className="gap-[6px] mt-[8px]">
              <Text className="text-white text-[14px] leading-[22px] text-center">🍵 Чай:</Text>
              <View className="gap-[4px]">
                <Text className="text-white text-[14px] leading-[22px] text-center"> • Нарядный</Text>
                <Text className="text-white text-[14px] leading-[22px] text-center"> • Облепиховый</Text>
                <Text className="text-white text-[14px] leading-[22px] text-center"> • Малиновый</Text>
                <Text className="text-white text-[14px] leading-[22px] text-center"> • Ягодный</Text>
                <Text className="text-white text-[14px] leading-[22px] text-center"> • Имбирный</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

    </View>
  );
};

export default SubscriptionDetails;