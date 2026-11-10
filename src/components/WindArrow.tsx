import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = { deg: number; color: string; size?: number };

// Wijst in de hoek waaruit de wind waait (0° = uit het noorden),
// precies wat de opdracht vraagt: de pijl toont de windrichting.
export const WindArrow = ({ deg, color, size = 13 }: Props) => (
  <MaterialCommunityIcons
    name="navigation"
    color={color}
    size={size}
    style={{ transform: [{ rotate: `${deg}deg` }] }}
  />
);
