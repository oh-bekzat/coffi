import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from "react-native";
import Svg, { Path } from "react-native-svg";

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  validation?: "error" | "success" | "focused" | "default";
  isPassword?: boolean;
  isSearch?: boolean;
  disabled?: boolean;
  isPhoneNumber?: boolean;
}

const CustomInput: React.FC<InputProps> = ({
  label,
  icon,
  validation = "default",
  isPassword = false,
  isSearch = false,
  disabled = false,
  isPhoneNumber = false,
  value = "",
  onChangeText,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(!isPassword);

  const getBorderColor = () => {
    if (disabled) return "border-mono_600";
    if (validation === "error") return "border-red_700";
    if (validation === "success") return "border-green_700";
    if (focused) return "border-blue_700";
    return "border-transparent";
  };

  return (
    <View className={`relative h-[56px] w-full rounded-full bg-mono_700 border ${getBorderColor()} flex-col justify-center`}>
      {label && (<Text className={`absolute text-[12px] ${isSearch && "ml-[40px]"} top-[8px] left-[36px] text-mono_600`}>{label}</Text>)}

      {isSearch && <Text className="absolute">hi</Text>}

      {isPhoneNumber && <Text className="absolute left-[36px] text-main_white text-[16px]">+7</Text>}

      <TextInput
        className={`${label ? "pt-[16px]" : "pt-0"} ${isSearch ? "pl-[76px]" : "pl-[36px]"} ${isPhoneNumber ? "pl-[60px]" : "pl-[36px]"} ${disabled ? "text-mono_600" : "text-main_white"} h-full text-[16px]`}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        secureTextEntry={!passwordVisible && isPassword}
        placeholderTextColor="#9CA3AF" // Setting placeholder text color to a gray color
        {...props}
      />

      {isPassword ? (
        <TouchableOpacity
          onPress={() => setPasswordVisible(!passwordVisible)}
          className="absolute right-[36px]"
        >
          {passwordVisible ? (
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="white"/>
            </Svg>
          ) : (
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M12 6.5C15.79 6.5 19.17 8.63 20.82 12C19.17 15.37 15.79 17.5 12 17.5C8.21 17.5 4.83 15.37 3.18 12C4.83 8.63 8.21 6.5 12 6.5ZM12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 9.5C13.38 9.5 14.5 10.62 14.5 12C14.5 13.38 13.38 14.5 12 14.5C10.62 14.5 9.5 13.38 9.5 12C9.5 10.62 10.62 9.5 12 9.5ZM12 7.5C9.52 7.5 7.5 9.52 7.5 12C7.5 14.48 9.52 16.5 12 16.5C14.48 16.5 16.5 14.48 16.5 12C16.5 9.52 14.48 7.5 12 7.5Z" fill="white"/>
              <Path d="M2 2L22 22" stroke="white" strokeWidth="2"/>
            </Svg>
          )}
        </TouchableOpacity>
      ) : (
        icon && (
          <Text>hi</Text>
        )
      )}
    </View>
  );
};

export default CustomInput;