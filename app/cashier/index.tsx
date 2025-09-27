import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTakeOrder, useCompleteOrder, useCancelOrder } from '../../hooks/useCashier';
import { format, addDays, parseISO, differenceInSeconds } from 'date-fns';
import { useBottomSheetStore } from "../../stores/bottomSheetStore";
import BagCoffeeCard from '../../components/BagCoffeeCard';
import CustomButton from '../../components/CustomButton';
import CancelOrderSheet from '../../components/bottomsheets/CancelOrderSheet';
import { router } from 'expo-router';
import BagFoodCard from '../../components/BagFoodCard';
import { useCashierOrders } from '../../hooks/useCashierOrders';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../api/fetch';
import { useLogout } from "../../hooks/useAuth";
import LoadingSpinner from '../../components/LoadingSpinner';
import RefreshableView from '../../components/RefreshableView';
import { OrdersRequest } from '../../api/cashier';
import { Order } from '../../types/order';
import { useWebSocketStore } from '../../hooks/useWebSocket';

// TODO relevantTime should be calculated

// Define a type that extends Order to include relevantTime
// type MockOrder = Order & { relevantTime: string };

// Function to calculate relevantTime based on order status
const calculateRelevantTime = (order: any): string => {
  if (!order) return '';
  
  // Get the relevant timestamp based on order status
  let timestamp = order.createdAt; // Default to createdAt
  
  if (order.status === 'in_progress' && order.inProgressAt) {
    timestamp = order.inProgressAt;
  } else if (order.status === 'completed' && order.completedAt) {
    timestamp = order.completedAt;
  } else if (order.status === 'picked_up' && order.pickedUpAt) {
    timestamp = order.pickedUpAt;
  } else if (order.status === 'cancelled' && order.cancelledAt) {
    timestamp = order.cancelledAt;
  }
  
  // If no timestamp available, return empty string
  if (!timestamp) return '';
  
  // Convert to local time and format
  try {
    const date = parseISO(timestamp);
    return format(date, 'HH:mm');
  } catch (error) {
    return '';
  }
};

// Function to translate arrival status
const translateArrivalStatus = (status: string | null): string => {
  if (!status) return '';
  
  const statusMap: Record<string, string> = {
    'here': 'тут',
    'min_5': '5 мин.',
    'min_10': '10 мин.',
    'min_15': '15 мин.',
    'min_20': '20 мин.'
  };
  
  return statusMap[status] || status;
};

// Mock data for testing
/*
const mockOrders: MockOrder[] = [
  {
    id: "mock-order-1",
    cafeId: "cafe-1",
    clientId: "client-1",
    clientUsername: "Тестовый Клиент",
    clientPhoneNumber: "+7777777777",
    totalPrice: 1500,
    coffees: [
      {
        id: "coffee-1",
        name: "Капучино",
        cupSize: "m",
        price: 1000,
        isSub: false,
        attachmentUrls: ["https://example.com/coffee.jpg"],
        additives: [
          {
            id: "additive-1",
            name: "Сироп карамель",
            price: 200,
            type: "syrup",
            attachmentUrls: []
          }
        ]
      }
    ],
    food: [
      {
        id: "food-1",
        name: "Круассан",
        price: 500,
        attachmentUrls: ["https://example.com/croissant.jpg"]
      }
    ],
    arrivalStatus: "here",
    arrivalTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    cancellationReason: null,
    status: "new",
    createdAt: new Date().toISOString(),
    inProgressAt: null,
    completedAt: null,
    pickedUpAt: null,
    cancelledAt: null,
    clientComment: "Без сахара, пожалуйста",
    orderType: "in_cafe",
    relevantTime: "5 мин"
  },
  {
    id: "mock-order-2",
    cafeId: "cafe-1",
    clientId: "client-2",
    clientUsername: "Иван Иванов",
    clientPhoneNumber: "+7999999999",
    totalPrice: 2200,
    coffees: [
      {
        id: "coffee-2",
        name: "Латте",
        cupSize: "l",
        price: 1200,
        isSub: false,
        attachmentUrls: ["https://example.com/latte.jpg"],
        additives: []
      },
      {
        id: "coffee-3",
        name: "Эспрессо",
        cupSize: "s",
        price: 500,
        isSub: false,
        attachmentUrls: ["https://example.com/espresso.jpg"],
        additives: []
      }
    ],
    food: [
      {
        id: "food-2",
        name: "Чизкейк",
        price: 500,
        attachmentUrls: ["https://example.com/cheesecake.jpg"]
      }
    ],
    arrivalStatus: "min_10",
    arrivalTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    cancellationReason: null,
    status: "in_progress",
    createdAt: new Date().toISOString(),
    inProgressAt: new Date().toISOString(),
    completedAt: null,
    pickedUpAt: null,
    cancelledAt: null,
    clientComment: null,
    orderType: "pickup",
    relevantTime: "10 мин"
  }
];
*/

