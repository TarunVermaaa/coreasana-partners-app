import { Text, type TextProps } from 'react-native';
import { type as typeScale, type TypeVariant } from '@/theme/tokens';

/** Text with a named style from the type scale: <T v="title">Earnings</T> */
export function T({ v = 'body', style, ...rest }: TextProps & { v?: TypeVariant }) {
  return <Text {...rest} style={[typeScale[v], style]} />;
}
