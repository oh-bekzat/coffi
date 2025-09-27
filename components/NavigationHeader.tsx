import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

interface NavigationHeaderProps {
  // Title to display in the header (optional)
  title?: string;
  // Show back button
  showBack?: boolean;
  // Show close button
  showClose?: boolean;
  // Custom back action (defaults to router.back())
  onBack?: () => void;
  // Custom close action (defaults to router.back() or can close modals/sheets)
  onClose?: () => void;
  // Custom styling for the header container
  containerClassName?: string;
  // Custom styling for the title
  titleClassName?: string;
  // Light theme (white icons) or dark theme (black icons)
  light?: boolean;
  // Optional right action button/component
  rightAction?: React.ReactNode;
}

/**
 * Reusable navigation header with back and/or close buttons
 */
const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  showBack = true,
  showClose = false,
  onBack,
  onClose,
  containerClassName,
  titleClassName,
  light = true,
  rightAction,
}) => {
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.replace('/map');
    }
  };
  
  const iconColor = light ? "#FFFFFF" : "#121212";
  
  return (
    <View className={`h-[56px] flex-row items-center px-[20px] justify-between w-full ${containerClassName || ''}`}>
      <View className="flex-row items-center min-w-[40px]">
        {showBack && (
          <TouchableOpacity 
            onPress={handleBack} 
            className="p-[8px] rounded-[20px]"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path 
                d="M19 12H5M5 12L12 19M5 12L12 5" 
                stroke={iconColor} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        )}
      </View>
      
      {title && (
        <Text 
          className={`text-[17px] font-semibold ${light ? 'text-white' : 'text-[#121212]'} flex-1 text-center ${titleClassName || ''}`} 
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
      
      <View className="flex-row items-center justify-end min-w-[40px] gap-[16px]">
        {rightAction}
        
        {showClose && (
          <TouchableOpacity 
            onPress={handleClose} 
            className="p-[8px] rounded-[20px]"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path 
                d="M18 6L6 18M6 6L18 18" 
                stroke={iconColor} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default NavigationHeader; 