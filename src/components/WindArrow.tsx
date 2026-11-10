import { useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type Props = { deg: number; color: string; size?: number };

const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

// Wijst in de hoek waaruit de wind waait (0° = uit het noorden) en draait
// geanimeerd mee bij nieuwe data — altijd via de kortste route.
export const WindArrow = ({ deg, color, size = 13 }: Props) => {
  const rotation = useSharedValue(deg);

  useEffect(() => {
    const delta = ((deg - rotation.value + 540) % 360) - 180;
    rotation.value = withTiming(rotation.value + delta, {
      duration: 700,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [deg, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return <AnimatedIcon name="navigation" color={color} size={size} style={animatedStyle} />;
};
