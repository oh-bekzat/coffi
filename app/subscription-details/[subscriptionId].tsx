import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavigationHeader from "../../components/NavigationHeader";

export default function SubscriptionDetailsPage() {
  return (
    <View className="flex-1 bg-mono_900">
      <SafeAreaView edges={['top', 'left', 'right']} className="bg-mono_900">
        <NavigationHeader showBack={true} showClose={false} />
        <View className="px-[20px] pb-[12px]">
          <Text className="text-white text-[22px] leading-[28px] font-bold text-left">
            Детали подписки
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="max-w-[640px] self-center w-full">
          <View className="bg-mono_800 rounded-[16px] p-[18px] gap-[14px] mt-[8px]">
            <Text className="text-white text-[18px] leading-[24px] font-bold">
              Бесплатный напиток каждый день с COFFI!
            </Text>

            <Text className="text-white text-[14px] leading-[21px]">
              ✨ Получайте 1 бесплатный напиток среднего объема (350 мл) каждый день по подписке и экономьте от 50% каждый день! ✨
            </Text>

            <View className="gap-[8px]">
              <View className="flex-row items-start gap-[8px]">
                <Text className="text-white text-[16px]">☕</Text>
                <Text className="text-white text-[14px] leading-[21px] flex-1">В акции участвуют все кофейные и чайные напитки из списка.</Text>
              </View>
              <View className="flex-row items-start gap-[8px]">
                <Text className="text-white text-[16px]">🥤</Text>
                <Text className="text-white text-[14px] leading-[21px] flex-1">Напиток можно забрать с собой или насладиться им прямо в кофейне.</Text>
              </View>
              <View className="flex-row items-start gap-[8px]">
                <Text className="text-white text-[16px]">📅</Text>
                <Text className="text-white text-[14px] leading-[21px] flex-1">Акция действует месяц для участников подписки COFFI.</Text>
              </View>
            </View>
          </View>

          <View className="bg-mono_800 rounded-[16px] p-[18px] gap-[10px] mt-[12px]">
            <Text className="text-white text-[15px] font-semibold">📌 Как получить бесплатный напиток:</Text>
            <View className="gap-[6px]">
              <View className="flex-row items-start gap-[8px]">
                <Text className="text-white text-[16px]">🔸</Text>
                <Text className="text-white text-[14px] leading-[21px] flex-1">Оформите подписку на месяц</Text>
              </View>
              <View className="flex-row items-start gap-[8px]">
                <Text className="text-white text-[16px]">🔸</Text>
                <Text className="text-white text-[14px] leading-[21px] flex-1">Выберите кофейню на карте, в которой хотите забрать напиток</Text>
              </View>
              <View className="flex-row items-start gap-[8px]">
                <Text className="text-white text-[16px]">🔸</Text>
                <Text className="text-white text-[14px] leading-[21px] flex-1">Укажите напиток и нажмите «Заказать»</Text>
              </View>
              <View className="flex-row items-start gap-[8px]">
                <Text className="text-white text-[16px]">🔸</Text>
                <Text className="text-white text-[14px] leading-[21px] flex-1">Заберите свой напиток у бариста или закажите прямо за стойкой</Text>
              </View>
            </View>
          </View>

          <View className="bg-mono_800 rounded-[16px] p-[18px] gap-[10px] mt-[12px]">
            <Text className="text-white text-[15px] font-semibold">В акции участвуют напитки (350 мл):</Text>

            <View className="gap-[6px]">
              <Text className="text-white text-[14px]">☕ Кофе:</Text>
              <View className="gap-[4px] pl-[4px]">
                <Text className="text-white text-[14px] leading-[21px]">• Капучино</Text>
                <Text className="text-white text-[14px] leading-[21px]">• Латте</Text>
                <Text className="text-white text-[14px] leading-[21px]">• Американо</Text>
              </View>
            </View>

            <View className="gap-[6px] mt-[8px]">
              <Text className="text-white text-[14px]">🍵 Чай:</Text>
              <View className="gap-[4px] pl-[4px]">
                <Text className="text-white text-[14px] leading-[21px]">• Нарядный</Text>
                <Text className="text-white text-[14px] leading-[21px]">• Облепиховый</Text>
                <Text className="text-white text-[14px] leading-[21px]">• Малиновый</Text>
                <Text className="text-white text-[14px] leading-[21px]">• Ягодный</Text>
                <Text className="text-white text-[14px] leading-[21px]">• Имбирный</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


