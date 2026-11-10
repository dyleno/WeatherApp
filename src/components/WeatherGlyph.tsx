import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { glyphForIcon } from '../core/conditions';
import type { Palette } from '../theme/tokens';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = { code: string; isDay: boolean; size: number; colors: Palette };

// Dekt het ontwerp: bij "few clouds" tekent de zon achter een wolk,
// anders één plat icoon in de stijl van het design.
export const WeatherGlyph = ({ code, isDay, size, colors }: Props) => {
  const base = code.slice(0, 2);

  if (base === '02') {
    return (
      <View style={{ width: size, height: size }}>
        <MaterialCommunityIcons
          name={isDay ? 'weather-sunny' : 'weather-night'}
          color={colors.sun}
          size={size * 0.62}
          style={styles.sun}
        />
        <MaterialCommunityIcons
          name="weather-cloudy"
          color={colors.cloud}
          size={size * 0.82}
          style={styles.cloud}
        />
      </View>
    );
  }

  const name = glyphForIcon(code, isDay) as IconName;
  const color = base === '01' ? colors.sun : colors.cloud;
  return <MaterialCommunityIcons name={name} color={color} size={size} />;
};

const styles = StyleSheet.create({
  sun: { position: 'absolute', top: 0, right: 0 },
  cloud: { position: 'absolute', bottom: 0, left: 0 },
});
