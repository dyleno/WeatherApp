import { useCallback } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Props = PressableProps & { scaleTo?: number };

const PRESS_SPRING = { damping: 22, stiffness: 420 };
const RELEASE_SPRING = { damping: 16, stiffness: 300 };

// Druk-feedback: veert licht in bij indrukken en terug bij loslaten.
// Wrapper doet de schaal (buiten alles, zodat randen meeschalen); de Pressable
// krijgt alle props gewoon door.
export const PressableScale = ({ scaleTo = 0.97, onPressIn, onPressOut, ...props }: Props) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      // eslint-disable-next-line react-hooks/immutability -- reanimated shared values zijn per ontwerp mutabel in handlers
      scale.value = withSpring(scaleTo, PRESS_SPRING);
      onPressIn?.(event);
    },
    [onPressIn, scale, scaleTo],
  );

  const handlePressOut = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      // eslint-disable-next-line react-hooks/immutability -- reanimated shared values zijn per ontwerp mutabel in handlers
      scale.value = withSpring(1, RELEASE_SPRING);
      onPressOut?.(event);
    },
    [onPressOut, scale],
  );

  return (
    <Animated.View style={animatedStyle}>
      <Pressable {...props} onPressIn={handlePressIn} onPressOut={handlePressOut} />
    </Animated.View>
  );
};
