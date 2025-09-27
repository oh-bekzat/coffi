import { View, Text } from 'react-native';
import { DisplayOrderCoffee } from '../../api/coffee';

interface CoffeeDetailsProps {
  coffee: DisplayOrderCoffee;
  size: 's' | 'm' | 'l';
  additives: Array<{
    id: string;
    name: string;
    price: number;
    attachmentUrls: string[];
    type?: string;
  }>;
  onClose: () => void;
}

const CoffeeDetails = ({ coffee, size, additives, onClose }: CoffeeDetailsProps) => {
  const sizeLabels = {
    's': 'S',
    'm': 'M',
    'l': 'L'
  };

  const formatType = (type: string | undefined) => {
    if (!type) return '';
    switch (type) {
      case 'milk': return 'молоко';
      case 'syrup': return 'Сироп';
      case 'other': return 'Другое';
      default: return type;
    }
  }

  return (
    <View className="flex justify-center items-center mt-[24px]">
    <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Детали заказа</Text>
      <Text className="text-white font-semibold text-center text-[28px] leading-[28px] mb-[16px] w-[80%]">
        {coffee.name}  
        <Text className="text-mono_400 font-semibold">
          {' '}{sizeLabels[size]}
        </Text>
      </Text>

      {additives.length > 0 && (
        <View className="items-center">
          <Text className="text-mono_400 text-[17px] leading-[22px] mb-[4px]">Добавки:</Text>
          {additives.map((additive) => (
            <Text key={additive.id} className="text-white text-[17px] leading-[22px] mt-[8px]">
              {additive.name} {formatType(additive?.type)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default CoffeeDetails; 