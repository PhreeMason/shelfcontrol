// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<
  SymbolViewProps['name'],
  ComponentProps<typeof MaterialIcons>['name']
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
export const MAPPING = {
  'house.fill': 'home',
  'camera.fill': 'photo-camera',
  'chevron.right': 'chevron-right',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
  'chevron.up.chevron.down': 'unfold-more',
  magnifyingglass: 'search',
  'xmark.circle.fill': 'cancel',
  'chevron.left': 'keyboard-arrow-left',
  plus: 'add',
  'info.circle.fill': 'info',
  'checkmark.circle.fill': 'check-circle',
  'person.fill': 'person',
  'book.fill': 'menu-book',
  'line.3.horizontal.decrease': 'filter-list',
  headphones: 'headphones',
  pencil: 'edit',
  calendar: 'event',
  envelope: 'email',
  xmark: 'close',
  'square.and.arrow.up': 'share',
  'ellipsis.circle': 'more-horiz',
  'bookmark.slash': 'bookmark-remove',
  'arrow.clockwise': 'refresh',
  'exclamationmark.triangle': 'warning',
  'calendar.badge.clock': 'event-note',
  'trash.fill': 'delete',
  'pause.circle.fill': 'pause-circle-filled',
  'play.circle.fill': 'play-circle-filled',
  'circle.grid.2x2.fill': 'category',
  'square.and.pencil': 'edit-square',
  checkmark: 'check',
  'note.text': 'note',
  'pencil.and.scribble': 'edit-note',
  ellipsis: 'more-horiz',
  book: 'menu-book',
  'doc.on.clipboard': 'content-copy',
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
  if (__DEV__ && !(name in MAPPING)) {
    throw new Error(
      `IconSymbol: No Android mapping for "${name}". Please add it to the MAPPING object in IconSymbol.tsx`
    );
  }

  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
