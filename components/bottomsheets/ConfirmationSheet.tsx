import { View, Text, TouchableOpacity } from 'react-native';
import { CustomButton } from '../index';

interface ConfirmationSheetProps {
  onConfirm: () => void;
}

const ConfirmationSheet = ({ onConfirm }: ConfirmationSheetProps) => {
  return (
    <View className="flex justify-center items-center mt-[24px]">
      <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Очистка корзины</Text>
      <Text className="text-white font-semibold text-[20px] leading-[22px] text-center w-[80%] mb-[22px]">Вы уверены, что хотите очистить корзину?</Text>
      <Text className="text-white text-[14px] leading-[18px] mb-[24px] text-center w-[80%]">
        В корзине есть товары из другого кафе. Чтобы добавить этот кофе, нужно очистить корзину.
      </Text>

      <View className="gap-[12px]">
        <CustomButton
          text="Подтвердить"
          onPress={onConfirm}
        />
      </View>
    </View>
  );
};

export default ConfirmationSheet; 