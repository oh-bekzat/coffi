import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, FlatList, LayoutAnimation } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { CustomButton, ScrollableContainer } from "../../components";
import { useGetCoffee } from "../../hooks/useCoffee";
import { CoffeeAdditive } from "../../api/coffee";
import { useBottomSheetStore } from "../../stores/bottomSheetStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBagStore } from "../../stores/bagStore";
import { useCafeStore } from "../../stores/cafeStore";
import { CafeSelection } from "../../components/bottomsheets";
import Svg, { Path } from "react-native-svg";
import ConfirmationSheet from "../../components/bottomsheets/ConfirmationSheet";
import MenuSelection from "../../components/bottomsheets/MenuSelection";
import Toast from 'react-native-toast-message';
import NavigationHeader from "../../components/NavigationHeader";
import { requireAuth } from '../../utils/authHelpers';

interface SelectedAdditives {
  [type: string]: string;
}

const CoffeeDetails = () => {
  const { coffeeId: rawCoffeeId, cafeId: rawCafeId } = useLocalSearchParams();
  const { openSheet, closeSheet } = useBottomSheetStore();
  const coffeeId = Array.isArray(rawCoffeeId) ? rawCoffeeId[0] : rawCoffeeId;
  const cafeId = Array.isArray(rawCafeId) ? rawCafeId[0] : rawCafeId;
  const { cafe: bagCafe } = useBagStore();
  const { preferredCafe } = useCafeStore();

  const currentCafe = preferredCafe || bagCafe;
  const fetchCafeId = cafeId || currentCafe?.id;

  const formatType = (type: string) => {
    switch (type) {
      case 'milk': return 'Молоко';
      case 'syrup': return 'Сироп';
      case 'other': return 'Другое';
      default: return type;
    }
  }

  const [selectedAdditives, setSelectedAdditives] = useState<SelectedAdditives>({});
  const [selectedSize, setSelectedSize] = useState<'s' | 'm' | 'l' | null>(null);

  const { data: coffee, isLoading, error } = useGetCoffee(
    coffeeId ?? "", 
    fetchCafeId ?? "", 
    { enabled: Boolean(coffeeId && fetchCafeId) }
  );

  // Set the initial selected size to the first available size with a price
  useEffect(() => {
    if (coffee && selectedSize === null) {
      const availableSizes = (['s', 'm', 'l'] as const).filter(size => {
        const price = getPrice(size);
        return price !== null && price !== undefined;
      });
      
      if (availableSizes.length > 0) {
        setSelectedSize(availableSizes[0]);
      }
    }
  }, [coffee, selectedSize]);

  useEffect(() => {
    if (coffee?.attachmentUrls?.[0]) {
      Image.prefetch(`https://${coffee.attachmentUrls[0]}`);
    }
    coffee?.additiveTypes?.forEach(type => {
      type.additives.forEach(additive => {
        if (additive.attachmentUrls?.[0]) {
          Image.prefetch(`https://${additive.attachmentUrls[0]}`);
        }
      });
    });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [coffee]);

  const getPrice = (size: 's' | 'm' | 'l') => {
    if (!coffee) return 0;
    switch (size) {
      case 's': return coffee.priceS;
      case 'm': return coffee.priceM;
      case 'l': return coffee.priceL;
    }
  };

  const handleMenuClose = useCallback(() => {
    closeSheet();
    router.replace('/coffee')
  }, [closeSheet]);

  const handleAddToBag = useCallback((showMenu = true) => {
    // First check if user is authenticated, if not, redirect to auth
    if (!requireAuth()) {
      return;
    }

    // Check if a size is selected
    if (!selectedSize) {
      Toast.show({
        type: 'tomatoToast',
        text1: 'Пожалуйста, выберите размер',
        position: 'top'
      });
      return;
    }

    const showMenuSelection = () => {
      if (!currentCafe) return;
      closeSheet();
      if (showMenu) {
        openSheet(<MenuSelection cafe={currentCafe} onClose={handleMenuClose} />);
      }
    };

    if (!currentCafe) {
      openSheet(
        <CafeSelection
          onClose={closeSheet}
          coffeeId={coffeeId}
          onSelect={async (selectedCafe) => {
            try {
              useCafeStore.setState({ preferredCafe: selectedCafe });
              useBagStore.getState().addCoffee(selectedCafe, {
                coffeeId,
                cupSize: selectedSize,
                additives: Object.values(selectedAdditives || {}),
              });
              showMenuSelection();
            } catch (error) {
              // console.error("Error adding to bag:", error);
            }
          }}
        />
      );
      return;
    }

    if (bagCafe && currentCafe.id !== bagCafe.id) {
      openSheet(
        <ConfirmationSheet
          onConfirm={() => {
            useBagStore.getState().clearBag();
            useBagStore.getState().addCoffee(currentCafe, {
              coffeeId,
              cupSize: selectedSize,
              additives: Object.values(selectedAdditives || {}),
            });
            showMenuSelection();
          }}
        />
      );
      return;
    }

    useBagStore.getState().addCoffee(currentCafe, {
      coffeeId,
      cupSize: selectedSize,
      additives: Object.values(selectedAdditives || {}),
    });
    Toast.show({
      type: 'tomatoToast',
      text1: 'Кофе добавлен в корзину',
      position: 'top'
    });
    showMenuSelection();
  }, [selectedSize, selectedAdditives, currentCafe, coffeeId]);

  const openBottomSheet = useCallback((additiveType: CoffeeAdditive) => {
    openSheet(
      <View className="mt-[24px] px-[24px] h-[300px]">
        <Text className="text-mono_500 text-[14px] text-center mb-[22px]">
          Выбор добавки
        </Text>
        <Text className="text-white font-semibold text-[20px] leading-[22px] mb-[22px] text-center">
          Выберите {formatType(additiveType.type).toLowerCase()}:
        </Text>
        
        <View className="flex-1 justify-center">
          <ScrollableContainer>
            <FlatList
              data={additiveType.additives}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 4 }}
              renderItem={({ item }) => (
                <View className="items-center">
                  <TouchableOpacity 
                    className={`mx-[20px] mb-[5px] rounded-full h-[80px] w-[80px] overflow-hidden ${
                      selectedAdditives[additiveType.type] === item.id ? 'border-[4px] border-blue_500' : ''
                    }`}
                    onPress={() => {
                      setSelectedAdditives(prev => {
                        const newAdditives = { ...prev };
                        if (prev[additiveType.type] === item.id) {
                          delete newAdditives[additiveType.type];
                        } else {
                          newAdditives[additiveType.type] = item.id;
                        }
                        return newAdditives;
                      });
                      closeSheet();
                    }}
                  >
                    {item.attachmentUrls.length > 0 && (
                      <Image
                        source={{ uri: `${item.attachmentUrls?.[0]}` }}
                        style={{
                          width: '100%',
                          height: '100%'
                        }}
                        resizeMode="cover"
                      />
                    )}
                  </TouchableOpacity>
                  <Text className="text-white text-[14px] text-center">{item.name}</Text>
                  <Text className="text-mono_200 text-[14px] text-center">{item.price} ₸</Text>
                </View>
              )}
            />
          </ScrollableContainer>
        </View>
      </View>
    );
  }, [selectedAdditives, closeSheet, openSheet]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-mono_900">
        <SafeAreaView edges={['top', 'left', 'right']} className="bg-mono_900 mx-[24px] pb-[20px]">
          <View className="flex-row justify-end items-center">
            <TouchableOpacity onPress={() => router.push('/map')} className="p-[6px] items-center justify-center">
              <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <Path d="M2.31556 1.00772L6 4.69216L9.66535 1.02681C9.74631 0.940634 9.84384 0.871696 9.9521 0.82413C10.0603 0.776564 10.1771 0.75135 10.2953 0.75C10.5485 0.75 10.7913 0.850565 10.9703 1.02957C11.1493 1.20858 11.2498 1.45136 11.2498 1.70452C11.2521 1.82154 11.2304 1.93779 11.186 2.04612C11.1417 2.15445 11.0757 2.25259 10.9921 2.3345L7.27905 5.99985L10.9921 9.71292C11.1494 9.86682 11.2417 10.0752 11.2498 10.2952C11.2498 10.5483 11.1493 10.7911 10.9703 10.9701C10.7913 11.1491 10.5485 11.2497 10.2953 11.2497C10.1737 11.2547 10.0523 11.2344 9.93893 11.1901C9.82555 11.1457 9.72263 11.0782 9.63671 10.992L6 7.30753L2.32511 10.9824C2.24446 11.0657 2.14811 11.1322 2.04162 11.1781C1.93513 11.224 1.82061 11.2483 1.70467 11.2497C1.45152 11.2497 1.20873 11.1491 1.02973 10.9701C0.85072 10.7911 0.750155 10.5483 0.750155 10.2952C0.74793 10.1781 0.769642 10.0619 0.81396 9.95357C0.858278 9.84524 0.924266 9.7471 1.00787 9.66519L4.72095 5.99985L1.00787 2.28677C0.850556 2.13287 0.758307 1.92445 0.750155 1.70452C0.750155 1.45136 0.85072 1.20858 1.02973 1.02957C1.20873 0.850565 1.45152 0.75 1.70467 0.75C1.93376 0.752864 2.1533 0.845452 2.31556 1.00772Z" fill="white"/>
              </Svg>
            </TouchableOpacity>
          </View>
          <View className="w-full items-center mt-[32px]">
            <View style={{ width: 160, height: 180, backgroundColor: '#27272A', borderRadius: 8 }} />
            <View className="h-[24px] w-[120px] bg-mono_800 rounded-full mt-[20px]" />
            <View className="flex-row gap-4 mb-[20px] w-full mt-[20px]">
              {['s', 'm', 'l'].map((size) => (
                <View key={size} className="flex-1 h-[48px] bg-mono_800 rounded-full" />
              ))}
            </View>
            <View className="bg-mono_800 rounded-full w-full py-4 px-10 flex-row justify-between">
              {['Белки', 'Жиры', 'Углеводы', 'Калораж'].map((label) => (
                <View key={label} className="items-left">
                  <View className="h-[17px] w-[60px] bg-mono_700 rounded-full mb-1" />
                  <View className="h-[14px] w-[40px] bg-mono_700 rounded-full" />
                </View>
              ))}
            </View>
          </View>
        </SafeAreaView>
        <View className="flex-1 items-center mt-[16px]">
          <View className="flex-row gap-4 flex-wrap justify-center px-[24px]">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="bg-mono_800 rounded-[12px] h-[146px] w-[152px] mb-[16px]" />
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (error || !coffee) {
    return (
      <SafeAreaView className="bg-mono_900 h-full flex-1 justify-center items-center">
        <Text className="text-red-500">{error ? "Error loading coffee details" : "Coffee not found"}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-mono_900">
      <SafeAreaView edges={['top', 'left', 'right']}>
        <NavigationHeader showBack={true} showClose={true} />
        <View className="w-full items-center px-[20px] pb-[20px]">
          <View style={{ width: 160, height: 220 }}>
            {coffee?.attachmentUrls.length > 0 && (
              <Image  
                source={{ uri: `${coffee?.attachmentUrls?.[0]}` }}
                style={{ width: '100%', height: '100%', borderRadius: 8 }}
                resizeMode="cover"
              />
            )}
          </View>
          <Text className="text-white text-[24px] font-medium mt-[16px] mb-[20px]">{coffee?.name}</Text>
          <View className="flex-row gap-4">
            {(['s', 'm', 'l'] as const)
              .filter((size) => getPrice(size) !== null && getPrice(size) !== undefined)
              .map((size) => (
              <TouchableOpacity 
                key={size}
                onPress={() => setSelectedSize(size)}
                className={`flex-col flex-1 rounded-full w-[100px] h-[48px] items-center justify-center ${selectedSize === size ? 'bg-blue_500' : 'bg-mono_800'}`}
              >
                <Text className="text-white font-bold text-[18px]">
                  {size.toUpperCase()}
                  <Text className="text-white font-normal text-[14px]">  {getPrice(size)} ₸</Text>
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* <View className="bg-mono_800 rounded-full px-10 py-4 flex-row items-center justify-between w-full">
            <View className="items-left">
              <Text className="text-white text-[17px]">Белки</Text>
              <Text className="text-mono_500 text-[14px]">28 г</Text>
            </View>
            <View className="items-left">
              <Text className="text-white text-[17px]">Жиры</Text>
              <Text className="text-mono_500 text-[14px]">28 г</Text>
            </View>
            <View className="items-left">
              <Text className="text-white text-[17px]">Углеводы</Text>
              <Text className="text-mono_500 text-[14px]">28 г</Text>
            </View>
            <View className="items-left">
              <Text className="text-white text-[17px]">Калораж</Text>
              <Text className="text-mono_500 text-[14px]">28 ккал</Text>
            </View>
          </View> */}
        </View>
      </SafeAreaView>

      <View className="flex-1 px-[24px]">
        <FlatList
          contentContainerStyle={{ 
            paddingBottom: 100
          }}
          data={coffee.additiveTypes}
          keyExtractor={(item) => item.type}
          renderItem={({ item: additiveType }) => (
            <TouchableOpacity
              key={additiveType.type}
              className="bg-neutral-800 rounded-[12px] h-[146px] px-[16px] py-[12px] flex-1 min-w-[48%] max-w-[48%]"
              onPress={() => openBottomSheet(additiveType)}
            >
              <View className="absolute bottom-[20px] right-[20px]">
                {selectedAdditives[additiveType.type] ? (
                  <Image
                    source={{ 
                      uri: additiveType.additives.find(a => a.id === selectedAdditives[additiveType.type])?.attachmentUrls?.[0] 
                        ? `${additiveType.additives.find(a => a.id === selectedAdditives[additiveType.type])?.attachmentUrls?.[0]}`
                        : undefined
                    }}
                    style={{ width: 54, height: 54, opacity: 0.5 }}
                    resizeMode="cover"
                    className="rounded-full"
                  />
                ) : (
                  <Svg width="54" height="61" viewBox="0 0 54 61" fill="none" opacity={0.5}>
                    <Path d="M7.413 4.2597C7.28563 6.38864 7.59785 8.52102 8.33023 10.5241C9.0626 12.5271 10.1994 14.358 11.67 15.9027C8.81208 16.7221 6.25338 18.3533 4.30437 20.5984C2.35535 22.8435 1.09978 25.606 0.689996 28.5507C-0.298155 35.6173 1.15153 42.8097 4.8 48.9417L5.84999 50.7117L5.979 50.9007L10.227 56.6187C11.1267 57.8306 12.2798 58.8318 13.606 59.5526C14.9321 60.2735 16.3994 60.6966 17.9057 60.7925C19.4121 60.8885 20.9212 60.6549 22.3281 60.1082C23.735 59.5615 25.0058 58.7146 26.052 57.6267C26.1743 57.4995 26.3211 57.3983 26.4835 57.3292C26.6458 57.26 26.8205 57.2244 26.997 57.2244C27.1735 57.2244 27.3482 57.26 27.5105 57.3292C27.6729 57.3983 27.8197 57.4995 27.942 57.6267C28.9882 58.7146 30.259 59.5615 31.6659 60.1082C33.0728 60.6549 34.5819 60.8885 36.0882 60.7925C37.5946 60.6966 39.0619 60.2735 40.388 59.5526C41.7142 58.8318 42.8672 57.8306 43.767 56.6187L48.015 50.8977L48.141 50.7087L49.194 48.9387C52.8442 42.8094 54.2971 35.6194 53.313 28.5537C53.0225 26.4717 52.3078 24.4716 51.2131 22.677C50.1184 20.8824 48.6669 19.3317 46.9487 18.1207C45.2304 16.9097 43.2818 16.0644 41.2236 15.6369C39.1654 15.2095 37.0414 15.2091 34.983 15.6357L29.28 16.8177H29.271C29.361 14.4777 29.727 11.9577 30.444 9.8037C31.314 7.1997 32.52 5.6337 33.864 5.0757C34.415 4.84576 34.8521 4.40636 35.0791 3.85415C35.3061 3.30195 35.3044 2.68219 35.0745 2.1312C34.8446 1.58021 34.4052 1.14314 33.853 0.916126C33.3008 0.689113 32.681 0.690758 32.13 0.920701C28.974 2.2377 27.18 5.3607 26.175 8.3787L26.037 8.8047C25.299 7.37665 24.3448 6.07124 23.208 4.9347C21.6522 3.37692 19.7833 2.16749 17.7248 1.38653C15.6664 0.605572 13.4655 0.270905 11.268 0.404701C10.2651 0.462426 9.31834 0.88622 8.6072 1.5957C7.89607 2.30517 7.47006 3.25098 7.41 4.2537" fill="#58595B"/>
                  </Svg>
                )}
              </View>
              <View className="relative z-10">
                {selectedAdditives[additiveType.type] 
                ? <View className="flex gap-[4px]">
                    <Text className="text-white text-[18px]">
                    {additiveType.additives.find(a => a.id === selectedAdditives[additiveType.type])?.name}
                    </Text>
                    <Text className="text-mono_500 text-[14px]">
                      {formatType(additiveType.type)}
                    </Text>
                  </View>
                : <View>
                    <Text className="text-white text-[18px]">
                      {formatType(additiveType.type)}
                    </Text>
                </View>}
              </View>
            </TouchableOpacity>
          )}
          numColumns={2}
          columnWrapperStyle={{ 
            justifyContent: 'space-between',
            marginVertical: 8,
            width: '100%'
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View className="absolute bottom-0 left-0 right-0 bg-transparent">
        <SafeAreaView edges={['bottom']}>
          <View className="items-center px-[24px] gap-[12px]">
            <CustomButton 
              text="Заказать" 
              onPress={() => handleAddToBag(true)}
              disabled={!selectedSize}
            />
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

export default CoffeeDetails;