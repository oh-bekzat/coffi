import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import CustomButton from '../CustomButton';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

interface LocationSelectionProps {
  onClose: () => void;
  onSelect: (location: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => void;
}

const LocationSelection = ({ onClose, onSelect }: LocationSelectionProps) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [address, setAddress] = useState('');

  const handleAddressSearch = async () => {
    try {
      const results = await Location.geocodeAsync(address);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        setSelectedLocation({ latitude, longitude });
      }
    } catch (error) {
      // console.error('Error geocoding address:', error);
    }
  };

  return (
    <View className="mt-[24px] px-[24px]">
      <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Смена региона</Text>
      <Text className="text-[26px] leading-[32px] font-bold mb-[24px] text-white text-center">Выберите Ваше местоположение</Text>
      
      {/* <View className="flex-row mb-4">
        <TextInput
          className="flex-1 bg-mono_800 text-white p-3 rounded-l-lg"
          placeholder="Введите адрес"
          placeholderTextColor="#666"
          value={address}
          onChangeText={setAddress}
          onSubmitEditing={handleAddressSearch}
        />
        <CustomButton 
          text="Найти"
          onPress={handleAddressSearch}
          className="rounded-l-none w-24"
        />
      </View> */}
      
      <MapView
        style={{ height: 300, marginBottom: 20, borderRadius: 16 }}
        initialRegion={{
          latitude: 43.238949,
          longitude: 76.889709,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} />
        )}
      </MapView>

      <CustomButton 
        text="Подтвердить"
        onPress={() => selectedLocation && onSelect({
          ...selectedLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        })}
        disabled={!selectedLocation}
      />
    </View>
  );
};

export default LocationSelection; 