/**
 * statWidgetState.js
 * @version 1.0.0
 *
 * State for the stat widget type.
 * Displays a single metric — a big number with a label,
 * optional sub-label, optional trend indicator, and optional breakdown.
 *
 * Target path: src/shared/components/widget/widgets/stat/statWidgetState.js
 */

//#region Constants

/**
 * Trend direction for the stat value.
 */
export const STAT_TREND = {
  UP:      'up',
  DOWN:    'down',
  NEUTRAL: 'neutral',
};

//#endregion

//#region Factory

/**
 * Creates a fresh stat widget data object.
 * Passed as `data` in the widget definition.
 *
 * @param {object} options
 * @returns {object}
 */
export function createStatData(options = {}) {
  return {

    /**
     * The primary metric value displayed large.
     * @type {string | number}
     */
    value: options.value ?? '—',

    /**
     * Optional secondary line below the value.
     * @type {string | null}
     */
    sub: options.sub ?? null,

    /**
     * Optional trend direction.
     * @type {string | null}
     */
    trend: options.trend ?? null,

    /**
     * Optional trend label (e.g. "+2 this week").
     * @type {string | null}
     */
    trendLabel: options.trendLabel ?? null,

    /**
     * Optional breakdown items shown below the value.
     * Each entry: { label: string, value: string | number }
     * @type {object[]}
     */
    breakdown: options.breakdown ?? [],

  };
}

//#endregion