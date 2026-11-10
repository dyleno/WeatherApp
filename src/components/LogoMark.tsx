import { View } from 'react-native';

type Props = { size?: number; teal: string; accent: string };

// Het merk: teal ring met oranje stip rechtsonder, zoals in het Figma-design.
export const LogoMark = ({ size = 40, teal, accent }: Props) => (
  <View style={{ width: size, height: size }}>
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: Math.max(3, size * 0.17),
        borderColor: teal,
      }}
    />
    <View
      style={{
        position: 'absolute',
        right: -size * 0.02,
        bottom: -size * 0.02,
        width: size * 0.3,
        height: size * 0.3,
        borderRadius: size * 0.15,
        backgroundColor: accent,
      }}
    />
  </View>
);
