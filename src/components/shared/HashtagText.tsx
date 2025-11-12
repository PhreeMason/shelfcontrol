import { Hashtag } from '@/types/hashtags.types';
import { parseTextWithHashtags } from '@/utils/hashtagUtils';
import React, { useMemo } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
} from 'react-native';

interface HashtagTextProps {
  text: string;
  hashtags: Hashtag[];
  style?: StyleProp<TextStyle>;
  onHashtagPress?: (hashtagName: string, hashtagId: string) => void;
  numberOfLines?: number | undefined;
}

/**
 * Component that renders text with colored hashtags inline
 * Parses text and applies colors to hashtags based on their stored color
 */
export const HashtagText: React.FC<HashtagTextProps> = ({
  text,
  hashtags,
  style,
  onHashtagPress,
  numberOfLines,
}) => {
  const hashtagsMap = useMemo(() => {
    const map = new Map<string, { color: string; id?: string }>();
    hashtags.forEach(h => {
      map.set(h.name.toLowerCase(), { color: h.color, id: h.id });
    });
    return map;
  }, [hashtags]);

  const segments = useMemo(() => {
    return parseTextWithHashtags(text, hashtagsMap);
  }, [text, hashtagsMap]);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((segment, index) => {
        if (segment.type === 'hashtag' && segment.color) {
          const hashtagContent = (
            <Text
              style={[
                styles.hashtag,
                {
                  color: segment.color,
                  backgroundColor: `${segment.color}20`,
                },
              ]}
            >
              {segment.text}
            </Text>
          );

          if (onHashtagPress && segment.id) {
            return (
              <TouchableOpacity
                key={segment.id ? `hashtag-${segment.id}-${index}` : `text-${index}`}
                onPress={() =>
                  onHashtagPress(segment.text.slice(1), segment.id!)
                }
                activeOpacity={0.7}
              >
                {hashtagContent}
              </TouchableOpacity>
            );
          }

          return (
            <Text key={segment.id ? `hashtag-text-${segment.id}-${index}` : `text-${index}`}>{hashtagContent}</Text>
          );
        }
        return <Text key={`text-${index}`}>{segment.text}</Text>;
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  hashtag: {
    fontWeight: '600',
    paddingHorizontal: 4,
    borderRadius: 4,
    marginBottom: -4,
  },
});
