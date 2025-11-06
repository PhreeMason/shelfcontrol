import { ThemedText, ThemedView } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getAllUserReadingDays } from '@/utils/chartDataUtils';
import { parseServerDateOnly } from '@/utils/dateNormalization';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CurveType, LineChart } from 'react-native-gifted-charts';

interface UserReadingLineChartProps {
  deadlines: ReadingDeadlineWithProgress[];
}

const UserReadingLineChart: React.FC<UserReadingLineChartProps> = ({
  deadlines,
}) => {
  const { colors } = useTheme();

  const recentDays = getAllUserReadingDays(deadlines);

  if (recentDays.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          Pages Read Per Day
        </ThemedText>
        <ThemedView style={styles.emptyState}>
          <ThemedText
            style={[styles.emptyStateText, { color: colors.textMuted }]}
          >
            No activity recorded
          </ThemedText>
          <ThemedText
            style={[styles.emptyStateSubtext, { color: colors.textMuted }]}
          >
            Start reading to see your daily progress
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const chartData = recentDays.map((day, index) => ({
    value: Math.round(day.progressRead),
    label: index % 2 === 0 ? parseServerDateOnly(day.date).format('M/DD') : '',
    dataPointText: String(Math.round(day.progressRead)),
    date: parseServerDateOnly(day.date).format('M/DD'),
  }));

  const maxValue = Math.max(...chartData.map(d => d.value), 10);
  const yAxisMax = Math.ceil(maxValue * 1.2);

  return (
    <ThemedView style={styles.container}>
      <ThemedText
        variant="title"
        style={[styles.title, { color: colors.text }]}
      >
        Pages Read Per Day
      </ThemedText>
      <View style={styles.chartContainer} testID="user-reading-line-chart">
        <LineChart
          data={chartData}
          width={320}
          height={180}
          adjustToWidth
          curved
          curveType={CurveType.QUADRATIC}
          initialSpacing={15}
          areaChart
          color={colors.primary}
          thickness={2}
          startFillColor={colors.darkPurple}
          endFillColor={colors.primary}
          startOpacity={0.4}
          endOpacity={0.1}
          xAxisThickness={2}
          yAxisThickness={2}
          xAxisColor={colors.border}
          yAxisColor={colors.border}
          yAxisTextStyle={{
            color: colors.textMuted,
            fontSize: 11,
          }}
          xAxisLabelTextStyle={{
            color: colors.textMuted,
            fontSize: 8,
            width: 30,
          }}
          noOfSections={5}
          maxValue={yAxisMax > 0 ? yAxisMax : 10}
          mostNegativeValue={0}
          yAxisLabelSuffix=" pg"
          yAxisLabelWidth={45}
          yAxisOffset={10}
          isAnimated
          animationDuration={1000}
          dataPointsColor={colors.primary}
          dataPointsRadius={5}
          dataPointsWidth={10}
          dataPointsHeight={10}
          textColor={colors.text}
          textFontSize={10}
          textShiftY={-8}
          textShiftX={-5}
          showVerticalLines
          verticalLinesColor={colors.border}
          hideDataPoints={false}
          focusEnabled
          showStripOnFocus
          showTextOnFocus
          stripColor={colors.primary}
          stripOpacity={0.3}
          stripWidth={2}
          pointerConfig={{
            pointerStripHeight: 200,
            pointerStripColor: colors.textMuted,
            pointerStripWidth: 1,
            strokeDashArray: [4, 4],
            pointerColor: colors.primary,
            radius: 6,
            pointerLabelWidth: 100,
            pointerLabelHeight: 90,
            // activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => {
              const item = items[0];
              return (
                <ThemedView
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <ThemedText
                    style={{
                      color: colors.text,
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}
                  >
                    {item.dataPointText} pages
                  </ThemedText>
                  <ThemedText
                    style={{
                      color: colors.textMuted,
                      fontSize: 10,
                      marginTop: 2,
                    }}
                  >
                    {item.date}
                  </ThemedText>
                </ThemedView>
              );
            },
          }}
        />
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    borderRadius: 12,
    width: '100%',
    transform: [{ translateX: -10 }],
  },
  title: {
    fontWeight: '600',
    marginBottom: 16,
    paddingLeft: 10,
  },
  chartContainer: {
    paddingBottom: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default UserReadingLineChart;
