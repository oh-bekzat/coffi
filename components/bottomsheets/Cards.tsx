import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert, Linking, Platform } from "react-native";
import { CustomInput, CustomButton, ScrollableContainer } from "../../components";
import { useAddCard, useGetCards, useDeleteCard } from "../../hooks/usePayment";
import { CardResponse } from "../../api/payment";
import { Ionicons } from "@expo/vector-icons";
import { useWebSocketStore } from "../../hooks/useWebSocket";
import LoadingSpinner from "../LoadingSpinner";
import Toast from "react-native-toast-message";
import WebView from 'react-native-webview';
import { useBottomSheetStore } from "../../stores/bottomSheetStore";
import { useSubscribe } from "../../hooks/useSubscription";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useWebSocketSubscription } from '../../hooks/useWebSocketSubscription';
import { WebSocketOrderMessage } from '../../types/order';


interface CardsBottomSheetProps {
  onClose: () => void;
  onSelectCard?: (cardId?: string) => Promise<{ url?: string } | void>;
  isOrderFlow?: boolean;
  isSubscription?: boolean;
  subscriptionId?: string;
  cardlessWebViewUrlFromBag?: string;
  selectedCafeId?: string;
}

const Cards = ({ onClose, onSelectCard, isOrderFlow = false, isSubscription = false, subscriptionId = "", cardlessWebViewUrlFromBag, selectedCafeId }: CardsBottomSheetProps) => {
  // States
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardWebViewUrl, setCardWebViewUrl] = useState<string | null>(null);
  const [cardlessWebViewUrl, setCardlessWebViewUrl] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isWaitingForOrderConfirmation, setIsWaitingForOrderConfirmation] = useState(false);
  
  // Track if component is mounted for async operations
  const isMounted = useRef(true);
  
  // Get socket connection
  const socket = useWebSocketStore(state => state.socket);
  const { closeSheet } = useBottomSheetStore();

  // Hooks for card operations
  const { mutate: addCard, isPending: isAddingCard } = useAddCard();
  const { data: cards = [], isLoading: isLoadingCards, refetch: refetchCards } = useGetCards();
  const { mutate: deleteCard, isPending: isDeletingCard } = useDeleteCard();
  const { mutate: subscribe, isPending: isSubscribePending } = useSubscribe();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (cardlessWebViewUrlFromBag) {
      setCardlessWebViewUrl(cardlessWebViewUrlFromBag);
    }
  }, [cardlessWebViewUrlFromBag]);
  
  // Subscribe to card.save messages
  useWebSocketSubscription('card.save', (message: WebSocketOrderMessage & { type: 'card.save' }, queryClient) => {
    if (!isMounted.current) return;
    
    setCardWebViewUrl(null);
    refetchCards();
    
    Toast.show({
      type: 'tomatoToast',
      text1: 'Карта успешно добавлена',
      position: 'top'
    });
  });
  
  // Subscribe to card.save_failed messages
  useWebSocketSubscription('card.save_failed', (message: WebSocketOrderMessage & { type: 'card.save_failed' }, queryClient) => {
    if (!isMounted.current) return;
    
    setCardWebViewUrl(null);
    
    const errorMessage = message.cardError || "Не удалось сохранить карту. Пожалуйста, попробуйте снова.";
    
    Toast.show({
      type: 'tomatoToast',
      text1: errorMessage,
      position: 'top'
    });
  });
  
  // Subscribe to subscription.payment messages
  useWebSocketSubscription('subscription.payment', (message: WebSocketOrderMessage & { type: 'subscription.payment' }, queryClient) => {
    if (!isMounted.current) return;
    
    setIsSubscribing(false);
    
    // Invalidate all relevant queries
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    queryClient.invalidateQueries({ queryKey: ["coffees"] });
    queryClient.invalidateQueries({ queryKey: ["cafes"] });
    
    // Show success message
    Toast.show({
      type: 'tomatoToast',
      text1: 'Подписка успешно оформлена',
      position: 'top'
    });
    
    // Close the bottom sheet after successful payment
    closeSheet();
    
    // Navigate to map
    router.push("/map");
  });
  
  // Subscribe to subscription.payment_failed messages
  useWebSocketSubscription('subscription.payment_failed', (message: WebSocketOrderMessage & { type: 'subscription.payment_failed' }, queryClient) => {
    if (!isMounted.current) return;
    
    setIsSubscribing(false);
    
    Toast.show({
      type: 'tomatoToast',
      text1: 'Не удалось оформить подписку. Пожалуйста, попробуйте снова.',
      position: 'top'
    });
  });
  
  // Subscribe to order.created messages
  useWebSocketSubscription('order.created', (message: WebSocketOrderMessage & { type: 'order.created' }, queryClient) => {
    if (!isMounted.current) return;
    
    setIsWaitingForOrderConfirmation(false);
    
    // Clear the bag after successful order creation
    const { useBagStore } = require('../../stores/bagStore');
    const clearBag = useBagStore.getState().clearBag;
    clearBag();
    
    // Show success message
    Toast.show({
      type: 'tomatoToast',
      text1: 'Заказ успешно оформлен',
      position: 'top'
    });
    
    // Close the bottom sheet after order confirmation
    closeSheet();
    queryClient.invalidateQueries({ queryKey: ["coffees"] });
    queryClient.invalidateQueries({ queryKey: ["cafes"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["coffee"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  });

  const handleSubscribe = () => {
    if (!selectedCardId) {
      Toast.show({
        type: 'tomatoToast',
        text1: 'Выберите карту для оплаты',
        position: 'top'
      });
      return;
    }
    

    
    // Set subscribing state to true to show loading spinner
    setIsSubscribing(true);
    
    // Error handling is done by the useSubscribe hook already
    subscribe({
      sub_id: subscriptionId,
      card_id: selectedCardId,
      cafe_id: selectedCafeId
    }, {
      onSuccess: () => {
        // Don't do anything on the API success - wait for WebSocket
        // console.log('[Cards] Subscription request sent successfully, waiting for WebSocket event...');
        // Don't navigate, close, or invalidate queries here - we'll handle all of this in the WebSocket handler
        
        // Set a timeout to fallback in case WebSocket doesn't arrive
        setTimeout(() => {
          if (isSubscribing && isMounted.current) {
            // console.log('[Cards] Subscription WebSocket confirmation timeout, falling back to normal flow');
            setIsSubscribing(false);
            
            // Still show success message as the API call succeeded
            Toast.show({
              type: 'tomatoToast',
              text1: 'Покупка в обработке',
              position: 'top'
            });
            
            // Close the sheet
            closeSheet();
            
            // Invalidate queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["coffees"] });
            queryClient.invalidateQueries({ queryKey: ["cafes"] });
            
            // Navigate to map
            router.push("/map");
          }
        }, 60000); // 60 second timeout for subscription confirmation
      },
      onError: (error) => {
        // Only handle local errors here (like network issues)
        setIsSubscribing(false);
        Toast.show({
          type: 'tomatoToast',
          text1: 'Ошибка при отправке запроса. Пожалуйста, попробуйте снова.',
          position: 'top'
        });
      }
    });
  };

  // Request to add a new card
  const handleAddCard = () => {
    addCard(undefined, {
      onSuccess: (data) => {
        if (data?.url) {
          // console.log("Card WebView URL:", data.url);
          setCardWebViewUrl(data.url);
        }
      },
      onError: (error) => {
        Alert.alert("Ошибка", "Не удалось инициировать процесс добавления карты");
      }
    });
  };

  // Handle WebView navigation events
  const handleWebViewNavigationStateChange = (navState: any) => {
    // Check for completion URL or other indicators that the process is complete
    if (navState.url.includes('payment-success') || navState.url.includes('callback')) {
      // The payment process is complete, close the WebView
      setCardWebViewUrl(null);
    }
  };

  // Confirm card deletion
  const confirmDeleteCard = (cardId: string) => {
    Alert.alert(
      "Удаление карты",
      "Вы уверены, что хотите удалить эту карту?",
      [
        { text: "Отмена", style: "cancel" },
        { 
          text: "Удалить", 
          onPress: () => deleteCard(cardId),
          style: "destructive" 
        }
      ]
    );
  };

  // Handle card selection in order flow
  const handleCardSelect = (cardId: string) => {
    if (isOrderFlow || isSubscription) {
      setSelectedCardId(cardId === selectedCardId ? null : cardId);
    }
  };

  // Confirm card selection and call the onSelectCard callback with WebSocket handling
  const confirmCardSelection = () => {
    if ((isOrderFlow || isSubscription) && onSelectCard && selectedCardId) {
      // Set waiting state for order confirmation
      setIsWaitingForOrderConfirmation(true);
      
      // Call the parent's onSelectCard callback to initiate the order
      onSelectCard(selectedCardId);
      
      // Don't close the sheet yet - wait for WebSocket confirmation
      // console.log('[Cards] Order initiated, waiting for WebSocket confirmation...');
      
      // Set a timeout to fallback in case WebSocket doesn't arrive
      setTimeout(() => {
        if (isWaitingForOrderConfirmation && isMounted.current) {
          // console.log('[Cards] WebSocket confirmation timeout, falling back to normal flow');
          setIsWaitingForOrderConfirmation(false);
          
          // Still show success message as the API call succeeded
          Toast.show({
            type: 'tomatoToast',
            text1: 'Оплата в обработке',
            position: 'top'
          });
          
          // Close the sheet
          closeSheet();
          
          // Invalidate orders query to refresh the orders list
          if (queryClient) {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
          }
        }
      }, 60000); // Increase timeout to 60 seconds to allow more time for WebSocket response
    }
  };

  const confirmCardlessPayment = async () => {
    if ((isOrderFlow || isSubscription) && onSelectCard) {
      // Set waiting state for order confirmation
      setIsWaitingForOrderConfirmation(true);
      
      // Call the parent's onSelectCard callback to initiate the order
      try {
        await onSelectCard?.(); // No cardId = cardless payment
      } catch (err) {
        setIsWaitingForOrderConfirmation(false);
        Alert.alert("Ошибка", "Не удалось начать оплату без карты");
      }
    }
    // Don't close the sheet yet - wait for WebSocket confirmation
    // console.log('[Cards] Order initiated, waiting for WebSocket confirmation...');
    
    // Set a timeout to fallback in case WebSocket doesn't arrive
    setTimeout(() => {
      if (isWaitingForOrderConfirmation && isMounted.current) {
        // console.log('[Cards] WebSocket confirmation timeout, falling back to normal flow');
        setIsWaitingForOrderConfirmation(false);
        
        // Still show success message as the API call succeeded
        Toast.show({
          type: 'tomatoToast',
          text1: 'Оплата в обработке',
          position: 'top'
        });
        
        // Close the sheet
        closeSheet();
        
        // Invalidate orders query to refresh the orders list
        if (queryClient) {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      }
    }, 60000); // Increase timeout to 60 seconds to allow more time for WebSocket response
  };

  const renderCardItem = ({ item }: { item: CardResponse }) => {
    const getCardIcon = (brand: string): "card" | "card-sharp" => {
      switch (brand.toLowerCase()) {
        case 'visa':
          return 'card';
        case 'mastercard':
          return 'card';
        default:
          return 'card';
      }
    };

    const isSelected = selectedCardId === item.id;

    return (
      <TouchableOpacity 
        className={`h-[56px] w-full border-[1px] ${isSelected ? 'bg-blue_500 border-blue_500' : 'bg-transparent border-mono_500'} rounded-full px-[24px] flex-row justify-between items-center mb-[12px]`}
        disabled={isDeletingCard}
        onPress={() => handleCardSelect(item.id)}
      >
        <View className="flex-row items-center">
          <Ionicons name={getCardIcon(item.cardBrand)} size={24} color={"white"} />
          <View className="ml-[12px]">
            <Text className="text-white text-[17px] font-medium">•••• {item.cardNumber.slice(-4)}</Text>
            <Text className="text-mono_400 text-[12px]">{item.cardBrand}</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => confirmDeleteCard(item.id)}
          disabled={isDeletingCard}
          className="p-[8px]"
        >
          <Ionicons name="close" size={20} color={"white"} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Adjusted loading state to include waiting for order confirmation
  const isLoading = !cardlessWebViewUrlFromBag && (isAddingCard || isSubscribing || isWaitingForOrderConfirmation);

  // Show loading screen when waiting for any async operation
  if (isLoading) {
    return (
      <View className="flex justify-center items-center pt-[24px] px-[24px] h-[300px]">
        <LoadingSpinner bg="transparent" />
        <Text className="text-white text-[17px] mt-[20px] text-center">
          {isAddingCard ? 'Подготовка формы добавления карты...' : 
           isSubscribing ? 'Оформление подписки...' : 
           'Оформление заказа...'}
        </Text>
        <Text className="text-mono_400 text-[14px] mt-[8px] text-center">
          Пожалуйста, подождите
        </Text>
      </View>
    );
  }

  if (cardWebViewUrl) {
    return (
      <View className="h-[600px] w-full bg-transparent mt-[24px] pb-[40px]">
        <View className="px-[24px] py-[16px] items-center flex-row justify-between mb-[22px]">
          <Text className="text-mono_400 text-[18px]">Добавление карты</Text>
          <TouchableOpacity onPress={() => setCardWebViewUrl(null)}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <View 
          style={{ flex: 1, height: 500 }}
          // Prevent parent gesture handlers from interfering with WebView on Android
          {...(Platform.OS === 'android' && {
            onTouchStart: (e) => {
              // Stop propagation to prevent bottomsheet pan gesture from interfering
              e.stopPropagation();
            },
            onTouchMove: (e) => {
              // Allow WebView to handle all touch movements
              e.stopPropagation();
            }
          })}
        >
          <WebView
            source={{ uri: cardWebViewUrl }}
            style={{ flex: 1, backgroundColor: 'white' }}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mixedContentMode="compatibility"
            sharedCookiesEnabled={true}
            // Android-specific optimizations for touch handling
            {...(Platform.OS === 'android' && {
              androidHardwareAccelerationDisabled: false,
              androidLayerType: 'hardware',
              nestedScrollEnabled: true,
            })}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              // console.error('WebView error: ', nativeEvent);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              // console.error(`WebView HTTP error: ${nativeEvent.statusCode}`);
            }}
            renderLoading={() => <LoadingSpinner bg="transparent" />}
            startInLoadingState={true}
          />
        </View>
      </View>
    );
  }

  if (cardlessWebViewUrl) {
    return (
      <View className="h-[600px] w-full bg-transparent mt-[24px] pb-[40px]">
        <View className="px-[24px] py-[16px] items-center flex-row justify-between mb-[22px]">
          <Text className="text-mono_400 text-[18px]">Способ оплаты</Text>
          <TouchableOpacity onPress={() => setCardlessWebViewUrl(null)}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <View 
          style={{ flex: 1, height: 500 }}
          // Prevent parent gesture handlers from interfering with WebView on Android
          {...(Platform.OS === 'android' && {
            onTouchStart: (e) => {
              // Stop propagation to prevent bottomsheet pan gesture from interfering
              e.stopPropagation();
            },
            onTouchMove: (e) => {
              // Allow WebView to handle all touch movements
              e.stopPropagation();
            }
          })}
        >
          <WebView
            source={{ uri: cardlessWebViewUrl }}
            style={{ flex: 1, backgroundColor: 'white' }}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mixedContentMode="compatibility"
            sharedCookiesEnabled={true}
            // Android-specific optimizations for touch handling
            {...(Platform.OS === 'android' && {
              androidHardwareAccelerationDisabled: false,
              androidLayerType: 'hardware',
              nestedScrollEnabled: true,
            })}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              // console.error('WebView error: ', nativeEvent);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              // console.error(`WebView HTTP error: ${nativeEvent.statusCode}`);
            }}
            renderLoading={() => <LoadingSpinner bg="transparent" />}
            startInLoadingState={true}
          />
        </View>
      </View>
    );
  }



  return (
    <View className="flex justify-center items-center pt-[24px] px-[24px]">
      <Text className="text-mono_500 text-[14px] text-center mb-[22px]">
        {isOrderFlow || isSubscription ? "Выберите карту для оплаты" : "Способы оплаты"}
      </Text>
      
      {isLoadingCards ? (
        <LoadingSpinner bg="transparent" />
      ) : (
        <View className="w-full">
          {cards.length > 0 ? (
            <FlatList
              data={cards}
              renderItem={renderCardItem}
              keyExtractor={(item) => item.id}
              className="w-full mb-[20px]"
              contentContainerStyle={{ paddingBottom: 8 }}
            />
          ) : (
            <View className="items-center py-[20px]">
              <Text className="text-white text-[17px] mb-[8px]">У вас пока нет сохраненных карт</Text>
              <Text className="text-mono_400 text-[14px] text-center mb-[20px]">
                Добавьте карту для быстрой оплаты заказов
              </Text>
            </View>
          )}

          <View className="w-full items-center">
            {isOrderFlow && !isSubscription && (
              <CustomButton
                text="Оплатить без карты"
                onPress={confirmCardlessPayment}
                containerStyles="mb-[12px]"
              />
            )}
            {!selectedCardId && (
              <CustomButton
                text="Добавить новую карту"
                onPress={handleAddCard}
                disabled={isAddingCard}
                containerStyles={isOrderFlow && selectedCardId ? "" : "mb-[12px]"}
              />
            )}
            
            {isOrderFlow && selectedCardId ? (
              <CustomButton
                text="Оплатить"
                onPress={confirmCardSelection}
                disabled={isWaitingForOrderConfirmation}
                containerStyles="mb-[12px]"
              />
            ) : null}

            {isSubscription && selectedCardId && (
              <CustomButton
                text="Оплатить"
                onPress={handleSubscribe}
                disabled={!selectedCardId || isSubscribePending || isSubscribing}
                containerStyles="mb-[12px]"
              />
            )}

            {isOrderFlow && (
              <CustomButton
                text="Отмена"
                onPress={onClose}
                secondary
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default Cards; 