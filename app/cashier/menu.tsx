import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMenuFoods, useMenuDrinks, useMenuAdditives } from '../../hooks/useMenu';
import { useChangeMenuItemAvailability, useChangeAdditiveAvailability } from '../../hooks/useCashier';
import { useAuthStore } from '../../stores/authStore';
import { MenuItem, MenuAdditive } from '../../types/menu';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmAvailabilityChange from '../../components/bottomsheets/ConfirmAvailabilityChange';
import { useBottomSheetStore } from '../../stores/bottomSheetStore';
import { router } from 'expo-router';
import { CustomButton } from '../../components';
import { useLogout } from '../../hooks/useAuth';
import RefreshableView from '../../components/RefreshableView';
import { useQueryClient } from '@tanstack/react-query';

const MenuPage = () => {
  const { cafe_id } = useAuthStore();
  const { openSheet, closeSheet } = useBottomSheetStore();
  const logout = useLogout();
  const queryClient = useQueryClient();

  if (!cafe_id) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text>Нет доступа к меню</Text>
      </View>
    );
  }

  const handleChangeItemAvailability = (item: MenuItem) => {
    changeItemAvailability.mutate({
      cafe_id: cafe_id,
      item_id: item.id,
      available: !item.available
    });
  }

  const handleChangeAdditiveAvailability = (additive: MenuAdditive) => {
    changeAdditive.mutate({
      cafe_id: cafe_id,
      additive_id: additive.id,
      available: !additive.available
    });
  }

  const { data: foods, isLoading: foodsLoading } = useMenuFoods(cafe_id);
  const { data: drinks, isLoading: drinksLoading } = useMenuDrinks(cafe_id);
  const { data: additives, isLoading: additivesLoading } = useMenuAdditives(cafe_id);

  const changeItemAvailability = useChangeMenuItemAvailability();
  const changeAdditive = useChangeAdditiveAvailability();

  const handleRefresh = useCallback(async () => {
    if (cafe_id) {
      await queryClient.invalidateQueries({ queryKey: ['foods', cafe_id] });
      await queryClient.invalidateQueries({ queryKey: ['drinks', cafe_id] });
      await queryClient.invalidateQueries({ queryKey: ['additives', cafe_id] });
    }
  }, [queryClient, cafe_id]);

  const sortByAvailability = <T extends { available: boolean }>(items: T[]): T[] => {
    return [...items].sort((a, b) => (a.available === b.available ? 0 : a.available ? 1 : -1));
  };

  const renderMenuItem = (item: MenuItem, type: 'food' | 'drink') => {    
    return (
      <TouchableOpacity
        key={item.id}
        className={`px-[20px] py-[14px] rounded-[12px] mb-[8px] flex-row items-center ${
          item.available ? 'bg-green_300' : 'bg-red_300'
        }`}
        onPress={() => {
          openSheet(
            <ConfirmAvailabilityChange
              isStop={item.available}
              itemName={item.name}
              onConfirm={() => handleChangeItemAvailability(item)}
              onClose={closeSheet}
            />
          );
        }}
      >
        <Text className="text-[16px] font-medium text-black">{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderAdditive = (additive: MenuAdditive) => {
    return (
      <TouchableOpacity
        key={additive.id}
        className={`px-[20px] py-[14px] rounded-[12px] mb-[8px] flex-row items-center ${
          additive.available ? 'bg-green_300' : 'bg-red_300'
        }`}
        onPress={() => {
          openSheet(
            <ConfirmAvailabilityChange
              isStop={additive.available}
              itemName={additive.name}
              onConfirm={() => handleChangeAdditiveAvailability(additive)}
              onClose={closeSheet}
            />
          );
        }}
      >
        <Text className="text-[16px] font-medium text-black">{additive.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderCategorySection = (categoryName: string, items: MenuItem[], type: 'food' | 'drink') => {
    const sortedItems = sortByAvailability(items);
    
    return (
      <View key={categoryName} className="mb-[16px]">
        <Text className="text-[20px] text-mono_400 font-semibold mb-[12px]">{categoryName}</Text>
        {sortedItems.map(item => renderMenuItem(item, type))}
      </View>
    );
  };

  if (foodsLoading || drinksLoading || additivesLoading) {
    return (
      <LoadingSpinner />
    );
  }

  const handleLogout = async () => {
    try {
      closeSheet();
      logout.mutate();
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось выйти из системы.");
    }
  };

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

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-mono_900">
      <View className="flex-row items-center">
        <TouchableOpacity onPress={() => router.push(`/cashier`)} className="w-1/3 py-[24px] rounded-[12px]"><Text className="text-white text-center text-[17px]">Заказы</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/cashier/scanner`)} className="w-1/3 py-[24px] rounded-[12px]"><Text className="text-white text-center text-[17px]">Камера</Text></TouchableOpacity>
        <TouchableOpacity onPress={openLogoutBottomSheet} className="w-1/3 py-[24px] rounded-[12px]"><Text className="text-white text-center text-[17px]">Выйти</Text></TouchableOpacity>
      </View>
      <View className="px-[20px]">
        <Text className="text-[32px] text-white font-bold mb-[18px]">Управление меню</Text>
      </View>
      <RefreshableView 
        className="flex-1 px-[20px]" 
        showsVerticalScrollIndicator={false}
        queryKeys={cafe_id ? [['foods', cafe_id], ['drinks', cafe_id], ['additives', cafe_id]] : []}
        onRefresh={handleRefresh}
      >
        <View className="mb-[20px]">
          <Text className="text-[24px] text-white font-bold mb-[18px]">Еда</Text>
          {foods && foods.map(category => renderCategorySection(category.categoryName, category.items, 'food'))}
        </View>

        <View className="mb-[20px]">
          <Text className="text-[24px] text-white font-bold mb-[18px]">Напитки</Text>
          {drinks && drinks.map(category => renderCategorySection(category.categoryName, category.items, 'drink'))}
        </View>

        <View className="mb-[100px]">
          <Text className="text-[24px] text-white font-bold mb-[18px]">Добавки</Text>
          {additives && sortByAvailability(additives).map(renderAdditive)}
        </View>
      </RefreshableView>
    </SafeAreaView>
  );
};

export default MenuPage;