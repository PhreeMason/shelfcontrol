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
  minus: 'remove',
  'info.circle.fill': 'info',
  'checkmark.circle.fill': 'check-circle',
  'exclamationmark.circle.fill': 'error',
  'minus.circle': 'remove-circle',
  'person.fill': 'person',
  'person.circle.fill': 'person',
  'book.fill': 'menu-book',
  'line.3.horizontal.decrease': 'filter-list',
  'line.3.horizontal.decrease.circle': 'filter-list',
  'line.3.horizontal.decrease.circle.fill': 'filter-list',
  headphones: 'headphones',
  pencil: 'edit',
  calendar: 'event',
  envelope: 'email',
  xmark: 'close',
  'square.and.arrow.up': 'share',
  'square.and.arrow.down': 'download',
  'ellipsis.circle': 'more-horiz',
  'bookmark.slash': 'bookmark-remove',
  'arrow.clockwise': 'refresh',
  'exclamationmark.triangle': 'warning',
  'calendar.badge.clock': 'event-note',
  'calendar.badge.plus': 'event-available',
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
  'text.page': 'description',
  trash: 'delete',
  'star.fill': 'star',
  at: 'alternate-email',
  'chart.bar.fill': 'bar-chart',
  'arrow.up.forward.square': 'send',
  'books.vertical.fill': 'library-books',
  'arrow.left.arrow.right': 'swap-horiz',
  'arrow.up.right': 'trending-up',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'star.leadinghalf.filled': 'star-half',
  'plus.circle.fill': 'add-circle',
  'play.fill': 'play-circle-fill',
  'list.bullet': 'list',
  'square.grid.2x2': 'grid-view',
  'arrow.triangle.2.circlepath': 'sync',
  star: 'star-border',
  'info.circle': 'info',
  photo: 'photo',
  link: 'link',
  'checkmark.seal.fill': 'verified',
  'hand.thumbsdown.fill': 'thumb-down',
  'arrow.uturn.backward.circle.fill': 'undo',
  'archivebox.fill': 'archive',
  'paintpalette.fill': 'palette',
  gear: 'settings',
  'cylinder.fill': 'storage',
  'questionmark.circle': 'help-outline',
  'heart.fill': 'favorite',
  // Shelf icons
  'tray.full': 'all-inbox',
  paperplane: 'send',
  'paperplane.fill': 'send',
  clock: 'schedule',
  'clock.fill': 'schedule',
  'exclamationmark.circle': 'error-outline',
  'pause.circle': 'pause-circle-outline',
  'xmark.circle': 'cancel',
  'hand.thumbsdown': 'thumb-down',
  'arrow.uturn.left': 'undo',
  'line.3.horizontal': 'menu',
  'pin': 'push-pin',
  'pin.fill': 'push-pin',
  'checkmark.circle': 'check-circle-outline',
  heart: 'favorite-border',
  'tag.fill': 'label',
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
  accessibilityLabel,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
  accessibilityLabel?: string;
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
      accessibilityLabel={accessibilityLabel}
    />
  );
}
