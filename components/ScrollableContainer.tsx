import React from 'react';
import { View, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface ScrollableContainerProps {
  children: React.ReactNode;
  style?: any;
  className?: string;
}

/**
 * A wrapper component that prevents bottomsheet pan gestures from interfering
 * with horizontal scrolling on Android. Use this to wrap horizontal FlatLists
 * and ScrollViews within bottomsheets.
 */
const ScrollableContainer: React.FC<ScrollableContainerProps> = ({ 
  children, 
  style, 
  className 
}) => {
  // Create a pan gesture that only allows horizontal movement
  const horizontalGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Allow horizontal movement
    .failOffsetY([-5, 5]) // Fail on vertical movement
    .simultaneousWithExternalGesture(Gesture.Native());

  if (Platform.OS !== 'android') {
    // On iOS, no special handling needed
    return (
      <View style={style} className={className}>
        {children}
      </View>
    );
  }

  return (
    <GestureDetector gesture={horizontalGesture}>
      <View 
        style={style} 
        className={className}
        // Prevent parent touch events from interfering
        onTouchStart={(e) => {
          // Stop event propagation to prevent bottomsheet gesture interference
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          // Allow horizontal scrolling by stopping propagation
          e.stopPropagation();
        }}
      >
        {children}
      </View>
    </GestureDetector>
  );
};

export default ScrollableContainer;
