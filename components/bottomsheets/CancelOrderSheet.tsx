import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { CustomInput, CustomButton } from '../index';

interface CancelOrderSheetProps {
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

const CancelOrderSheet = ({ onConfirm, onClose }: CancelOrderSheetProps) => {
  const [cancelReason, setCancelReason] = useState('');

  return (
    <View className="flex justify-center items-center mt-[24px]">
        <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Отмена заказа</Text>
        <View className="items-center w-full flex justify-center">
          <Text className="text-white text-center font-semibold text-[17px] leading-[22px] mb-[22px] w-[80%]">Введите причину отмены и подтвердите:</Text>
        </View>
        <CustomInput
        placeholder="Причина отмены"
        value={cancelReason}
        onChangeText={setCancelReason}
      />
        <CustomButton
            text="Подтвердить"
            onPress={() => {
            onConfirm(cancelReason);
            setCancelReason('');
            onClose();
            }}
            containerStyles="mt-[22px]"
            isDanger={true}
        />
      </View>
  );
};

export default CancelOrderSheet; 