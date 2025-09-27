import { View, Text, Image, TouchableOpacity } from 'react-native';
import { DisplayOrderCoffee } from '../api/coffee';
import { useBottomSheetStore } from '../stores/bottomSheetStore';
import DeleteConfirmation from './bottomsheets/DeleteConfirmation';
import CoffeeDetails from './bottomsheets/CoffeeDetails';
import Svg, { Path } from 'react-native-svg';

interface BagCoffeeCardProps {
  coffee: DisplayOrderCoffee;
  size: 's' | 'm' | 'l';
  additives: Array<{
    id: string;
    name: string;
    price: number;
    attachmentUrls: string[];
  }>;
  onDelete?: () => void;
  isHidable?: boolean;
  hidePrice?: boolean;
  isCollapsible?: boolean;
  fromBag?: boolean;
}

const BagCoffeeCard = ({ 
  coffee, 
  size, 
  additives,
  onDelete,
  isHidable = true,
  hidePrice = false,
  isCollapsible = false,
  fromBag = false
}: BagCoffeeCardProps) => {
  const { openSheet, closeSheet } = useBottomSheetStore();
  const firstAttachment = coffee.attachmentUrls?.[0];
  const attachmentUrl = firstAttachment?.startsWith("http")
    ? firstAttachment
    : firstAttachment 
      ? `https://${firstAttachment}`
      : undefined;

  const sizeLabels = {
    's': 'Малый',
    'm': 'Средний',
    'l': 'Большой'
  };

  const handleDelete = () => {
    openSheet(
      <DeleteConfirmation
        itemName={coffee.name}
        onClose={closeSheet}
        onConfirm={onDelete!}
      />
    );
  };

  const showDetails = () => {
    openSheet(
      <CoffeeDetails
        coffee={coffee}
        size={size}
        additives={additives}
        onClose={closeSheet}
      />
    );
  };

  return (
    <TouchableOpacity 
      onPress={isCollapsible ? showDetails : undefined}
      className="p-[10px] bg-mono_700 rounded-[16px] h-[161px] relative"
    >
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
            className={`pb-[2px] text-white ${coffee.name.length > 12 ? 'text-[14px]' : 'text-[17px]'}`} 
            numberOfLines={1}
          >
            {coffee.name}
          </Text>
        </View>
        <View className='flex-row items-center'>
          <Text className='text-mono_400'>{sizeLabels[size]} {hidePrice ? '' : `• ${coffee.price} ₸`}{additives.length > 0 && ` • `}</Text>
          {additives.length > 0 && <Text className={`${fromBag ? 'text-mono_400' : 'text-white bg-blue_500 px-[4px]'}`}>{`${additives.length} доп.`}</Text>}
        </View>
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

export default BagCoffeeCard; 