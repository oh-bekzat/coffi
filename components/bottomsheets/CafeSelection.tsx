import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { CustomInput, ScrollableContainer } from '../index';
import { useGetCafes, useGetCafesByCoffee } from '../../hooks/useCafe';
import debounce from 'lodash/debounce';
import { Cafe as CafeProps } from "../../api/cafe";
import { useBottomSheetStore } from '../../stores/bottomSheetStore';
import Cafe from "./Cafe";

interface CafeSelectionProps {
  onClose: () => void;
  onSelect: (cafe: CafeProps) => Promise<void>;
  coffeeId?: string;
  isSubscription?: boolean;
}

const CafeSelection = ({ onClose, onSelect, coffeeId, isSubscription = false }: CafeSelectionProps) => {
  const { openSheet, closeSheet } = useBottomSheetStore();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const { data: regularCafes, isLoading: regularCafesLoading, error: regularCafesError } = useGetCafes(debouncedSearch);
  const { data: coffeeSpecificCafes, isLoading: coffeeSpecificCafesLoading, error: coffeeSpecificCafesError } = useGetCafesByCoffee(coffeeId ?? "", debouncedSearch);
  
  const cafes = coffeeId ? coffeeSpecificCafes : regularCafes;

  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      if (value.length >= 3) {
        setDebouncedSearch(value);
      } else {
        setDebouncedSearch("");
      }
    }, 2000),
    []
  );

  const handleSearch = (value: string) => {
    setSearchValue(value);
    debouncedSetSearch(value);
  };

  const openBottomSheet = (cafe: CafeProps) => {
    const schedule = getDaySchedule(cafe);
    openSheet(
      <Cafe 
        cafe={cafe} 
        schedule={schedule} 
        onClose={closeSheet}
        fromMap={false}
        coffeeId={coffeeId}
      />
    );
  };

  const getDaySchedule = (cafe: CafeProps) => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    
    if (cafe.openingSchedule && cafe.openingSchedule.length > dayIndex) {
      const daySchedule = cafe.openingSchedule[dayIndex];
      const formattedCloseTime = formatTime(daySchedule.closeTime);
      
      // Return null if cafe is closed (closeTime is null)
      if (!formattedCloseTime) return null;
      
      return {
        openTime: daySchedule.openTime,
        closeTime: formattedCloseTime
      };
    }
    return null;
  };

  const formatTime = (time: string | null) => {
    if (!time) return null;
    return time.split(':').slice(0, 2).join(':');
  };

  const renderCafe = ({ item: cafe }: { item: CafeProps }) => {
    const schedule = getDaySchedule(cafe);
    const isClosed = !schedule;
    
    return (
      <TouchableOpacity 
        onPress={() => isSubscription ? onSelect(cafe) : openBottomSheet(cafe)}
        className="bg-mono_700 w-[152px] rounded-[13px] p-[16px]"
      >
        <Text className="text-white text-[17px] font-medium mb-[4px]">{cafe.name}</Text>
        <Text className="text-mono_400 text-[12px] mb-[8px]">
          {cafe.streetName}, {cafe.streetNumber}
        </Text>
        {cafe.attachmentUrls?.[0] && (
          <Image
            source={{ uri: `${cafe.attachmentUrls[0]}` }}
            className="w-[120px] h-[196px] rounded-[12px] mb-[12px]"
            resizeMode="cover"
          />
        )}
        <View className="flex-row mt-[4px] items-center">
          <View className="bg-blue_500 px-[8px] py-[4px] rounded-full">
            <Text className="text-white text-[12px]">
              {cafe.rating} ({cafe.ratingCount})
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (regularCafesLoading || coffeeSpecificCafesLoading) {
    return (
      <View className="mt-[24px] px-[24px]">
        <Text className="text-mono_500 text-[14px] text-center mb-[22px]">
          Выбор кофейни
        </Text>
        <Text className="text-white font-semibold text-[32px] leading-[41px] mb-[22px] text-center">
          Давайте выберем кофейню
        </Text>
        
        {isSubscription && (
          <View className="bg-blue_700 p-[16px] rounded-[12px] mb-[16px]">
            <Text className="text-white text-[14px] text-center leading-[18px]">
              Подписка работает во всех филиалах. Эта информация нужна нам для анализа.
            </Text>
          </View>
        )}
        
        <CustomInput
          onChangeText={() => {}} 
          value="" 
          placeholder="Поиск заведения" 
        />

        <View className="mt-[20px] px-[32px]">
          <ScrollableContainer>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {[1, 2, 3].map((i) => (
                <View key={i} className="bg-mono_700 w-[152px] rounded-[13px] p-[16px]">
                  <View className="h-[20px] w-[100px] bg-mono_800 rounded-full mb-[4px]" />
                  <View className="h-[24px] w-[120px] bg-mono_800 rounded-full mb-[8px]" />
                  <View className="w-[120px] h-[196px] rounded-[12px] mb-[12px] bg-mono_800" />
                  <View className="flex-row mt-[4px] items-center">
                    <View className="bg-mono_800 w-[60px] h-[24px] rounded-full" />
                  </View>
                </View>
              ))}
            </ScrollView>
          </ScrollableContainer>
        </View>
      </View>
    );
  }

  const filteredCafes = isSubscription ? cafes : cafes?.filter(cafe => cafe.isOpen);

  return (
    <View className="mt-[24px] px-[24px]">
      <Text className="text-mono_500 text-[14px] text-center mb-[22px]">
        Выбор кофейни
      </Text>
      <Text className="text-white font-semibold text-[32px] leading-[41px] mb-[22px] text-center">
        Давайте выберем кофейню
      </Text>
      
      {isSubscription && (
        <View className="bg-blue_700 p-[16px] rounded-[12px] mb-[16px]">
          <Text className="text-white text-[14px] text-center leading-[18px]">
            Подписка работает во всех филиалах. Эта информация нужна нам для анализа.
          </Text>
        </View>
      )}
      
      <CustomInput
        onChangeText={handleSearch} 
        value={searchValue} 
        placeholder="Поиск заведения"
      />

      {filteredCafes && filteredCafes.length > 0 && (
        <ScrollableContainer>
          <FlatList
            data={filteredCafes}
            renderItem={renderCafe}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 20, gap: 12 }}
            keyExtractor={(item) => item.id}
          />
        </ScrollableContainer>
      )}
    </View>
  );
}; 

export default CafeSelection;