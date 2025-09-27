import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useBagStore } from '../stores/bagStore';
import { useOrderCoffee, useDisplayOrder, useSetArrivalStatus } from '../hooks/useCoffee';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomButton } from '../components';
import { router } from 'expo-router';
import { useBottomSheetStore } from '../stores/bottomSheetStore';
import BagCafeSection from '../components/BagCafeSection';
import BagCoffeeCard from '../components/BagCoffeeCard';
import Svg, { Path } from 'react-native-svg';
import BagFoodCard from '../components/BagFoodCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useOrders } from '../hooks/useOrders';
import { useGiveAwayStore } from '../hooks/useOrders';
import NavigationHeader from '../components/NavigationHeader';
import { Cards, OrderOptionsSheet } from '../components/bottomsheets';
import Toast from 'react-native-toast-message';
import AuthGuard from '../components/AuthGuard';
import RefreshableView from '../components/RefreshableView';
import { useQueryClient } from '@tanstack/react-query';

const BagPage = () => {
  // Use individual selectors for better performance
  const cafe = useBagStore(state => state.cafe);
  const coffees = useBagStore(state => state.coffees);
  const foods = useBagStore(state => state.foods);
  const removeCoffee = useBagStore(state => state.removeCoffee);
  const removeFood = useBagStore(state => state.removeFood);
  const clearBag = useBagStore(state => state.clearBag);
  const hasHydrated = useBagStore(state => state._hasHydrated);
  const queryClient = useQueryClient();
  
  // Track selected card ID
  const [orderOptions, setOrderOptions] = useState<{
    orderType: 'in_cafe' | 'pickup',
    clientComment: string
  } | null>(null);
  
  const { mutateAsync: orderCoffee, isPending: isOrdering } = useOrderCoffee();
  const { mutateAsync: setArrivalStatus, isPending: isSettingArrivalStatus } = useSetArrivalStatus();
  const { openSheet, closeSheet } = useBottomSheetStore();
  const { orders, isLoading } = useOrders(['new', 'in_progress', 'completed', 'cancelled', 'picked_up']);
  const pendingPickups = useGiveAwayStore(state => state.pendingPickups);
  
  const handleRefresh = useCallback(async () => {
    // Manually refetch orders data
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
  }, [queryClient]);

  const hasPickupCode = useCallback((orderId: string) => {
    return !!pendingPickups[orderId];
  }, [pendingPickups]);

  const getStatusText = useCallback((status: string) => {
    const statusMap: Record<string, string> = {
      'new': 'Новый',
      'in_progress': 'В процессе',
      'completed': 'Подойдите к кассе',
      'picked_up': 'Выдан',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const colorMap: Record<string, string> = {
      'new': 'bg-green_700',
      'in_progress': 'bg-yellow-400',
      'completed': 'bg-blue_500',
      'cancelled': 'bg-red_500',
      'picked_up': 'bg-mono_700'
    };
    return colorMap[status] || 'bg-mono_500';
  }, []);

  const handlePlaceOrder = async (
    cardId?: string,
    options?: { orderType: 'in_cafe' | 'pickup'; clientComment: string }
  ) => {
    try {
      // Ensure we have valid data structure
      const orderData: any = {
        coffees: coffees || [],
        food: foods || [],
      };

      // Add cardId if provided
      if (cardId) {
        orderData.cardId = cardId;
      }

      // Add options if provided
      if (options) {
        if (options.orderType) {
          orderData.orderType = options.orderType;
        }
        if (options.clientComment && options.clientComment.trim() !== '') {
          orderData.clientComment = options.clientComment.trim();
        }
      }

      const result = await orderCoffee({
        data: orderData,
        cafeId: cafe?.id || "",
      });
  
      if (!cardId && result?.url) {
        openSheet(
          <Cards
            onClose={closeSheet}
            isOrderFlow
            cardlessWebViewUrlFromBag={result.url}
          />
        );
      } else {
        clearBag();
      }
    } catch (error) {
      Toast.show({ type: 'tomatoToast', text1: 'Ошибка при оформлении заказа', position: 'top' });
      closeSheet();
    }
  };
  

  // Get display order data for price calculation and display
  const { data: displayOrderData, isLoading: isLoadingDisplayOrder, error: displayOrderError } = useDisplayOrder({
    coffees: coffees || [],
    food: foods || [],
    cafeId: cafe?.id || null
  });

  // Handle display order errors by clearing bag
  useEffect(() => {
    if (displayOrderError && ((coffees && coffees.length > 0) || (foods && foods.length > 0))) {
      // Clear bag when items are no longer available
      clearBag();
      
      // Show user-friendly message
      Toast.show({
        type: 'tomatoToast',
        text1: 'Товары недоступны, корзина очищена',
        position: 'top'
      });
    }
  }, [displayOrderError, coffees?.length, foods?.length, clearBag]);

  // Open order options bottom sheet
  const handleOrderOptions = () => {
    openSheet(
      <OrderOptionsSheet
        onClose={closeSheet}
        onConfirm={(orderType, comment) => {
          const opts = { orderType, clientComment: comment };
          setOrderOptions(opts); // keep for UI if needed
          closeSheet();
        
          if (displayOrderData?.totalPrice === 0) {
            handlePlaceOrder(undefined, opts);
          } else {
            openSheet(
              <Cards
                onClose={closeSheet}
                onSelectCard={(cardId) => handlePlaceOrder(cardId, opts)}
                isOrderFlow
              />
            );
          }
        }}
      />
    );
  };

  // Show loading spinner while store is hydrating or orders are loading
  if (!hasHydrated || isLoading) {
    return <LoadingSpinner />;
  }

  if ((!coffees || coffees.length === 0) && (!foods || foods.length === 0) && (!orders || orders.length === 0)) {
    return (
      <SafeAreaView className="bg-mono_900 flex-1">
        <NavigationHeader showBack={true} showClose={true} />
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-xl mb-4">Корзина пуста</Text>
          <CustomButton
            text="Смотреть меню" 
            onPress={() => router.push("/coffee")} 
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-mono_900 h-full flex-1">
      <NavigationHeader showBack={true} showClose={true} />
      <View className="flex-1 px-[20px] pb-[20px]">
        <RefreshableView 
          queryKeys={[['orders']]} 
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        >
          {((coffees && coffees.length > 0) || (foods && foods.length > 0)) && (
            <View className="mb-[16px]">
              <Text className="text-white text-[22px] font-bold mb-[16px]" onPress={() => {clearBag()}}>Текущий заказ</Text>
              <BagCafeSection
                cafe={cafe}
                coffees={coffees || []}
                foods={foods || []}
                onRemoveCoffee={removeCoffee}
                onRemoveFood={removeFood}
                displayOrderData={displayOrderData}
                isLoading={isLoadingDisplayOrder}
              />
            </View>
          )}

          {orders && orders?.length > 0 && (
            <>
              <Text className="text-white text-[22px] font-bold mb-[16px]">История заказов</Text>
              <View>
                <ScrollView
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                >
                  {orders.map((order, index) => (
                    <View key={order.id} className='mr-[12px] rounded-[24px] p-[12px] bg-mono_800'>
                      {order.cafeName && <Text className='text-white text-[14px] text-center mb-[12px]'>{order.cafeName}</Text>}
                      <View className="w-full flex-row gap-[12px]">
                        {order.status === 'completed' && hasPickupCode(order.id) && (
                          <TouchableOpacity 
                            onPress={() => router.push(`/qr/${order.id}`)}
                            className="w-[161px] h-[161px] bg-mono_700 rounded-[16px] justify-center items-center"
                          >
                            <Svg viewBox="0 0 256 256" fill="#1D1D1D">
                              <Path d="m100.00244 36h-44a20.02229 20.02229 0 0 0 -20 20v44a20.02229 20.02229 0 0 0 20 20h44a20.02229 20.02229 0 0 0 20-20v-44a20.02229 20.02229 0 0 0 -20-20zm-4 60h-36v-36h36z"/>
                              <Path d="m100.00244 136h-44a20.02229 20.02229 0 0 0 -20 20v44a20.02229 20.02229 0 0 0 20 20h44a20.02229 20.02229 0 0 0 20-20v-44a20.02229 20.02229 0 0 0 -20-20zm-4 60h-36v-36h36z"/>
                              <Path d="m200.00244 36h-44a20.02229 20.02229 0 0 0 -20 20v44a20.02229 20.02229 0 0 0 20 20h44a20.02229 20.02229 0 0 0 20-20v-44a20.02229 20.02229 0 0 0 -20-20zm-4 60h-36v-36h36z"/>
                              <Path d="m148.00244 184a12.0006 12.0006 0 0 0 12-12v-24a12 12 0 0 0 -24 0v24a12.0006 12.0006 0 0 0 12 12z"/>
                              <Path d="m208.00244 152h-12v-4a12 12 0 0 0 -24 0v48h-24a12 12 0 1 0 0 24h36a12.0006 12.0006 0 0 0 12-12v-32h12a12 12 0 0 0 0-24z"/>
                            </Svg>
                          </TouchableOpacity>
                        )}
                        {order.coffees.map((coffee, index) => (
                          <BagCoffeeCard 
                            key={`${order.id}-${coffee.id}-${index}`}
                            coffee={coffee}
                            size={coffee.cupSize as 's' | 'm' | 'l'}
                            additives={coffee.additives}
                            isHidable={false}
                            hidePrice={true}
                            fromBag={true}
                          />
                        ))}
                        {order.food.map((food, index) => (
                          <BagFoodCard 
                            key={`${order.id}-${food.id}-${index}`}
                            food={food}
                            noPrice={true}
                          />
                        ))}
                      </View>
                      {!order.arrivalTime && (order.status === 'new' || order.status === 'in_progress') ? <View className='w-full flex-row flex-wrap gap-[12px] mt-[12px]'>
                        <TouchableOpacity className='bg-mono_700 rounded-full px-[12px] py-[6px]' onPress={() => {setArrivalStatus({orderId: order.id, arrivalStatus: 'here'})}} disabled={isSettingArrivalStatus}><Text className='text-white text-[14px]'>Я рядом</Text></TouchableOpacity>
                        <TouchableOpacity className='bg-mono_700 rounded-full px-[12px] py-[6px]' onPress={() => {setArrivalStatus({orderId: order.id, arrivalStatus: 'min_5'})}} disabled={isSettingArrivalStatus}><Text className='text-white text-[14px]'>5 мин</Text></TouchableOpacity>
                        <TouchableOpacity className='bg-mono_700 rounded-full px-[12px] py-[6px]' onPress={() => {setArrivalStatus({orderId: order.id, arrivalStatus: 'min_10'})}} disabled={isSettingArrivalStatus}><Text className='text-white text-[14px]'>10 мин</Text></TouchableOpacity>
                        <TouchableOpacity className='bg-mono_700 rounded-full px-[12px] py-[6px]' onPress={() => {setArrivalStatus({orderId: order.id, arrivalStatus: 'min_15'})}} disabled={isSettingArrivalStatus}><Text className='text-white text-[14px]'>15 мин</Text></TouchableOpacity>
                        <TouchableOpacity className='bg-mono_700 rounded-full px-[12px] py-[6px]' onPress={() => {setArrivalStatus({orderId: order.id, arrivalStatus: 'min_20'})}} disabled={isSettingArrivalStatus}><Text className='text-white text-[14px]'>20 мин</Text></TouchableOpacity>
                      </View> :
                      <View className='flex-row gap-[8px] items-center mt-[12px] px-[4px]'>
                        <View className={`w-[12px] h-[12px] rounded-full ${getStatusColor(order.status)}`}></View>
                        <Text className='text-white text-[14px]'>{getStatusText(order.status)}{order.status === 'cancelled' && `: ${order.cancellationReason}`}</Text>
                      </View>
                      }
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          )}
        </RefreshableView>
      </View>

      {((coffees && coffees.length > 0) || (foods && foods.length > 0)) && (
        <SafeAreaView edges={['bottom']} className="px-[24px] pt-[24px] items-center">
          <CustomButton
            text="Оформить заказ" 
            onPress={handleOrderOptions}
            disabled={isOrdering}
          />
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
};

export default function Bag() {
  return (
    <AuthGuard>
      <BagPage />
    </AuthGuard>
  );
}