import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CustomInput, CustomButton } from '../index';

interface OrderOptionsSheetProps {
  onConfirm: (orderType: 'in_cafe' | 'pickup', comment: string) => void;
  onClose: () => void;
}

const OrderOptionsSheet = ({ onConfirm, onClose }: OrderOptionsSheetProps) => {
  const [orderType, setOrderType] = useState<'in_cafe' | 'pickup'>('pickup');
  const [comment, setComment] = useState('');

  return (
    <View className="flex justify-center items-center mt-[24px] px-[24px]">
      <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Детали заказа</Text>
      <View className="items-center w-full flex justify-center">
        <Text className="text-white text-center font-semibold text-[17px] leading-[22px] mb-[22px] w-[80%]">Выберите тип заказа:</Text>
      </View>
      
      <View className="flex-row w-full justify-center space-x-4 mb-[22px] gap-[12px]">
        <TouchableOpacity 
          className={`py-[10px] px-[16px] rounded-full ${orderType === 'in_cafe' ? 'bg-blue_500' : 'bg-mono_700'}`}
          onPress={() => setOrderType('in_cafe')}
        >
          <Text className="text-white text-[16px]">В кафе</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`py-[10px] px-[16px] rounded-full ${orderType === 'pickup' ? 'bg-blue_500' : 'bg-mono_700'}`}
          onPress={() => setOrderType('pickup')}
        >
          <Text className="text-white text-[16px]">На вынос</Text>
        </TouchableOpacity>
      </View>
      
      <CustomInput
        placeholder="Комментарий к заказу"
        value={comment}
        onChangeText={setComment}
      />
      
      <CustomButton
        text="Продолжить"
        onPress={() => onConfirm(orderType, comment)}
        containerStyles="mt-[22px]"
      />
    </View>
  );
};

export default OrderOptionsSheet; 