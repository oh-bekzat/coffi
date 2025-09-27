import { useEffect, useState, useRef } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetCafes } from "../hooks/useCafe";
import { Cafe as CafeProps } from "../api/cafe";
import { useBottomSheetStore } from "../stores/bottomSheetStore";
import { Cafe, CafeSelection, Cards, LocationSelection } from "../components/bottomsheets";
import { router } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useCafeStore } from "../stores/cafeStore";
import Svg, { Path } from "react-native-svg";
import Toast from "react-native-toast-message";
import { useLocationStore } from "../stores/locationStore";
import LoadingSpinner from '../components/LoadingSpinner';
import { CustomButton } from "../components";
import { useLogout } from "../hooks/useAuth";
import { useGetProfile } from "../hooks/useProfile";
import BagIcon from "../components/BagIcon";
import { requireAuth } from "../utils/authHelpers";

const Map = () => {
  const { location, hasLocationPermission, setLocation, setLocationPermission, loadSavedLocation, refreshLocation } = useLocationStore();
  const { openSheet, closeSheet } = useBottomSheetStore();
  const logout = useLogout();
  const { data: profile } = useGetProfile();
  const [mapReady, setMapReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const initializeLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        await refreshLocation();
      } else {
        await loadSavedLocation();
        if (!location) {
          openSheet(
            <LocationSelection 
              onClose={closeSheet}
              onSelect={async (location) => {
                await setLocation(location);
                closeSheet();
              }}
            />
          );
        }
      }
    };

    initializeLocation();
  }, []);

  const handleMapLongPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  useEffect(() => {
    if (mapReady) {
      setTimeout(() => {
        setMapLoaded(true);
      }, 500);
    }
  }, [mapReady]);

  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1);
    }
  }, [location, mapReady]);

  const { data: cafes, isLoading, error } = useGetCafes();

  const formatTime = (time: string | null) => {
    if (!time) return null;
    return time.split(':').slice(0, 2).join(':');
  };

  const getDaySchedule = (cafe: CafeProps) => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    
    if (cafe.openingSchedule && cafe.openingSchedule.length > dayIndex) {
      const daySchedule = cafe.openingSchedule[dayIndex];
      const formattedCloseTime = formatTime(daySchedule.closeTime);
      
      // Return null if cafe is closed (closeTime is null)
      if (!formattedCloseTime) return null;
      
      return {
        openTime: daySchedule.openTime,
        closeTime: formattedCloseTime
      };
    }
    return null;
  };

  const openBottomSheet = (cafe: CafeProps) => {
    const schedule = getDaySchedule(cafe);
    openSheet(
      <Cafe 
        cafe={cafe} 
        schedule={schedule} 
        onClose={closeSheet}
        fromMap={true}
      />
    );
  };

  // const openLogoutBottomSheet = () => {
  //   openSheet(
  //     <View className="flex justify-center items-center mt-[24px]">
  //       <Text className="text-mono_500 text-[14px] text-center mb-[22px]">Выход</Text>
  //       <Text className="text-white font-bold text-[22px] leading-[28px] text-center w-[80%] mb-[22px]">Вы уверены{'\n'}что хотите выйти?</Text>
  //       <CustomButton
  //         text="Выход"
  //         onPress={handleLogout}
  //         isDanger={true}
  //       />
  //     </View>
  //   )
  // };

  // const openCardsBottomSheet = () => {
  //   openSheet(
  //     <Cards onClose={closeSheet} />
  //   );
  // };

  // const handleLogout = async () => {
  //   try {
  //     closeSheet();
  //     logout.mutate();
  //   } catch (error) {
  //     Alert.alert("Ошибка", "Не удалось выйти из системы.");
  //   }
  // };

  const handleCafeSelection = () => {
    openSheet(
      <CafeSelection
        onClose={closeSheet}
        onSelect={async (cafe) => {
          useCafeStore.setState({ preferredCafe: cafe });
          closeSheet();
          router.push('/coffee');
        }}
      />
    );
  };

  const handleAddressChange = () => {
    openSheet(
      <LocationSelection 
        onClose={closeSheet}
        onSelect={async (location) => {
          await setLocation(location);
          closeSheet();
        }}
      />
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        showsMyLocationButton
        initialRegion={location || {
          latitude: 43.238949,
          longitude: 76.889709,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsCompass={false}
        onMapReady={() => setMapReady(true)}
        onLongPress={handleMapLongPress}
      >
        {cafes?.map((cafe) => (
          <Marker
            key={cafe.id}
            coordinate={{ latitude: cafe.lat, longitude: cafe.lon }}
            onPress={() => {
              if (cafe.isOpen) {
                openBottomSheet(cafe);
              } else {
                Toast.show({
                  type: 'tomatoToast',
                  text1: `${cafe.name} закрыт`,
                  position: 'top'
                });
              }
            }}
            tracksViewChanges={false}
          >
            <View className={`w-[40px] h-[40px] ${cafe.isOpen ? "bg-blue_500" : "bg-mono_800"} rounded-full overflow-hidden items-center justify-center`}>
              <View className="w-[24px] h-[24px] bg-white rounded-full"></View>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <SafeAreaView pointerEvents="box-none">
          <View className="p-[20px]">
            <View className="flex-row justify-between">
              <TouchableOpacity 
                className="w-[40px] h-[40px] bg-blue_500 rounded-full items-center justify-center" 
                onPress={() => {
                  if (requireAuth()) {
                    router.push("/profile");
                  }
                }}
              >
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <Path d="M8 0C9.06087 0 10.0783 0.421427 10.8284 1.17157C11.5786 1.92172 12 2.93913 12 4C12 5.06087 11.5786 6.07828 10.8284 6.82843C10.0783 7.57857 9.06087 8 8 8C6.93913 8 5.92172 7.57857 5.17157 6.82843C4.42143 6.07828 4 5.06087 4 4C4 2.93913 4.42143 1.92172 5.17157 1.17157C5.92172 0.421427 6.93913 0 8 0ZM8 10C12.42 10 16 11.79 16 14V16H0V14C0 11.79 3.58 10 8 10Z" fill="white"/>
                </Svg>
              </TouchableOpacity>
              <BagIcon />
            </View>

            {(!profile?.subscription || profile?.subscription?.status !== "active") && (
              <TouchableOpacity
                activeOpacity={0.9}
                className="mt-[16px] bg-blue_500 border-2 border-blue_700 rounded-[16px] p-[16px]"
                onPress={() => router.push("/subscription")}
              >
                <Text className="text-white text-[16px] font-semibold mb-[6px]">
                  Бесплатный напиток каждый день с COFFI
                </Text>
                <Text className="text-white text-[14px]">
                  Оформите подписку и получайте 1 напиток ежедневно. Экономия от 50%.
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>

        <View style={{ flex: 1 }} pointerEvents="box-none" />

        <SafeAreaView pointerEvents="box-none">
          <View className="items-center pb-4">
            <View className="flex-row mb-[16px] rounded-full justify-center items-center h-[48px] w-[136px] bg-blue_500 px-[8px]">
              <TouchableOpacity 
                className="flex-1 h-[36px] items-center justify-center"
                onPress={() => {
                  if (location) {
                    mapRef.current?.animateToRegion({
                      latitude: location.latitude,
                      longitude: location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }, 500);
                  } else {
                    refreshLocation().then(() => {
                      const currentLocation = useLocationStore.getState().location;
                      if (mapRef.current && currentLocation) {
                        mapRef.current.animateToRegion({
                          latitude: currentLocation.latitude,
                          longitude: currentLocation.longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }, 500);
                      }
                    });
                  }
                }}
              >
                <Svg width="19" height="19" viewBox="0 0 19 19" fill="none">
                  <Path d="M8.04995 10.9499L1.57495 8.3249C1.35828 8.24157 1.19995 8.11257 1.09995 7.9379C0.999951 7.76324 0.949951 7.5839 0.949951 7.3999C0.949951 7.2159 1.00428 7.0369 1.11295 6.8629C1.22162 6.6889 1.38395 6.55957 1.59995 6.4749L16.95 0.774902C17.15 0.691569 17.3416 0.674902 17.525 0.724902C17.7083 0.774902 17.8666 0.866569 18 0.999902C18.1333 1.13324 18.225 1.29157 18.275 1.4749C18.3249 1.65824 18.3083 1.8499 18.225 2.0499L12.525 17.3999C12.4416 17.6166 12.3126 17.7792 12.138 17.8879C11.9633 17.9966 11.784 18.0506 11.6 18.0499C11.416 18.0492 11.237 17.9992 11.063 17.8999C10.889 17.8006 10.7596 17.6422 10.675 17.4249L8.04995 10.9499Z" fill="white"/>
                </Svg> 
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCafeSelection} className="flex-1 h-[36px] items-center justify-center">
                <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <Path d="M16.6 18L10.3 11.7C9.8 12.1 9.225 12.4167 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13C4.68333 13 3.146 12.3707 1.888 11.112C0.63 9.85333 0.000667196 8.316 5.29101e-07 6.5C-0.000666138 4.684 0.628667 3.14667 1.888 1.888C3.14733 0.629333 4.68467 0 6.5 0C8.31533 0 9.853 0.629333 11.113 1.888C12.373 3.14667 13.002 4.684 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.4167 9.225 12.1 9.8 11.7 10.3L18 16.6L16.6 18ZM6.5 11C7.75 11 8.81267 10.5627 9.688 9.688C10.5633 8.81333 11.0007 7.75067 11 6.5C10.9993 5.24933 10.562 4.187 9.688 3.313C8.814 2.439 7.75133 2.00133 6.5 2C5.24867 1.99867 4.18633 2.43633 3.313 3.313C2.43967 4.18967 2.002 5.252 2 6.5C1.998 7.748 2.43567 8.81067 3.313 9.688C4.19033 10.5653 5.25267 11.0027 6.5 11Z" fill="white"/>
                </Svg>  
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/coffee")} className="flex-1 h-[36px] items-center justify-center">
                <Svg width="22" height="21" viewBox="0 0 22 21" fill="none">
                  <Path d="M5 17C6.43822 16.7865 7.75171 16.063 8.70082 14.9615C9.64993 13.86 10.1714 12.454 10.17 11.0001C10.1772 9.17489 10.8393 7.41295 12.0359 6.03472C13.2324 4.65648 14.8839 3.75351 16.69 3.49005L19.28 3.12005C19.21 3.04005 19.15 2.96005 19.07 2.88005C15.81 -0.379949 9.55 0.60005 5.07 5.06005C1.28 8.90005 1.01328e-06 14 1.76 17.46L5 17Z" fill="white"/>
                  <Path d="M11.73 10.9998C11.7235 12.8247 11.0631 14.5867 9.86875 15.9664C8.67438 17.3461 7.02508 18.252 5.22001 18.5198L2.76001 18.8698L2.91001 19.0398C6.17001 22.2998 12.43 21.3298 16.91 16.8698C20.68 13.1098 22 7.99984 20.25 4.58984L16.91 5.06984C15.481 5.27743 14.1733 5.98932 13.2233 7.07686C12.2733 8.1644 11.7437 9.55587 11.73 10.9998Z" fill="white"/>
                </Svg>
              </TouchableOpacity>
            </View>
            <TouchableOpacity className="px-[8px] py-[4px] mb-[8px]" onPress={handleAddressChange}>
              <Text className="text-[14px] text-mono_400">Поменять адрес</Text>
            </TouchableOpacity>
            <View className="bg-mono_900 rounded-full px-[12px] py-[8px]">
              <Text className="text-[14px] text-white">Поддержка: +77064245188</Text>
            </View>
            {/* <TouchableOpacity onPress={openLogoutBottomSheet}>
              <Text className="text-[14px] text-white">Выйти</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openCardsBottomSheet}>
              <Text className="text-[14px] text-white">Карты</Text>
            </TouchableOpacity> */}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

export default Map;