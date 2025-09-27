import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MenuItem } from '../api/coffee';
import { useBottomSheetStore } from '../stores/bottomSheetStore';
import DeleteConfirmation from './bottomsheets/DeleteConfirmation';
import Svg, { Path } from 'react-native-svg';

interface BagFoodCardProps {
  food: MenuItem;
  noPrice?: boolean;
  onDelete?: () => void;
  isHidable?: boolean;
  fromMenu?: boolean;
}

const BagFoodCard = ({ 
  food, 
  noPrice, 
  onDelete,
  isHidable = true,
  fromMenu = false
}: BagFoodCardProps) => {
  const { openSheet, closeSheet } = useBottomSheetStore();
  const firstAttachment = food.attachmentUrls?.[0];
  const attachmentUrl = firstAttachment?.startsWith("http")
    ? firstAttachment
    : firstAttachment 
      ? `https://${firstAttachment}`
      : undefined;

  const handleDelete = () => {
    openSheet(
      <DeleteConfirmation
        itemName={food.name}
        onClose={closeSheet}
        onConfirm={onDelete!}
      />
    );
  };

  return (
    <View className="p-[10px] bg-mono_700 rounded-[16px] h-[161px] w-[152px] relative">
      {isHidable && onDelete && (
        <TouchableOpacity 
          onPress={handleDelete}
          className="absolute right-[6px] top-[6px] z-10 w-[16px] h-[16px] bg-mono_800/80 rounded-full items-center justify-center"
          hitSlop={{ top: 16, right: 16, bottom: 16, left: 16 }}
        >
          <Svg width="6" height="6" viewBox="0 0 14 14" fill="none">
            <Path d="M1 1L13 13M1 13L13 1" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </Svg>
        </TouchableOpacity>
      )}

      <View className="pt-[1px] pl-[2px] pb-0">
        <View className="w-[90%]">
          <Text 
            className={`mb-[2px] text-white ${food.name.length > 12 ? 'text-[11px]' : 'text-[17px]'}`}
            numberOfLines={2}
          >
            {food.name}
          </Text>
        </View>
        {!fromMenu ? <Text className="text-mono_400 mb-2">Еда{!noPrice ? ` • ${food.price} ₸` : ''}</Text> : 
        <Text className="text-mono_400 mb-2">Еда{!noPrice ? ` • ${food?.priceS} ₸` : ''}</Text>}
      </View>
      <View className="flex-1 items-center overflow-hidden -mt-[12px]">
        <View className="absolute bottom-0 bg-mono_800 w-full h-[70%] z-0 rounded-[12px]" />
        <View style={{ height: '100%', overflow: 'hidden' }}>
          <Image
            source={{ uri: attachmentUrl }}
            style={{
              width: 130,
              height: 115,
              borderRadius: 0,
              zIndex: 1,
              marginTop: 12
            }}
            resizeMode="cover"
            defaultSource={{ uri: "https://via.placeholder.com/150" }}
          />
        </View>
      </View>
    </View>
  );
};

export default BagFoodCard; 