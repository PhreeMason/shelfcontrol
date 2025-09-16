// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<
  SymbolViewProps['name'],
  ComponentProps<typeof MaterialIcons>['name']
>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'camera.fill': 'photo-camera',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.down': 'keyboard-arrow-down',
  'books.vertical': 'library-books',
  magnifyingglass: 'search',
  'xmark.circle.fill': 'cancel',
  'arrow.left': 'arrow-left',
  'gearshape.fill': 'settings',
  'rectangle.portrait.and.arrow.right': 'logout',
  'chevron.left': 'keyboard-arrow-left',
  plus: 'add',
  // Stats page icons
  'chart.bar.fill': 'bar-chart',
  speedometer: 'speed',
  'info.circle.fill': 'info',
  'checkmark.circle.fill': 'check-circle',
  'exclamationmark.triangle.fill': 'warning',
  '1.circle.fill': 'looks-one',
  '2.circle.fill': 'looks-two',
  'clock.fill': 'schedule',
  // Profile icons
  'person.fill': 'person',
  'bell.fill': 'notifications',
  'moon.fill': 'dark-mode',
  'slider.horizontal.3': 'tune',
  'book.fill': 'menu-book',
  headphones: 'headphones',
  pencil: 'edit',
  // Calendar icons
  calendar: 'event',
  envelope: 'email',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
