import { View, Text, TouchableOpacity, FlatList, Image, Linking } from "react-native";
import { Cafe as CafeProps } from "../../api/cafe";
import { CustomButton, ScrollableContainer } from "../../components";
import { router } from "expo-router";
import { useCafeStore } from '../../stores/cafeStore';
import Svg, { Path } from 'react-native-svg';

interface CafeBottomSheetProps {
  cafe: CafeProps;
  fromMap: boolean;
  schedule: { openTime: string; closeTime: string } | null;
  onClose: () => void;
  coffeeId?: string;
}

const renderAttachmentItem = ({ item }: { item: string }) => {
  const attachmentUrl = item.startsWith("http") ? item : `https://${item}`;
  return (
    <Image
      source={{ uri: attachmentUrl }}
      className="w-32 h-44 rounded-xl mr-2"
      defaultSource={{ uri: "https://via.placeholder.com/150" }}
    />
  );
};

const Cafe = ({ cafe, schedule, onClose, fromMap, coffeeId }: CafeBottomSheetProps) => {
  const handleSelectCafe = async () => {
    try {
      useCafeStore.setState({ preferredCafe: cafe });
      onClose();
      
      if (fromMap) {
        router.push("/coffee");
      } else if (coffeeId) {
        router.push(`/coffee/${coffeeId}`);
      } else {
        router.push('/coffee');
      }
    } catch (error) {
      // console.error("Error selecting cafe:", error);
    }
  };

  return (
    <View className="px-[24px] mt-[24px]">
      <Text className="text-mono_500 text-[14px] text-center mb-[22px]">
        Кофейня
      </Text>
      <View className="items-center gap-[16px]">
        <Text className="text-white font-bold text-[32px]">{cafe?.name}</Text>
        <Text className="text-white font-medium text-[16px] leading-[18px]">
          {cafe?.streetName}, {cafe?.streetNumber}
        </Text>
        <View className="flex-row flex-wrap gap-[8px]">
          <View className="h-[40px] px-[16px] bg-blue_500 rounded-full flex-row gap-[8px] items-center justify-center">
            <Svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <Path d="M10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0ZM10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2ZM10 4C10.2449 4.00003 10.4813 4.08996 10.6644 4.25272C10.8474 4.41547 10.9643 4.63975 10.993 4.883L11 5V9.586L13.707 12.293C13.8863 12.473 13.9905 12.7144 13.9982 12.9684C14.006 13.2223 13.9168 13.4697 13.7488 13.6603C13.5807 13.8508 13.3464 13.9703 13.0935 13.9944C12.8406 14.0185 12.588 13.9454 12.387 13.79L12.293 13.707L9.293 10.707C9.13758 10.5514 9.03776 10.349 9.009 10.131L9 10V5C9 4.73478 9.10536 4.48043 9.29289 4.29289C9.48043 4.10536 9.73478 4 10 4Z" fill="white"/>
            </Svg>

            <Text className="text-white font-medium text-[14px] leading-[18px]" numberOfLines={1}>
              {schedule ? `до ${schedule.closeTime}` : ''}
            </Text>
          </View>
          <View className="h-[40px] px-[16px] bg-blue_500 flex-row gap-[4px] rounded-full items-center justify-center">
            <Svg width="20" height="20" viewBox="0 0 20 20">
              <Path d="M8.99984 14.2752L4.84984 16.7752C4.66651 16.8919 4.47484 16.9419 4.27484 16.9252C4.07484 16.9085 3.89984 16.8419 3.74984 16.7252C3.59984 16.6085 3.48317 16.4629 3.39984 16.2882C3.31651 16.1135 3.29984 15.9175 3.34984 15.7002L4.44984 10.9752L0.774841 7.8002C0.608174 7.6502 0.504174 7.4792 0.462841 7.2872C0.421507 7.0952 0.433841 6.90786 0.499841 6.7252C0.565841 6.54253 0.665841 6.39253 0.799841 6.2752C0.933841 6.15786 1.11717 6.08286 1.34984 6.0502L6.19984 5.6252L8.07484 1.1752C8.15817 0.975195 8.28751 0.825195 8.46284 0.725195C8.63817 0.625195 8.81717 0.575195 8.99984 0.575195C9.18251 0.575195 9.36151 0.625195 9.53684 0.725195C9.71217 0.825195 9.84151 0.975195 9.92484 1.1752L11.7998 5.6252L16.6498 6.0502C16.8832 6.08353 17.0665 6.15853 17.1998 6.2752C17.3332 6.39186 17.4332 6.54186 17.4998 6.7252C17.5665 6.90853 17.5792 7.0962 17.5378 7.2882C17.4965 7.4802 17.3922 7.65086 17.2248 7.8002L13.5498 10.9752L14.6498 15.7002C14.6998 15.9169 14.6832 16.1129 14.5998 16.2882C14.5165 16.4635 14.3998 16.6092 14.2498 16.7252C14.0998 16.8412 13.9248 16.9079 13.7248 16.9252C13.5248 16.9425 13.3332 16.8925 13.1498 16.7752L8.99984 14.2752Z" fill="white"/>
            </Svg>

            <Text className="text-white font-medium text-[14px] leading-[18px]" numberOfLines={1}>
              {cafe?.rating}{" "}({cafe?.ratingCount})
            </Text>
          </View>
          <View className="h-[40px] bg-blue_500 rounded-full items-center justify-center px-[16px]">
            <Svg width="12" height="16" viewBox="0 0 12 16">
              <Path d="M1.99984 15.3332C1.63317 15.3332 1.31939 15.2027 1.0585 14.9418C0.797615 14.6809 0.666948 14.3669 0.666504 13.9998V6.6665C0.666504 6.29984 0.79717 5.98606 1.0585 5.72517C1.31984 5.46428 1.63362 5.33362 1.99984 5.33317H3.99984V6.6665H1.99984V13.9998H9.99984V6.6665H7.99984V5.33317H9.99984C10.3665 5.33317 10.6805 5.46384 10.9418 5.72517C11.2032 5.9865 11.3336 6.30028 11.3332 6.6665V13.9998C11.3332 14.3665 11.2027 14.6805 10.9418 14.9418C10.6809 15.2032 10.3669 15.3336 9.99984 15.3332H1.99984ZM5.33317 10.6665V3.2165L4.2665 4.28317L3.33317 3.33317L5.99984 0.666504L8.6665 3.33317L7.73317 4.28317L6.6665 3.2165V10.6665H5.33317Z" fill="white"/>
            </Svg>
          </View>
        </View>
      </View>
      <ScrollableContainer>
        <FlatList
          data={cafe?.attachmentUrls || []}
          horizontal
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderAttachmentItem}
          contentContainerStyle={{ paddingVertical: 20 }}
          showsHorizontalScrollIndicator={false}
        />
      </ScrollableContainer>
      <View className="flex items-center gap-[20px]">
        <CustomButton
          text="Заказать"
          onPress={handleSelectCafe}
        />
        <TouchableOpacity onPress={() => Linking.openURL(cafe?.twogisLink || '')}>
          <Text className="text-mono_500 text-[16px]">Как добраться?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Cafe;