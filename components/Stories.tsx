// import { useState, useRef, useEffect } from 'react';
// import { View, Text, Pressable } from 'react-native';
// import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
// // import { onboardingVideos } from '../utils/videos';
// import LoadingSpinner from './LoadingSpinner';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import CustomButton from './CustomButton';
// const Stories = ({ onComplete }: { onComplete: () => void }) => {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   // const videos = Object.values(onboardingVideos);
//   const [isLoading, setIsLoading] = useState(true);
//   const [progress, setProgress] = useState(0);
//   const videoRef = useRef<Video>(null);

//   useEffect(() => {
//     const timer = setTimeout(async () => {
//       try {
//         if (!videoRef.current) return;
//         setIsLoading(true);
//         setProgress(0);
//         await videoRef.current.unloadAsync();
//         await videoRef.current.loadAsync(videos[currentIndex].source, {
//           shouldPlay: true,
//           isMuted: true,
//         });
//       } catch (error) {
//         // console.error('Error loading video:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     }, 100);

//     return () => clearTimeout(timer);
//   }, [currentIndex]);

//   const handleNext = () => {
//     if (currentIndex < videos.length - 1) {
//       setCurrentIndex(prev => prev + 1);
//     } else {
//       onComplete();
//     }
//   };

//   const handlePlaybackStatus = (status: AVPlaybackStatus) => {
//     if (!status.isLoaded) return;
    
//     if (status.didJustFinish) {
//       handleNext();
//     } else if (status.durationMillis) {
//       setProgress(status.positionMillis / status.durationMillis);
//     }
//   };

//   return (
//     <View className="flex-1 bg-black">
//       <Video
//         ref={videoRef}
//         resizeMode={ResizeMode.COVER}
//         style={{ flex: 1 }}
//         onPlaybackStatusUpdate={handlePlaybackStatus}
//       />
      
//       {/* Progress bars */}
//       <SafeAreaView className="absolute top-[10px] w-full flex-row px-4 gap-1">
//         {videos.map((_, index) => (
//           <View 
//             key={index} 
//             className="flex-1 h-1 rounded-full overflow-hidden bg-white/30"
//           >
//             <View 
//               className="h-full bg-white" 
//               style={{ 
//                 width: `${index < currentIndex ? 100 : index === currentIndex ? progress * 100 : 0}%` 
//               }} 
//             />
//           </View>
//         ))}
//       </SafeAreaView>

//       {/* Content overlay */}
//       <SafeAreaView className="absolute bottom-[15%] flex justify-center items-center w-full">
//         <Text className="text-white text-[32px] leading-[41px] font-bold text-center mb-[20px] w-[70%]">
//           {videos[currentIndex].title}
//         </Text>
//         <CustomButton 
//           onPress={handleNext}
//           text={videos[currentIndex].buttonText}
//         />
//       </SafeAreaView>

//       {/* Skip area */}
//       <Pressable 
//         onPress={handleNext}
//         className="absolute right-0 top-0 bottom-0 w-1/3"
//       />

//       {isLoading && <LoadingSpinner />}
//     </View>
//   );
// };

// export default Stories; 

// This component is not currently being used but is kept for future reference 