import { Dimensions, StyleSheet, View, LayoutChangeEvent, Keyboard, KeyboardEvent, Platform, TouchableWithoutFeedback, Pressable, StatusBar } from 'react-native';
import React, { useCallback, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
  withSpring,
  cancelAnimation,
  useAnimatedReaction,
  SharedValue,
} from 'react-native-reanimated';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');
const { height: SCREEN_HEIGHT } = Dimensions.get('screen');

// Calculate actual usable screen height accounting for Android system bars
const getActualScreenHeight = () => {
  if (Platform.OS === 'android') {
    // Use screen height instead of window height on Android to account for navigation bar
    return SCREEN_HEIGHT;
  }
  return WINDOW_HEIGHT;
};

const ACTUAL_SCREEN_HEIGHT = getActualScreenHeight();

// Minimum height for the sheet to show when fully expanded
const MIN_SHEET_HEIGHT = 150;
// Default percentage of screen to show when sheet is opened without a specific height
const DEFAULT_SHEET_PERCENTAGE = 0.6;
// Maximum percentage of screen the sheet can take
const MAX_SHEET_PERCENTAGE = 0.9;
// Threshold percentage for determining when to close the sheet on swipe
const CLOSE_THRESHOLD_PERCENTAGE = 0.25;
// Threshold percentage for determining when to fully expand the sheet on swipe
const EXPAND_THRESHOLD_PERCENTAGE = 0.6;
// Animation durations
const ANIMATION_DURATION = 300;
// Spring animation config
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 90,
  mass: 0.5,
  overshootClamping: false,
};
// Timing animation config
const TIMING_CONFIG = {
  duration: ANIMATION_DURATION,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

type BottomSheetProps = {
  children?: React.ReactNode;
  onClose?: () => void;
  // Optional initial height (percentage of screen or absolute pixels)
  initialHeight?: number;
  // Optional background color
  backgroundColor?: string;
  // Optional handle color
  handleColor?: string;
  // Optional shadow color
  shadowColor?: string;
  // Optional flag to disable the sheet
  disabled?: boolean;
  // Optional callback when sheet is fully opened
  onOpen?: () => void;
  // Optional location path or identifier to track location changes
  locationPath?: string;
  // Optional pre-measured content height, if known
  contentHeightHint?: number;
  // Whether to measure content before opening
  preMeasureContent?: boolean;
  // Optional flag to always use a fixed height (initialHeight or DEFAULT_SHEET_PERCENTAGE)
  useFixedHeight?: boolean;
};

export type BottomSheetRefProps = {
  // Scroll to a specific position (0 = closed, -1 = content height)
  scrollTo: (destination: number) => void;
  // Check if the sheet is active
  isActive: () => boolean;
  // Get the current content height
  getContentHeight: () => number;
  // Close the sheet
  close: () => void;
  // Open the sheet
  open: () => void;
  // Update content measurement
  updateMeasurement: () => void;
};

const BottomSheet = React.forwardRef<BottomSheetRefProps, BottomSheetProps>(
  ({ 
    children, 
    onClose, 
    initialHeight, 
    backgroundColor = '#2a2b2c',
    handleColor = '#666',
    shadowColor = "#000",
    disabled = false,
    onOpen,
    locationPath,
    contentHeightHint,
    preMeasureContent = true,
    useFixedHeight = false,
  }, ref) => {
    // Animation values - start with a value that ensures complete hiding on Android
    const translateY = useSharedValue(Platform.OS === 'android' ? 100 : 0);
    const active = useSharedValue(false);
    const dragging = useSharedValue(false);
    const closing = useSharedValue(false);
    const hasAnimatedToInitialPosition = useSharedValue(false);
    
    // State values for content measurement
    const [contentHeight, setContentHeight] = useState(contentHeightHint || 0);
    const [contentVisible, setContentVisible] = useState(true);
    const [contentMeasured, setContentMeasured] = useState(!!contentHeightHint);
    
    // Keyboard values
    const keyboardHeight = useSharedValue(0);
    const keyboardVisible = useSharedValue(false);
    
    // Regular JS refs for non-animation values
    const contentRef = useRef<View>(null);
    const contentHeightRef = useRef(contentHeightHint || 0);
    const openCloseDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const measureTimeout = useRef<NodeJS.Timeout | null>(null);
    const isMounted = useRef(true);
    const prevLocationPathRef = useRef(locationPath);
    
    // Shared value for max translate Y to avoid recalculating in animations
    const maxTranslateY = useSharedValue(0);

    // Safely set state only when component is mounted
    const safeSetContentVisibleState = useCallback((value: boolean) => {
      if (isMounted.current) {
        setContentVisible(value);
      }
    }, []);

    const safeSetContentHeightState = useCallback((value: number) => {
      if (isMounted.current) {
        setContentHeight(value);
        setContentMeasured(true);
      }
    }, []);
    
    // Update the content height ref whenever the state changes
    useEffect(() => {
      contentHeightRef.current = contentHeight;
      
      // Update maxTranslateY shared value without reading in render
      if (contentHeight > 0) {
        const calculatedMax = -Math.min(
          contentHeight + 60, // Additional padding
          ACTUAL_SCREEN_HEIGHT * MAX_SHEET_PERCENTAGE
        );
        maxTranslateY.value = calculatedMax;
      } else {
        const defaultHeight = initialHeight 
          ? (initialHeight <= 1 ? initialHeight * ACTUAL_SCREEN_HEIGHT : initialHeight)
          : ACTUAL_SCREEN_HEIGHT * DEFAULT_SHEET_PERCENTAGE;
        
        maxTranslateY.value = -Math.min(defaultHeight, ACTUAL_SCREEN_HEIGHT * MAX_SHEET_PERCENTAGE);
      }
    }, [contentHeight, initialHeight, maxTranslateY]);

    // Track location changes and close sheet if location changes
    useEffect(() => {
      // Skip the initial mount
      if (prevLocationPathRef.current !== locationPath && prevLocationPathRef.current !== undefined) {
        // Location has changed, close the sheet
        if (active.value) {
          closeSheet();
        }
      }
      
      prevLocationPathRef.current = locationPath;
    }, [locationPath]);

    // Function to get max translate Y - safe to call in worklets
    const getMaxTranslateYWorklet = useCallback(() => {
      'worklet';
      return maxTranslateY.value;
    }, [maxTranslateY]);

    // Handle keyboard dismissal
    const dismissKeyboard = useCallback(() => {
      Keyboard.dismiss();
    }, []);

    // Clear any pending timeouts
    const clearTimeouts = useCallback(() => {
      if (openCloseDebounceTimeout.current) {
        clearTimeout(openCloseDebounceTimeout.current);
        openCloseDebounceTimeout.current = null;
      }
      if (measureTimeout.current) {
        clearTimeout(measureTimeout.current);
        measureTimeout.current = null;
      }
    }, []);

    // Close the sheet with debounce protection
    const closeSheet = useCallback(() => {
      // Check values safely without accessing shared values directly
      if (closing.value || !active.value) return;
      
      clearTimeouts();
      closing.value = true;
      
      // Debounce closing to prevent race conditions
      openCloseDebounceTimeout.current = setTimeout(() => {
        dismissKeyboard();
        active.value = false;
        keyboardVisible.value = false;
        keyboardHeight.value = 0;
        hasAnimatedToInitialPosition.value = false;
        
        // Ensure complete hiding on Android by adding extra offset
        const hidePosition = Platform.OS === 'android' ? 100 : 0;
        
        translateY.value = withTiming(hidePosition, TIMING_CONFIG, (finished) => {
          if (finished) {
            closing.value = false;
            runOnJS(safeSetContentVisibleState)(true);
            if (onClose && isMounted.current) {
              runOnJS(onClose)();
            }
          }
        });
      }, 50);
    }, [onClose, dismissKeyboard, safeSetContentVisibleState, active, closing, translateY, keyboardVisible, keyboardHeight, hasAnimatedToInitialPosition]);

    // Reliable content measurement
    const forceContentMeasurement = useCallback(() => {
      if (!contentRef.current || !isMounted.current) return Promise.resolve(0);
      
      return new Promise<number>((resolve) => {
        // Make content visible for measurement if it's not
        if (!contentVisible) {
          safeSetContentVisibleState(true);
        }
        
        // Use a sequence of requestAnimationFrames to ensure content is fully rendered
        requestAnimationFrame(() => {
          // Wait for two animation frames to ensure layout is complete
          requestAnimationFrame(() => {
            if (!contentRef.current || !isMounted.current) {
              resolve(0);
              return;
            }
            
            // Force layout calculation to ensure accurate measurement
            contentRef.current.measure((_x, _y, width, height) => {
              if (height > MIN_SHEET_HEIGHT && isMounted.current) {
                safeSetContentHeightState(height);
                contentHeightRef.current = height;
                resolve(height);
              } else if (contentHeightRef.current > MIN_SHEET_HEIGHT) {
                // Fall back to previously stored height if available
                resolve(contentHeightRef.current);
              } else {
                // Use default height as last resort
                const defaultHeight = ACTUAL_SCREEN_HEIGHT * DEFAULT_SHEET_PERCENTAGE;
                resolve(defaultHeight);
              }
            });
          });
        });
      });
    }, [contentVisible, safeSetContentVisibleState, safeSetContentHeightState]);

    // Open the sheet with debounce protection
    const openSheet = useCallback(async () => {
      // Check values safely
      if (disabled || active.value || closing.value) return;
      
      clearTimeouts();
      safeSetContentVisibleState(true);
      dismissKeyboard(); // Clear keyboard first to avoid height issues
      
      // Pre-calculate height before any animation
      let targetHeight: number;
      let targetTranslateY: number;
      
      if (useFixedHeight) {
        targetHeight = initialHeight 
          ? (initialHeight <= 1 ? initialHeight * ACTUAL_SCREEN_HEIGHT : initialHeight)
          : ACTUAL_SCREEN_HEIGHT * DEFAULT_SHEET_PERCENTAGE;
      } else {
        // Force an immediate measurement before animation
        const measuredHeight = await forceContentMeasurement();
        targetHeight = Math.max(measuredHeight, MIN_SHEET_HEIGHT);
      }
      
      // Ensure we have a valid height
      targetHeight = Math.max(targetHeight, MIN_SHEET_HEIGHT);
      
      // Calculate target position with hard limits
      targetTranslateY = -Math.min(
        targetHeight + 60, // Add padding
        ACTUAL_SCREEN_HEIGHT * MAX_SHEET_PERCENTAGE
      );
      
      // Update shared values immediately
      maxTranslateY.value = targetTranslateY;
      
      // Ensure we're mounted before continuing
      if (!isMounted.current) return;
      
      // Set active state
      active.value = true;
      hasAnimatedToInitialPosition.value = true;
      
      // Use timing animation for the initial open for more predictable height
      translateY.value = withTiming(
        targetTranslateY, 
        {
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic)
        },
        (finished) => {
          if (finished && isMounted.current && onOpen) {
            runOnJS(onOpen)();
          }
        }
      );
    }, [
      disabled, active, closing, maxTranslateY, onOpen, 
      safeSetContentVisibleState, forceContentMeasurement, 
      hasAnimatedToInitialPosition, useFixedHeight, initialHeight,
      dismissKeyboard
    ]);

    // Handle content height measurement
    const measureContent = useCallback(() => {
      if (!contentRef.current || !isMounted.current) return;
      
      // Use direct imperative measurement to avoid React Native layout issues
      contentRef.current.measure((_x, _y, width, height) => {
        if (height > MIN_SHEET_HEIGHT && isMounted.current) {
          // Only update if significantly different to avoid re-render loops
          if (Math.abs(height - contentHeightRef.current) > 5) {
            safeSetContentHeightState(height);
            contentHeightRef.current = height;
            
            // If sheet is already open and we got a significant height change, update position
            if (active.value && hasAnimatedToInitialPosition.value && !dragging.value && !closing.value) {
              translateY.value = withTiming(maxTranslateY.value, TIMING_CONFIG);
            }
          }
        }
      });
    }, [safeSetContentHeightState, active, dragging, closing, maxTranslateY, hasAnimatedToInitialPosition]);

    // React to content height changes for animation
    useAnimatedReaction(
      () => {
        return {
          maxY: maxTranslateY.value,
          isActive: active.value,
          isDragging: dragging.value,
          isClosing: closing.value,
          hasAnimatedInitially: hasAnimatedToInitialPosition.value
        };
      },
      (result, previous) => {
        // Only update position if max height changed and sheet is active
        const prevResult = previous || { maxY: 0, isActive: false, hasAnimatedInitially: false };
        
        if (result.maxY !== prevResult.maxY && 
            result.isActive && 
            !result.isDragging && 
            !result.isClosing &&
            result.hasAnimatedInitially) {
          translateY.value = withTiming(result.maxY, TIMING_CONFIG);
        }
      }
    );

    // Handle layout changes
    const onLayout = useCallback((event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      if (height > MIN_SHEET_HEIGHT && Math.abs(height - contentHeightRef.current) > 5) {
        safeSetContentHeightState(height);
        contentHeightRef.current = height;
      }
    }, [safeSetContentHeightState]);

    // Force content measurement after render
    useEffect(() => {
      // Initial measurement
      measureTimeout.current = setTimeout(measureContent, 100);
      
      return () => {
        isMounted.current = false;
        clearTimeouts();
      };
    }, [measureContent, clearTimeouts]);

    // Measure content whenever it might have changed
    useEffect(() => {
      if (contentVisible) {
        measureTimeout.current = setTimeout(measureContent, 100);
      }
      
      return () => {
        if (measureTimeout.current) {
          clearTimeout(measureTimeout.current);
        }
      };
    }, [measureContent, contentVisible, children]);

    // Monitor keyboard events
    useEffect(() => {
      const keyboardWillShow = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        (e: KeyboardEvent) => {
          keyboardVisible.value = true;
          keyboardHeight.value = e.endCoordinates.height;
          
          // Only update if sheet is active and not being closed or dragged
          if (active.value && !closing.value && !dragging.value) {
            // Adjust position to accommodate keyboard
            const adjustKeyboard = () => {
              'worklet';
              // For Android, we need to adjust more aggressively
              const keyboardOffset = Platform.OS === 'ios' ? 0 : keyboardHeight.value;
              const adjustedPosition = maxTranslateY.value - keyboardOffset;
              
              // Use timing for more predictable animation
              translateY.value = withTiming(
                adjustedPosition,
                { 
                  duration: Platform.OS === 'ios' ? ANIMATION_DURATION : 50, // Faster on Android
                  easing: Easing.out(Easing.cubic)
                }
              );
            };
            
            adjustKeyboard();
          }
        }
      );

      const keyboardWillHide = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => {
          keyboardVisible.value = false;
          keyboardHeight.value = 0;
          
          // Only update if sheet is active and not being closed or dragged
          if (active.value && !closing.value && !dragging.value) {
            // Reset position after keyboard hides
            const hideKeyboard = () => {
              'worklet';
              translateY.value = withTiming(
                maxTranslateY.value, 
                { 
                  duration: Platform.OS === 'ios' ? ANIMATION_DURATION : 100,
                  easing: Easing.out(Easing.cubic)
                }
              );
            };
            
            hideKeyboard();
          }
        }
      );

      return () => {
        keyboardWillShow.remove();
        keyboardWillHide.remove();
      };
    }, []);

    // Clean up animations on unmount
    useEffect(() => {
      return () => {
        cancelAnimation(translateY);
        clearTimeouts();
      };
    }, [clearTimeouts]);

    // External access to scroll the sheet
    const scrollTo = useCallback((destination: number) => {
      if (disabled) return;
      
      if (destination === 0) {
        closeSheet();
      } else {
        // Handle special case for content-based height
        const targetPosition = destination === -1
          ? maxTranslateY.value
          : destination;
        
        safeSetContentVisibleState(true);
        
        // Open the sheet immediately without delayed timing
        active.value = true;
        closing.value = false;
        hasAnimatedToInitialPosition.value = true;
        
        // Use timing animation for consistent behavior
        translateY.value = withTiming(
          targetPosition, 
          { 
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic)
          }, 
          (finished) => {
            if (finished && destination !== 0 && onOpen && isMounted.current) {
              runOnJS(onOpen)();
            }
          }
        );
      }
    }, [disabled, closeSheet, maxTranslateY, onOpen, safeSetContentVisibleState, hasAnimatedToInitialPosition]);

    // Check if sheet is active - safe to call from JS thread
    const checkIsActive = useCallback(() => {
      // Use regular ref to track the value instead of direct access
      return active.value;
    }, []);

    // Get current content height - safe to call from JS thread
    const getContentHeight = useCallback(() => {
      return contentHeightRef.current;
    }, []);

    // Expose method to manually trigger content measurement
    const updateMeasurement = useCallback(async () => {
      const height = await forceContentMeasurement();
      
      // If sheet is active, update position with new height
      if (active.value && !closing.value && !dragging.value && height > 0) {
        translateY.value = withTiming(maxTranslateY.value, TIMING_CONFIG);
      }
      
      return height;
    }, [forceContentMeasurement, active, closing, dragging, maxTranslateY]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      scrollTo,
      isActive: checkIsActive,
      getContentHeight,
      close: closeSheet,
      open: openSheet,
      updateMeasurement,
    }), [scrollTo, checkIsActive, getContentHeight, closeSheet, openSheet, updateMeasurement]);

    // Pan gesture handling
    const context = useSharedValue({ y: 0 });
    
    // Define this as a worklet outside the gesture handler
    const updatePosition = (newY: number) => {
      'worklet';
      const minY = keyboardVisible.value
        ? maxTranslateY.value - keyboardHeight.value
        : maxTranslateY.value;
        
      translateY.value = Math.min(Math.max(newY, minY), 0);
    };
    
    // Define this as a worklet too
    const handleGestureEnd = (velocityY: number, translationY: number) => {
      'worklet';
      
      // Calculate thresholds relative to max translate
      const maxTranslate = maxTranslateY.value;
      const closeThreshold = maxTranslate * CLOSE_THRESHOLD_PERCENTAGE;
      const expandThreshold = maxTranslate * EXPAND_THRESHOLD_PERCENTAGE;
      
      // Check for tap on the backdrop (very small movement)
      const isTiny = Math.abs(translationY) < 5 && Math.abs(velocityY) < 5;
      
      if (isTiny) {
        // This is probably a tap event leaking through - ignore
        return;
      }
      
      if (velocityY > 500) {
        // Fast swipe down - close immediately
        runOnJS(closeSheet)();
      } else if (velocityY > 100 || translateY.value > closeThreshold) {
        // Slower swipe down or dragged past close threshold - close
        runOnJS(closeSheet)();
      } else if (translateY.value < expandThreshold || velocityY < -500) {
        // Swiped up fast or past expand threshold - expand fully
        active.value = true;
        closing.value = false;
        hasAnimatedToInitialPosition.value = true;
        
        // For fixed height, strictly maintain maxTranslateY
        const targetPosition = useFixedHeight
          ? maxTranslate
          : maxTranslate - (keyboardVisible.value ? keyboardHeight.value : 0);
        
        translateY.value = withTiming(
          targetPosition, 
          { 
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic)
          },
          (finished) => {
            if (finished && isMounted.current && onOpen) {
              runOnJS(onOpen)();
            }
          }
        );
      } else {
        // Default - maintain current expanded state at content height
        active.value = true;
        closing.value = false;
        hasAnimatedToInitialPosition.value = true;
        
        const contentPosition = useFixedHeight
          ? maxTranslate
          : maxTranslate - (keyboardVisible.value ? keyboardHeight.value : 0);
        
        translateY.value = withTiming(
          contentPosition, 
          { 
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic)
          },
          (finished) => {
            if (finished && isMounted.current && onOpen) {
              runOnJS(onOpen)();
            }
          }
        );
      }
    };
    
    const gesture = Gesture.Pan()
      .enabled(!disabled)
      .minDistance(10) // Require minimum distance to recognize as a drag
      .simultaneousWithExternalGesture(Gesture.Native()) // Allow simultaneous gestures for horizontal scrolling
      .onStart(() => {
        'worklet';
        if (closing.value) return;
        context.value = { y: translateY.value };
        dragging.value = true;
        cancelAnimation(translateY);
      })
      .onUpdate((event) => {
        'worklet';
        if (closing.value) return;
        
        // Only handle vertical gestures to avoid interfering with horizontal scrolling
        const isVerticalGesture = Math.abs(event.translationY) > Math.abs(event.translationX);
        if (!isVerticalGesture && Math.abs(event.translationY) < 20) {
          return; // Don't interfere with horizontal scrolling
        }
        
        // Calculate new position within bounds
        const newY = event.translationY + context.value.y;
        updatePosition(newY);
      })
      .onEnd((event) => {
        'worklet';
        if (closing.value) return;
        dragging.value = false;
        
        // Only handle end if it was a vertical gesture
        const isVerticalGesture = Math.abs(event.translationY) > Math.abs(event.translationX);
        if (isVerticalGesture || Math.abs(event.translationY) >= 20) {
          handleGestureEnd(event.velocityY, event.translationY);
        }
      });

    // Animated styles
    const rBottomSheetStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateY: translateY.value }],
      };
    });

    const rOverlayStyle = useAnimatedStyle(() => {
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
        opacity: withTiming(active.value ? 0.5 : 0, TIMING_CONFIG),
        pointerEvents: active.value ? 'auto' : 'none',
      };
    });
    
    const backdropPressHandler = useCallback(() => {
      closeSheet();
    }, [closeSheet]);
    
    // Handle sheet drag indicator
    const renderHandle = () => (
      <View style={styles.handleContainer}>
        <View style={[styles.handle, { backgroundColor: handleColor }]} />
      </View>
    );

    // Handle touch events within the sheet content
    const contentPressHandler = useCallback((e: any) => {
      // Stop propagation of tap events to prevent backdrop from closing
      e.stopPropagation();
      
      // Dismiss keyboard on Android when tapping bottomsheet content
      if (Platform.OS === 'android') {
        Keyboard.dismiss();
      }
    }, []);

    return (
      <>
        <Pressable onPress={backdropPressHandler}>
          <Animated.View style={rOverlayStyle} />
        </Pressable>
        
        <GestureDetector gesture={gesture}>
          <Animated.View 
            style={[
              styles.bottomSheetContainer, 
              { backgroundColor, shadowColor, opacity: contentVisible ? 1 : 0 }, 
              rBottomSheetStyle
            ]}
          >
            {renderHandle()}
            <Pressable 
              style={styles.contentWrapper}
              onPress={contentPressHandler}
              // Prevent gesture interference with WebViews and other interactive content
              {...(Platform.OS === 'android' && {
                onTouchStart: (e) => {
                  // Allow touch events to propagate to children (like WebViews)
                  // but still handle keyboard dismissal
                  if (Platform.OS === 'android') {
                    // Only dismiss keyboard if not touching an input or webview
                    const target = e.target as any;
                    if (target && target._nativeTag) {
                      // Let WebViews and TextInputs handle their own touch events
                      const isInteractiveElement = target.constructor?.name?.includes('WebView') || 
                                                   target.constructor?.name?.includes('TextInput');
                      if (!isInteractiveElement) {
                        setTimeout(() => Keyboard.dismiss(), 50);
                      }
                    }
                  }
                }
              })}
            >
              <View 
                ref={contentRef}
                onLayout={onLayout} 
                style={styles.contentContainer}
                collapsable={false}
                // Ensure proper touch handling for Android
                {...(Platform.OS === 'android' && {
                  pointerEvents: 'box-none' // Allow children to receive touch events
                })}
              >
                {children}
              </View>
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheetContainer: {
    height: ACTUAL_SCREEN_HEIGHT,
    width: '100%',
    position: 'absolute',
    top: ACTUAL_SCREEN_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    overflow: 'hidden',
  },
  handleContainer: {
    paddingTop: 12,
    alignItems: 'center',
    zIndex: 10,
  },
  handle: {
    width: 60,
    height: 4,
    borderRadius: 3,
  },
  contentWrapper: {
    flex: 1,
  },
  contentContainer: {
    // paddingHorizontal: 16,
    paddingBottom: 30,
  }
});

export default BottomSheet;