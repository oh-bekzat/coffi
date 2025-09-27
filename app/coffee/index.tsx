import { router } from "expo-router";
import { TouchableOpacity, Text, FlatList, ScrollView, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetCoffees } from "../../hooks/useCoffee";
import { useMenuFoods } from "../../hooks/useMenu";
import { useBottomSheetStore } from "../../stores/bottomSheetStore";
import { CafeSelection } from "../../components/bottomsheets";
import { useCafeStore } from "../../stores/cafeStore";
import { useBagStore } from "../../stores/bagStore";
import { useGetCafe } from "../../hooks/useCafe";
import NavigationHeader from "../../components/NavigationHeader";
import Toast from "react-native-toast-message";
import BagFoodCard from '../../components/BagFoodCard';
import { useState, useCallback, useMemo } from "react";
import CustomButton from "../../components/CustomButton";
import RefreshableView from "../../components/RefreshableView";
import { useQueryClient } from "@tanstack/react-query";
import { MenuItem } from "../../types/menu";

const Coffee = () => {
  const { openSheet, closeSheet } = useBottomSheetStore();
  const { preferredCafe } = useCafeStore();
  const { cafe: bagCafe } = useBagStore();
  const [hasAdded, setHasAdded] = useState(false);
  const queryClient = useQueryClient();

  const currentCafe = preferredCafe || bagCafe;
  
  // Fetch current cafe status
  const { data: refreshedCafe, isLoading: cafeLoading, error: cafeError } = useGetCafe(currentCafe?.id);
  
  const activeCafe = refreshedCafe || currentCafe;
  const isCafeOpen = activeCafe?.isOpen ?? true;
  
  // Only fetch menu if cafe is open AND we have status data
  const shouldFetchMenu = isCafeOpen && !cafeLoading && !!currentCafe?.id;
  
  const { data: coffees, isLoading: coffeesLoading, error: coffeesError } = useGetCoffees(currentCafe?.id, { enabled: shouldFetchMenu });
  const { data: menuCategories, isLoading: menuLoading, error: menuError } = useMenuFoods(currentCafe?.id || "", { enabled: shouldFetchMenu });
  
  // Group available items by category for display
  const availableMenuByCategory = useMemo(() => {
    if (!menuCategories) {
      return [];
    }

    return menuCategories
      .map(category => {
        const availableItems = category.items.filter(item => item.available === true);
        return {
          categoryName: category.categoryName,
          items: availableItems
        };
      })
      .filter(category => category.items.length > 0);
  }, [menuCategories]);
  
  const handleRefresh = useCallback(async () => {
    if (currentCafe?.id) {
      await queryClient.invalidateQueries({ queryKey: ["cafe", currentCafe.id] });
      await queryClient.invalidateQueries({ queryKey: ["coffees", currentCafe.id] });
      await queryClient.invalidateQueries({ queryKey: ["foods", currentCafe.id] });
    } else {
      await queryClient.invalidateQueries({ queryKey: ["coffees"] });
    }
  }, [queryClient, currentCafe]);

  const handleCafeClear = async () => {
    const { setPreferredCafe } = useCafeStore.getState();
    await setPreferredCafe(null);
    router.push('/map');
  };

  if (cafeLoading || (isCafeOpen && coffeesLoading)) {
    return (
      <SafeAreaView className="bg-mono_900 h-full p-[20px]">
          <View className="flex-row gap-4 mb-6 items-center">
            <View className="w-[36px] h-[36px] rounded-full bg-mono_800" />
            <View>
              <View className="h-[16px] w-[120px] bg-mono_800 rounded-full mb-1" />
              <View className="h-[14px] w-[160px] bg-mono_800 rounded-full" />
            </View>
          </View>

          <View className="mb-6">
            <View className="h-[24px] w-[100px] bg-mono_800 rounded-full mb-4" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3].map((i) => (
                <View key={i} className="p-[10px] bg-mono_700 rounded-[16px] mr-2 h-[161px] w-[152px]">
                  <View className="pt-[2px] px-[8px] pb-0">
                    <View className="h-[17px] w-[80px] bg-mono_800 rounded-full mb-1" />
                    <View className="h-[14px] w-[60px] bg-mono_800 rounded-full mb-2" />
                  </View>
                  <View className="flex-1 items-center overflow-hidden -mt-[12px]">
                    <View className="absolute bottom-0 bg-mono_800 w-full h-[70%] rounded-[12px]" />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          <View className="mb-6">
            <View className="h-[24px] w-[100px] bg-mono_800 rounded-full mb-4" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3].map((i) => (
                <View key={i} className="p-[10px] bg-mono_700 rounded-[16px] mr-2 h-[161px] w-[152px]">
                  <View className="pt-[2px] px-[8px] pb-0">
                    <View className="h-[17px] w-[80px] bg-mono_800 rounded-full mb-1" />
                    <View className="h-[14px] w-[60px] bg-mono_800 rounded-full mb-2" />
                  </View>
                  <View className="flex-1 items-center overflow-hidden -mt-[12px]">
                    <View className="absolute bottom-0 bg-mono_800 w-full h-[70%] rounded-[12px]" />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          <View className="mb-6">
            <View className="h-[24px] w-[100px] bg-mono_800 rounded-full mb-4" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3].map((i) => (
                <View key={i} className="p-[10px] bg-mono_700 rounded-[16px] mr-2 h-[161px] w-[152px]">
                  <View className="pt-[2px] px-[8px] pb-0">
                    <View className="h-[17px] w-[80px] bg-mono_800 rounded-full mb-1" />
                    <View className="h-[14px] w-[60px] bg-mono_800 rounded-full mb-2" />
                  </View>
                  <View className="flex-1 items-center overflow-hidden -mt-[12px]">
                    <View className="absolute bottom-0 bg-mono_800 w-full h-[70%] rounded-[12px]" />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
      </SafeAreaView>
    );
  }

  if (currentCafe && !isCafeOpen && activeCafe) {
    // Clear cafe choice when closed
    const clearClosedCafe = async () => {
      const { setPreferredCafe } = useCafeStore.getState();
      const { clearBag } = useBagStore.getState();
      
      await setPreferredCafe(null);
      clearBag(); // Also clear bag since cafe is closed
      router.push('/map');
    };

    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="bg-mono_900 h-full flex-1">
        <NavigationHeader showBack={true} showClose={true} />
        <View className="flex-row gap-4 mb-6 items-center px-[24px]">
          <TouchableOpacity onPress={clearClosedCafe}>
            <Text className="font-bold text-white text-[21px] mb-[4px]">{activeCafe.name}</Text>
            <Text className="text-gray-500">
              {activeCafe.streetName}, {activeCafe.streetNumber}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-1 justify-center items-center px-[24px]">
          <Text className="text-white text-[24px] font-medium text-center mb-[16px]">
            {activeCafe.name} закрыта
          </Text>
          <Text className="text-mono_400 text-[16px] text-center mb-[32px]">
            К сожалению, выбранная кофейня сейчас не работает. Пожалуйста, выберите другую кофейню.
          </Text>
          <CustomButton 
            text="Выбрать другую кофейню" 
            onPress={clearClosedCafe}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (cafeError || coffeesError) {
    return (
      <SafeAreaView className="bg-mono_900 h-full flex-1 justify-center items-center">
        <Text className="text-red-500">Ошибка загрузки кофе</Text>
      </SafeAreaView>
    );
  }

  const renderCoffeeItem = ({ item }: { item: any }) => {
    const firstAttachment = item.attachmentUrls?.[0];
    const attachmentUrl = firstAttachment?.startsWith("http")
      ? firstAttachment
      : firstAttachment 
        ? `https://${firstAttachment}`
        : undefined;

    const handleCoffeePress = (itemId: string) => {
      if (!currentCafe) {
        openSheet(
          <CafeSelection
            onClose={closeSheet}
            coffeeId={itemId}
            onSelect={async (selectedCafe) => {
              useCafeStore.setState({ preferredCafe: selectedCafe });
              closeSheet();
              router.push({
                pathname: "/coffee/[coffeeId]",
                params: { 
                  coffeeId: itemId,
                  cafeId: selectedCafe.id
                }
              });
            }}
          />
        );
        return;
      }

      router.push({
        pathname: "/coffee/[coffeeId]",
        params: { 
          coffeeId: itemId,
          cafeId: currentCafe.id
        }
      });
    };

    return (
      <TouchableOpacity onPress={() => handleCoffeePress(item.id)} className="p-[10px] bg-mono_700 rounded-[16px] mr-2 h-[161px] w-[152px]">
        <View className="pt-[1px] px-[2px] pb-0">
          <Text className={`mb-[1px] text-white ${item.name.length > 12 ? 'text-[14px]' : 'text-[17px]'}`} numberOfLines={1}>{item.name}</Text>
          {item.priceS != null ? (
            <Text className="text-mono_400">от {item.priceS} ₸</Text>
          ) : item.priceM != null ? (
            <Text className="text-mono_400">от {item.priceM} ₸</Text>
          ) : item.priceL != null ? (
            <Text className="text-mono_400">от {item.priceL} ₸</Text>
          ) : null}
        </View>
        <View className="flex-1 items-center overflow-hidden -mt-[12px]">
          <View className="absolute bottom-0 bg-mono_800 w-full h-[70%] z-0 rounded-[12px]" />
          <View style={{ height: '100%', overflow: 'hidden' }}>
            <Image
              source={{ uri: attachmentUrl }}
              style={{
                marginTop: 18,
                width: 130,
                height: 175,
                borderRadius: 0,
                zIndex: 1
              }}
              resizeMode="cover"
              defaultSource={{ uri: "https://via.placeholder.com/150" }}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => {

    const handleMenuItemPress = (item: MenuItem) => {
      if (!currentCafe) {
        openSheet(
          <CafeSelection
            onClose={closeSheet}
            onSelect={async (selectedCafe) => {
              useCafeStore.setState({ preferredCafe: selectedCafe });
              closeSheet();
              
              // Add food to bag with the selected cafe
              useBagStore.getState().addFood(selectedCafe, { foodId: item.id });
              
              Toast.show({
                type: 'tomatoToast',
                text1: 'Еда добавлена в корзину',
                position: 'top'
              });
            }}
          />
        );
        return;
      }

      // Add food to bag with the current cafe
      useBagStore.getState().addFood(currentCafe, { foodId: item.id });
      setHasAdded(true);
      
      Toast.show({
        type: 'tomatoToast',
        text1: 'Еда добавлена в корзину',
        position: 'top'
      });
    };

    return (
      <TouchableOpacity 
        onPress={() => handleMenuItemPress(item)}
        className="mr-2"
      >
        <BagFoodCard
          food={item}
          isHidable={false}
          fromMenu={true}
        />
      </TouchableOpacity>
    );
  };

  return (
      <SafeAreaView edges={['top', 'left', 'right']} className="bg-mono_900 h-full flex-1">
        <NavigationHeader showBack={true} showClose={true} />
        <View className="flex-row gap-4 mb-6 items-center px-[24px]">
        {currentCafe ? (
          <TouchableOpacity onPress={handleCafeClear}>
            <Text className="font-bold text-white text-[21px] mb-[4px]">{currentCafe.name}</Text>
            <Text className="text-gray-500">
              {currentCafe.streetName}, {currentCafe.streetNumber}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text onPress={() => router.push('/map')} className="text-white text-[17px]">Кофейня не выбрана</Text>
        )}
      </View>

      <RefreshableView 
        className="px-[24px]"
        queryKeys={currentCafe?.id ? [["cafe", currentCafe.id], ["coffees", currentCafe.id], ["foods", currentCafe.id]] : [["coffees"]]}
        onRefresh={handleRefresh}
      >

        {coffees?.recent && coffees.recent.length > 0 && (
          <View className="mb-6">
            <Text className="font-bold text-xl mb-4 text-white">Недавние</Text>
            <FlatList
              data={coffees.recent}
              keyExtractor={(item) => item.id}
              renderItem={renderCoffeeItem}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {coffees?.popular && coffees.popular.length > 0 && (
          <View className="mb-6">
            <Text className="font-bold text-xl mb-4 text-white">Популярные</Text>
            <FlatList
              data={coffees.popular}
              keyExtractor={(item) => item.id}
              renderItem={renderCoffeeItem}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {coffees?.other && coffees.other.length > 0 && (
          coffees.other.map((category, index) => (
            <View key={`category-${category.category}-${index}`} className="mb-6">
              <Text className="font-bold text-xl mb-4 text-white">{category.category}</Text>
              <FlatList
                data={category.coffees}
                keyExtractor={(item) => item.id}
                renderItem={renderCoffeeItem}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          ))
        )}

        {currentCafe && availableMenuByCategory && availableMenuByCategory.length > 0 && (
          <View className="mb-[200px]">
            {availableMenuByCategory.map((category, index) => (
              <View key={`food-category-${category.categoryName}-${index}`} className="mb-6">
                <Text className="font-bold text-xl mb-4 text-white">{category.categoryName}</Text>
                <FlatList
                  data={category.items}
                  keyExtractor={(item) => item.id}
                  renderItem={renderMenuItem}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            ))}
          </View>
        )}
      </RefreshableView>

      {hasAdded && (
        <SafeAreaView edges={['bottom']} className="px-[24px] py-[24px] items-center">
          <CustomButton
            text="Перейти в корзину" 
            onPress={() => router.push("/bag")}
          />
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
};

export default Coffee;