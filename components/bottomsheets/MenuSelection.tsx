import { View, Text, FlatList } from 'react-native';
import { useMenuFoods } from '../../hooks/useMenu';
import { useBagStore } from '../../stores/bagStore';
import { Cafe } from '../../api/cafe';
import CustomButton from '../CustomButton';
import BagFoodCard from '../BagFoodCard';
import ScrollableContainer from '../ScrollableContainer';
import { TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { useMemo } from 'react';

interface MenuSelectionProps {
  cafe: Cafe;
  onClose: () => void;
}

const MenuSelection = ({ cafe, onClose }: MenuSelectionProps) => {
  const { data: menuCategories } = useMenuFoods(cafe.id);
  const { addFood } = useBagStore();

  // Flatten all items from all categories and filter out unavailable ones
  const availableMenuItems = useMemo(() => {
    if (!menuCategories) return [];
    return menuCategories
      .flatMap(category => category.items)
      .filter(item => item.available === true);
  }, [menuCategories]);

  const handleAddFood = (foodId: string) => {
    addFood(cafe, { foodId: foodId });
    onClose();
    Toast.show({
      type: 'tomatoToast',
      text1: 'Еда добавлена в корзину',
      position: 'top'
    });
  };

  return (
    <View className="flex justify-center items-center mt-[24px] px-[20px]">
      <Text className="text-white font-semibold text-[20px] leading-[22px] mb-[22px]">
        Добавить к заказу:
      </Text>
      <ScrollableContainer className="mb-[24px]">
        <FlatList
          data={availableMenuItems}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => handleAddFood(item.id)}
              className="mr-3"
            >
              <BagFoodCard
                food={item}
                isHidable={false}
                fromMenu={true}
              />
            </TouchableOpacity>
          )}
        />
      </ScrollableContainer>
      <CustomButton 
        text="Пропустить" 
        onPress={onClose}
      />
    </View>
  );
};

export default MenuSelection; 