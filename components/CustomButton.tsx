import React from "react";
import { TouchableOpacity, Text, View, TouchableOpacityProps } from "react-native";
import { FontAwesome } from '@expo/vector-icons';

interface ButtonProps extends TouchableOpacityProps {
  size?: "normal" | "medium" | "small" | "extrasmall";
  text?: string;
  icon?: string;
  iconPosition?: "start" | "end";
  secondary?: boolean;
  containerStyles?: string;
  isDanger?: boolean;
}

const CustomButton: React.FC<ButtonProps> = ({
  size = "normal",
  text,
  icon,
  iconPosition = "end",
  secondary = false,
  disabled = false,
  containerStyles = "",
  isDanger = false,
  ...props
}) => {
  const getSizeStyle = () => {
    switch (size) {
      case "medium":
        return "h-[48px] px-[32px]";
      case "small":
        return "h-[40px] px-[24px]";
      case "extrasmall":
        return "h-[32px]  px-[24px]";
      default:
        return "h-[56px] px-[32px]";
    }
  };

  const getSizeStyleText = () => {
    switch (size) {
      case "medium":
        return "text-[16px] leading-[20px]";
      case "small":
        return "text-[14px] leading-[16px]";
      case "extrasmall":
        return "text-[14px] leading-[16px]";
      default:
        return "text-[20px] leading-[24px]";
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return secondary ? "bg-transparent" : "bg-mono_800";
    if (isDanger) return secondary ? "bg-transparent" : "bg-red_500";
    return secondary ? "bg-transparent" : "bg-blue_500";
  };

  const getTextColor = () => {
    if (disabled) return secondary ? "text-mono_700" : "text-mono_500";
    return secondary ? "text-blue_500" : "text-white";
  };

  return (
    <TouchableOpacity
      className={`${containerStyles} rounded-full flex-row items-center justify-center ${getSizeStyle()} ${getBackgroundColor()} ${disabled ? "opacity-50" : ""}`}
      disabled={disabled}
      style={[ disabled && { opacity: 1 } ]}
      {...props}
    >
      {icon && iconPosition === "start" && (
        <FontAwesome name={icon as any} size={20} color={getTextColor()} className="mr-2" />
      )}
      {text && <Text className={`${getTextColor()} ${getSizeStyleText()} text-center`}>{text}</Text>}
      {icon && iconPosition === "end" && (
        <FontAwesome name={icon as any} size={20} color={getTextColor()} className="ml-2" />
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;