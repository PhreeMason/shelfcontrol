import { ThemedText } from '@/components/themed';
import {
  CHART_ANIMATION,
  CHART_CONFIG,
  CHART_STYLING,
  LEGEND_CONFIG,
} from '@/constants/ChartConfig';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { CurveType, LineChart, lineDataItem } from 'react-native-gifted-charts';

/**
 * Theme colors used for chart rendering
 *
 * @property {string} text - Main text color for labels and titles
 * @property {string} textMuted - Muted text color for secondary information
 * @property {string} border - Border color for axes and dividers
 *
 * @example
 * const chartColors: ChartColors = {
 *   text: '#000000',
 *   textMuted: '#666666',
 *   border: '#CCCCCC'
 * };
 */
export interface ChartColors {
  text: string;
  textMuted: string;
  border: string;
}

/**
 * Props for the LineChartSection component
 *
 * @property {string} title - Chart section title displayed above the chart
 * @property {lineDataItem[]} actualData - Array of actual data points for the primary line
 * @property {lineDataItem[]} targetData - Array of target data points for the secondary line
 * @property {string} actualLabel - Label for the actual data line in the legend
 * @property {string} targetLabel - Label for the target data line in the legend
 * @property {string} actualColor - Color for the actual data line and area fill
 * @property {string} targetColor - Color for the target data line and area fill
 * @property {boolean} showActual - Whether to display the actual data line
 * @property {boolean} showTarget - Whether to display the target data line
 * @property {function} onToggleActual - Callback when actual line toggle is pressed
 * @property {function} onToggleTarget - Callback when target line toggle is pressed
 * @property {number} yAxisMax - Maximum value for the Y-axis
 * @property {ChartColors} colors - Theme colors for chart rendering
 *
 * @example
 * <LineChartSection
 *   title="Reading Progress"
 *   actualData={[{ value: 25, label: '1/1' }]}
 *   targetData={[{ value: 30, label: '1/1' }]}
 *   actualLabel="Actual Pages"
 *   targetLabel="Target Pages"
 *   actualColor="#4A90E2"
 *   targetColor="#F5A623"
 *   showActual={true}
 *   showTarget={true}
 *   onToggleActual={() => setShowActual(!showActual)}
 *   onToggleTarget={() => setShowTarget(!showTarget)}
 *   yAxisMax={50}
 *   colors={{ text: '#000', textMuted: '#666', border: '#CCC' }}
 * />
 */
export interface LineChartSectionProps {
  title: string;
  actualData: lineDataItem[];
  targetData: lineDataItem[];
  actualLabel: string;
  targetLabel: string;
  actualColor: string;
  targetColor: string;
  showActual: boolean;
  showTarget: boolean;
  onToggleActual: () => void;
  onToggleTarget: () => void;
  yAxisMax: number;
  colors: ChartColors;
}

/**
 * Reusable line chart section component with interactive legend
 *
 * Displays a dual-line area chart with toggleable actual vs target data.
 * Supports independent toggling of each line, with dynamic chart rendering
 * based on visibility state. Includes accessibility support for screen readers.
 *
 * Features:
 * - Interactive legend with toggle buttons
 * - Smooth quadratic curve interpolation
 * - Area fill with gradient opacity
 * - Accessible legend buttons with ARIA labels
 * - Responsive width adjustment
 * - Empty state when no lines are visible
 *
 * @param {LineChartSectionProps} props - Component props
 * @returns {JSX.Element} Rendered line chart section
 *
 * @example
 * // Basic usage with reading progress
 * <LineChartSection
 *   title="Reading Progress & Target"
 *   actualData={[{ value: 25, label: '1/1' }, { value: 30, label: '1/2' }]}
 *   targetData={[{ value: 30, label: '1/1' }, { value: 30, label: '1/2' }]}
 *   actualLabel="Actual Pages"
 *   targetLabel="Target Pages"
 *   actualColor="#4A90E2"
 *   targetColor="#F5A623"
 *   showActual={true}
 *   showTarget={true}
 *   onToggleActual={() => setShowActual(!showActual)}
 *   onToggleTarget={() => setShowTarget(!showTarget)}
 *   yAxisMax={50}
 *   colors={{ text: '#000', textMuted: '#666', border: '#CCC' }}
 * />
 */
