import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import BagCoffeeCard from './BagCoffeeCard';
import { Cafe } from '../api/cafe';
import { CoffeeOrder, MenuOrder } from '../api/coffee';
import BagFoodCard from './BagFoodCard';
import LoadingSpinner from './LoadingSpinner';
import { DisplayOrderResponse } from '../api/coffee';

interface BagCafeSectionProps {
  cafe: Cafe | null;
  coffees: CoffeeOrder[];
  foods: MenuOrder[];
  onRemoveCoffee: (index: number) => void;
  onRemoveFood: (index: number) => void;
  displayOrderData?: DisplayOrderResponse;
  isLoading?: boolean;
}

const BagCafeSection = ({ 
  cafe, 
  coffees, 
  foods, 
  onRemoveCoffee, 
  onRemoveFood,
  displayOrderData,
  isLoading = false
}: BagCafeSectionProps) => {
  if (!cafe) return null;

  // Show loading state if data is being fetched
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  // If no display order data is available but we have items in the bag
  if (!displayOrderData && ((coffees && coffees.length > 0) || (foods && foods.length > 0))) {
    return (
      <View>
        <Text className="text-white text-[20px] mb-[12px] font-semibold">{cafe.name}</Text>
        <Text className="text-mono_200 text-[14px]">Не удалось загрузить информацию о заказе</Text>
      </View>
    );
  }

  return (
    <View>
      <Text className="text-white text-[20px] mb-[12px] font-semibold">{cafe.name}  
        <Text className="text-mono_200 font-normal text-[14px] px-4">
          {' '} {displayOrderData?.totalPrice ?? 0} ₸
        </Text>
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
      >
        {coffees?.map((item, index) => {
          const displayCoffee = displayOrderData?.coffees?.[index];
          if (!displayCoffee) {
            console.warn('[BagCafeSection] No display coffee data for index:', index, 'item:', item);
            return null;
          }

          return (
            <TouchableOpacity 
              key={`coffee-${item.coffeeId}-${index}`}
              className="mr-3"
            >
              <BagCoffeeCard 
                coffee={displayCoffee}
                size={item.cupSize}
                additives={displayCoffee.additives || []}
                onDelete={() => onRemoveCoffee(index)}
                fromBag={true}
              />
            </TouchableOpacity>
          );
        })}
        {foods?.map((item, index) => {
          const displayFood = displayOrderData?.food?.[index];
          if (!displayFood) {
            console.warn('[BagCafeSection] No display food data for index:', index, 'item:', item);
            return null;
          }

          return (
            <TouchableOpacity 
              key={`food-${item.foodId}-${index}`}
              className="mr-3"
            >
              <BagFoodCard 
                food={displayFood}
                onDelete={() => onRemoveFood(index)}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default BagCafeSection; 