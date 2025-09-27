import { View, Text } from 'react-native';
import CustomButton from '../CustomButton';

interface DeleteConfirmationProps {
  onConfirm: () => void;
  onClose: () => void;
  itemName: string;
}

const DeleteConfirmation = ({ onConfirm, onClose, itemName }: DeleteConfirmationProps) => {
  return (
    <View className="flex justify-center items-center mt-[24px]">
      <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Удаление из корзины</Text>
      <Text className="text-white font-semibold text-center text-[22px] leading-[28px] mb-[8px] w-[80%]">Вы уверены, что хотите удалить {itemName} из корзины?</Text>
      <CustomButton
        text="Удалить"
        onPress={() => {
            onConfirm();
            onClose();
          }}
        containerStyles="mt-[22px]"
      />
    </View>
  );
};

export default DeleteConfirmation; 