import Svg, { Circle, Ellipse } from 'react-native-svg';

const PETALS = [0, 60, 120, 180, 240, 300];

/**
 * One "lotus" node — the six-petal spike cluster you see across an AcuTech acupressure mat.
 * It's the app's only decorative motif: the texture of the partner card, the app icon and the splash.
 */
export function Lotus({ size = 14, color, center }: { size?: number; color: string; center?: string }) {
  return (
    <Svg width={size} height={size} viewBox="-10 -10 20 20">
      {PETALS.map((deg) => (
        <Ellipse key={deg} cx={0} cy={-5.4} rx={2.9} ry={3.9} fill={color} transform={`rotate(${deg})`} />
      ))}
      <Circle cx={0} cy={0} r={1.9} fill={center ?? color} />
    </Svg>
  );
}