export const LineChartSection: React.FC<LineChartSectionProps> = ({
  title,
  actualData,
  targetData,
  actualLabel,
  targetLabel,
  actualColor,
  targetColor,
  showActual,
  showTarget,
  onToggleActual,
  onToggleTarget,
  yAxisMax,
  colors,
}) => {
  return (
    <View style={styles.chartSection}>
      <ThemedText variant='title' style={[styles.chartTitle, { color: colors.text }]}>
        {title}
      </ThemedText>

      {/* Interactive Legend */}
      <View style={styles.legendContainer}>
        <TouchableOpacity
          style={styles.legendItem}
          onPress={onToggleActual}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Toggle ${actualLabel} line`}
          accessibilityState={{ selected: showActual }}
          accessibilityHint={`${showActual ? 'Hide' : 'Show'} ${actualLabel} data on the chart`}
        >
          <View
            style={[
              styles.legendDot,
              { backgroundColor: actualColor },
              !showActual && styles.legendDotDisabled,
            ]}
          />
          <ThemedText
            style={[
              styles.legendText,
              { color: colors.textMuted },
              !showActual && styles.legendTextDisabled,
            ]}
          >
            {actualLabel}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.legendItem}
          onPress={onToggleTarget}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Toggle ${targetLabel} line`}
          accessibilityState={{ selected: showTarget }}
          accessibilityHint={`${showTarget ? 'Hide' : 'Show'} ${targetLabel} data on the chart`}
        >
          <View
            style={[
              styles.legendDot,
              { backgroundColor: targetColor },
              !showTarget && styles.legendDotDisabled,
            ]}
          />
          <ThemedText
            style={[
              styles.legendText,
              { color: colors.textMuted },
              !showTarget && styles.legendTextDisabled,
            ]}
          >
            {targetLabel}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Render different chart configurations based on toggle state */}
      {showActual && showTarget ? (
        // Both lines visible - combination chart
        <LineChart
          data={actualData}
          data2={targetData}
          color={actualColor}
          color2={targetColor}
          thickness={CHART_STYLING.ACTUAL_LINE_THICKNESS}
          thickness2={CHART_STYLING.TARGET_LINE_THICKNESS}
          startFillColor={actualColor}
          endFillColor={actualColor}
          startFillColor2={targetColor}
          endFillColor2={targetColor}
          startOpacity={CHART_STYLING.ACTUAL_START_OPACITY}
          endOpacity={CHART_STYLING.ACTUAL_END_OPACITY}
          startOpacity2={CHART_STYLING.TARGET_START_OPACITY}
          endOpacity2={CHART_STYLING.TARGET_END_OPACITY}
          dataPointsColor={actualColor}
          dataPointsColor2={targetColor}
          dataPointsRadius={CHART_STYLING.ACTUAL_DATA_POINT_RADIUS}
          dataPointsRadius2={CHART_STYLING.TARGET_DATA_POINT_RADIUS}
          width={CHART_CONFIG.DEFAULT_WIDTH}
          height={CHART_CONFIG.DEFAULT_HEIGHT}
          adjustToWidth
          curved
          curveType={CurveType.QUADRATIC}
          initialSpacing={CHART_CONFIG.INITIAL_SPACING}
          areaChart
          xAxisThickness={CHART_STYLING.AXIS_THICKNESS}
          yAxisThickness={CHART_STYLING.AXIS_THICKNESS}
          xAxisColor={colors.border}
          yAxisColor={colors.border}
          xAxisLabelTextStyle={{
            color: colors.textMuted,
            fontSize: CHART_STYLING.X_AXIS_LABEL_FONT_SIZE,
            width: CHART_STYLING.X_AXIS_LABEL_WIDTH,
            textAlign: 'center',
          }}
          rotateLabel
          yAxisTextStyle={{ color: colors.textMuted, fontSize: CHART_STYLING.Y_AXIS_LABEL_FONT_SIZE }}
          noOfSections={CHART_STYLING.NUMBER_OF_SECTIONS}
          maxValue={yAxisMax}
          mostNegativeValue={0}
          yAxisLabelWidth={CHART_STYLING.Y_AXIS_LABEL_WIDTH}
          isAnimated={CHART_ANIMATION.ENABLED}
          animationDuration={CHART_ANIMATION.DURATION}
        />
      ) : showActual ? (
        // Only actual data visible - single line chart
        <LineChart
          data={actualData}
          color={actualColor}
          thickness={CHART_STYLING.ACTUAL_LINE_THICKNESS}
          startFillColor={actualColor}
          endFillColor={actualColor}
          startOpacity={CHART_STYLING.ACTUAL_START_OPACITY}
          endOpacity={CHART_STYLING.ACTUAL_END_OPACITY}
          dataPointsColor={actualColor}
          dataPointsRadius={CHART_STYLING.ACTUAL_DATA_POINT_RADIUS}
          width={CHART_CONFIG.DEFAULT_WIDTH}
          height={CHART_CONFIG.DEFAULT_HEIGHT}
          adjustToWidth
          curved
          curveType={CurveType.QUADRATIC}
          initialSpacing={CHART_CONFIG.INITIAL_SPACING}
          areaChart
          xAxisThickness={CHART_STYLING.AXIS_THICKNESS}
          yAxisThickness={CHART_STYLING.AXIS_THICKNESS}
          xAxisColor={colors.border}
          yAxisColor={colors.border}
          yAxisTextStyle={{ color: colors.textMuted, fontSize: CHART_STYLING.Y_AXIS_LABEL_FONT_SIZE }}
          xAxisLabelTextStyle={{
            color: colors.textMuted,
            fontSize: CHART_STYLING.X_AXIS_LABEL_FONT_SIZE,
            width: CHART_STYLING.X_AXIS_LABEL_WIDTH,
            textAlign: 'center',
          }}
          rotateLabel
          noOfSections={CHART_STYLING.NUMBER_OF_SECTIONS}
          maxValue={yAxisMax}
          mostNegativeValue={0}
          yAxisLabelWidth={CHART_STYLING.Y_AXIS_LABEL_WIDTH}
          isAnimated={CHART_ANIMATION.ENABLED}
          animationDuration={CHART_ANIMATION.DURATION}
        />
      ) : showTarget ? (
        // Only target data visible - single line chart
        <LineChart
          data={targetData}
          color={targetColor}
          thickness={CHART_STYLING.TARGET_LINE_THICKNESS}
          startFillColor={targetColor}
          endFillColor={targetColor}
          startOpacity={CHART_STYLING.TARGET_START_OPACITY}
          endOpacity={CHART_STYLING.TARGET_END_OPACITY}
          dataPointsColor={targetColor}
          dataPointsRadius={CHART_STYLING.TARGET_DATA_POINT_RADIUS}
          width={CHART_CONFIG.DEFAULT_WIDTH}
          height={CHART_CONFIG.DEFAULT_HEIGHT}
          adjustToWidth
          curved
          curveType={CurveType.QUADRATIC}
          initialSpacing={CHART_CONFIG.INITIAL_SPACING}
          areaChart
          xAxisThickness={CHART_STYLING.AXIS_THICKNESS}
          yAxisThickness={CHART_STYLING.AXIS_THICKNESS}
          xAxisColor={colors.border}
          yAxisColor={colors.border}
          yAxisTextStyle={{ color: colors.textMuted, fontSize: CHART_STYLING.Y_AXIS_LABEL_FONT_SIZE }}
          xAxisLabelTextStyle={{
            color: colors.textMuted,
            fontSize: CHART_STYLING.X_AXIS_LABEL_FONT_SIZE,
            width: CHART_STYLING.X_AXIS_LABEL_WIDTH,
            textAlign: 'center',
          }}
          rotateLabel
          noOfSections={CHART_STYLING.NUMBER_OF_SECTIONS}
          maxValue={yAxisMax}
          mostNegativeValue={0}
          yAxisLabelWidth={CHART_STYLING.Y_AXIS_LABEL_WIDTH}
          isAnimated={CHART_ANIMATION.ENABLED}
          animationDuration={CHART_ANIMATION.DURATION}
        />
      ) : (
        // Neither visible - empty state
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ThemedText style={[{ color: colors.textMuted, fontSize: 14 }]}>
            Toggle a line to view data
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chartSection: {
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  chartTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: LEGEND_CONFIG.ITEM_GAP,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LEGEND_CONFIG.DOT_TEXT_GAP,
  },
  legendDot: {
    width: LEGEND_CONFIG.DOT_SIZE,
    height: LEGEND_CONFIG.DOT_SIZE,
    borderRadius: LEGEND_CONFIG.DOT_BORDER_RADIUS,
  },
  legendText: {
    fontSize: LEGEND_CONFIG.FONT_SIZE,
  },
  legendDotDisabled: {
    opacity: LEGEND_CONFIG.DISABLED_OPACITY,
  },
  legendTextDisabled: {
    opacity: LEGEND_CONFIG.DISABLED_TEXT_OPACITY,
    textDecorationLine: 'line-through',
  },
});