const CashierScreen = () => {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [disabledButtons, setDisabledButtons] = useState<Record<string, boolean>>({});
  const today = new Date();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  const { mutate: takeOrder } = useTakeOrder();
  const { mutate: completeOrder } = useCompleteOrder();
  const { mutate: cancelOrder } = useCancelOrder();
  const { openSheet, closeSheet } = useBottomSheetStore();
  const logout = useLogout();
  const [appInitialized, setAppInitialized] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { isConnected, isConnecting, lastHeartbeat, sendTestMessage } = useWebSocketStore();

  // Wait a moment before loading orders to ensure QueryClient is ready
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAppInitialized(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Debug WebSocket connection status
  // useEffect(() => {
  //   console.log('[Cashier] WebSocket status - isConnected:', isConnected, 'isConnecting:', isConnecting);
  // }, [isConnected, isConnecting]);

  // Setup timer to update countdown every second
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const ordersRequest: OrdersRequest = useMemo(() => ({
    // date_from: format(yesterday, 'yyyy-MM-dd'),
    // date_to: format(tomorrow, 'yyyy-MM-dd'),
    statuses: ['new', 'in_progress', 'completed'],
    before_minutes: '60'
  }), []);

  const { orders = [], isLoading } = useCashierOrders(ordersRequest);
  
  // Use mock orders if API returns empty array
  // const orders = apiOrders.length > 0 ? apiOrders : mockOrders;

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['cashier-orders'] });
  }, [queryClient]);

  const { mutate: giveAwayOrder } = useMutation({
    mutationFn: async (orderId: string) => {
      // Disable button for 3 seconds
      setDisabledButtons(prev => ({ ...prev, [orderId]: true }));
      setTimeout(() => {
        setDisabledButtons(prev => ({ ...prev, [orderId]: false }));
      }, 3000);
      
      return fetchApi(`/cashier/order/${orderId}/give-away`, {
        method: 'POST'
      });
    },
    onError: (error) => {
      Alert.alert('Ошибка', 'Не удалось создать код выдачи');
    }
  });

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'new': 'Новый',
      'in_progress': 'В процессе',
      'completed': 'Готов',
      'picked_up': 'Выдан',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
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

  const handleCancel = (orderId: string) => {
    setSelectedOrder(orderId);
    openSheet(<CancelOrderSheet onConfirm={handleCancelConfirm} onClose={closeSheet} />);
  };

  const handleCancelConfirm = (reason: string) => {
    if (!selectedOrder) return;
    
    cancelOrder(
      { order_id: selectedOrder, reason },
      {
        onError: (error) => {
          Alert.alert('Error', error.message);
        },
      }
    );
  };

  const formatArrivalTime = (utcTimeString: string | null) => {
    if (!utcTimeString) return null;
    
    // Parse the UTC time string to a Date object (automatically converts to local time)
    const arrivalTime = parseISO(utcTimeString);
    const now = new Date();
    
    // Calculate time difference in seconds
    const seconds = differenceInSeconds(arrivalTime, now);
    
    // Format the arrival time display
    const formattedTime = format(arrivalTime, 'HH:mm');
    
    if (seconds <= 0) {
      // Client is late
      const lateBy = Math.abs(seconds);
      const lateMinutes = Math.floor(lateBy / 60);
      const lateSeconds = lateBy % 60;
      
      if (lateMinutes > 0) {
        return `Опаздывает на ${lateMinutes} мин ${lateSeconds} сек (${formattedTime})`;
      } else {
        return `Опаздывает на ${lateSeconds} сек (${formattedTime})`;
      }
    } else {
      // Client is expected to arrive in the future
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (minutes > 0) {
        return `Прибудет в ${formattedTime} (через ${minutes} мин ${remainingSeconds < 10 ? '0' : ''}${remainingSeconds} сек)`;
      } else {
        return `Прибудет в ${formattedTime} (через ${remainingSeconds} сек)`;
      }
    }
  };

  return (
    <SafeAreaView className="bg-mono_900 flex-1">
      <View className="flex-row items-center">
        <TouchableOpacity onPress={() => router.push(`/cashier/menu`)} className="w-1/3 py-[24px] rounded-[12px]"><Text className="text-white text-center text-[17px]">Меню</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/cashier/scanner`)} className="w-1/3 py-[24px] rounded-[12px]"><Text className="text-white text-center text-[17px]">Камера</Text></TouchableOpacity>
        <TouchableOpacity onPress={openLogoutBottomSheet} className="w-1/3 py-[24px] rounded-[12px]"><Text className="text-white text-center text-[17px]">Выйти</Text></TouchableOpacity>
      </View>
      <View className="px-[20px]">
        <Text className="text-[32px] text-white font-bold mb-[18px]">Заказы</Text>
        {/* WebSocket Connection Status Debug */}
        <View className="mb-[16px]">
          {/* <View className="flex-row items-center mb-[8px]">
            <View className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green_500' : isConnecting ? 'bg-yellow_500' : 'bg-red_500'}`} />
            <View className="flex-1">
              <Text className="text-white text-[14px]">
                WebSocket: {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
              </Text>
              {lastHeartbeat && (
                <Text className="text-mono_400 text-[12px]">
                  Last heartbeat: {Math.floor((Date.now() - lastHeartbeat) / 1000)}s ago
                </Text>
              )}
            </View>
          </View> */}
          {isConnected && (
            <TouchableOpacity 
              onPress={() => {
                const result = sendTestMessage();
                // console.log('[Cashier] Test message sent:', result);
              }}
              className="bg-blue_500 px-3 py-1 rounded-md self-start"
            >
              <Text className="text-white text-[12px]">Test Connection</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <RefreshableView 
        className="flex-1 px-[20px]" 
        showsVerticalScrollIndicator={false}
        queryKeys={[['cashier-orders']]}
        onRefresh={handleRefresh}
      >
        {orders.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-white text-[17px]">Нет активных заказов</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View
              key={order.id}
              className={`mb-[16px] p-[16px] rounded-[16px] bg-mono_800`}
            >
              <TouchableOpacity 
                onPress={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                className="flex-row justify-between items-center"
              >
                <View className="flex-row items-center gap-[8px]">
                  <View className={`w-3 h-3 rounded-full ${order.status === 'new' ? 'bg-green_700' : order.status === 'in_progress' ? 'bg-yellow_500' : 'bg-red_500'}`} />
                  <View className="flex-row items-center">
                    <Text className="text-white text-[17px] leading-[22px]">{order.clientUsername}{order.arrivalStatus && ' • '}</Text>
                    {order.arrivalStatus && <Text className="text-white bg-blue_500 px-[4px] text-[15px] leading-[22px]">{translateArrivalStatus(order.arrivalStatus)}</Text>}
                    <Text className="text-white text-[15px] leading-[22px]">
                      {calculateRelevantTime(order) ? ` • ${calculateRelevantTime(order)}` : ''}
                    </Text>
                    {order.orderType && <Text className="text-mono_400 text-[15px] leading-[22px]"> • </Text>}
                    {order.orderType === 'in_cafe' && <Text className="text-white text-[15px] leading-[22px] bg-blue_500 px-[4px] rounded-full">in</Text>}
                  </View>
                </View>
              </TouchableOpacity>
  
              {selectedOrder === order.id && (
                <>
                  <View className="flex-row mt-[8px]">
                    <Text className="text-white text-[16px] leading-[22px]">{order.totalPrice} ₸{order.clientComment && ' • '}</Text>
                    {order.clientComment && <Text className="text-white bg-blue_500 px-[4px] text-[16px] leading-[22px]">{order.clientComment}</Text>}
                  </View>
                  <ScrollView
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    className="mt-[16px] mb-[8px]"
                    nestedScrollEnabled={true}
                  >
                    {order.coffees.map((coffee: any, index: number) => (
                      <View key={`coffee-${index}`} className="mr-3">
                        <BagCoffeeCard 
                          coffee={coffee}
                          size={coffee.cupSize}
                          additives={coffee.additives}
                          onDelete={() => {}}
                          isHidable={false}
                          isCollapsible={true}
                        />
                      </View>
                    ))}
                    {order.food.map((food: any, index: number) => (
                      <View key={`food-${index}`} className="mr-3">
                        <BagFoodCard 
                          food={food}
                          onDelete={() => {}}
                          isHidable={false}
                        />
                      </View>
                    ))}
                  </ScrollView>
  
                  <View className="flex-row gap-[12px] justify-between">
                    {order.status === 'new' ? (
                      <>
                        <View className="flex-1 mt-[12px]">
                          <CustomButton 
                            text="Принять"
                            onPress={() => takeOrder(order.id)}
                            size="medium"
                          />
                        </View>
                        <View className="flex-1 mt-[12px]">
                          <CustomButton 
                            text="Отменить"
                            onPress={() => handleCancel(order.id)}
                            size="medium"
                            isDanger={true}
                          />
                        </View>
                      </>
                    ) : order.status === 'in_progress' ? (
                      <>
                        <View className="flex-1 mt-[12px]">
                          <CustomButton 
                            text="Готово"
                            onPress={() => completeOrder(order.id)}
                            size="medium"
                          />
                        </View>
                        <View className="flex-1 mt-[12px]">
                          <CustomButton 
                            text="Отменить"
                            onPress={() => handleCancel(order.id)}
                            size="medium"
                            isDanger={true}
                          />
                        </View>
                      </>
                    ) : order.status === 'completed' ? (
                      <>
                        <View className="flex-1 mt-[12px]">
                          <CustomButton 
                            text="Выдать" 
                            onPress={() => giveAwayOrder(order.id)}
                            size="medium"
                            disabled={disabledButtons[order.id]}
                          />
                        </View>
                      </>
                    ) : null}
                  </View>
                </>
              )}
            </View>
          ))
        )}
      </RefreshableView>
    </SafeAreaView>
  );
};

export default CashierScreen;