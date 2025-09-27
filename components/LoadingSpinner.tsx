import { View, ActivityIndicator } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  bg?: string;
}

const LoadingSpinner = ({ size = 'large', color = '#fff', bg = 'bg-mono_900' }: LoadingSpinnerProps) => {
  const backgroundClass = bg === 'transparent' ? '' : bg;
  const backgroundStyle = bg === 'transparent' ? { backgroundColor: 'transparent' } : {};
  
  return (
    <View 
      className={`flex-1 justify-center items-center ${backgroundClass}`}
      style={backgroundStyle}
    >
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

export default LoadingSpinner;