/**
 * widgetState.js
 * @version 1.0.0
 *
 * State for the base widget shell component.
 * Tracks chrome-level state — title, loading, error, action.
 * Content state belongs to the individual widget type.
 *
 * Target path: src/shared/components/widget/widgetState.js
 */

//#region Constants

/**
 * Widget variant — controls the accent color on the top border.
 */
export const WIDGET_VARIANT = {
  DEFAULT: 'default',
  GOLD:    'gold',
  PASS:    'pass',
  ALERT:   'alert',
  INFO:    'info',
};

//#endregion

//#region Factory

/**
 * Creates a fresh widget state object.
 * Each widget instance owns its own state — no shared singleton.
 *
 * @param {object} options
 * @returns {object}
 */
export function createWidgetState(options = {}) {
  return {
    /**
     * Widget title shown in the chrome header.
     * @type {string}
     */
    title: options.title ?? '',

    /**
     * Optional eyebrow label above the title.
     * @type {string | null}
     */
    eyebrow: options.eyebrow ?? null,

    /**
     * Visual variant — controls accent color.
     * @type {string}
     */
    variant: options.variant ?? WIDGET_VARIANT.DEFAULT,

    /**
     * Whether the widget is in a loading state.
     * Shows a spinner overlay when true.
     * @type {boolean}
     */
    isLoading: options.isLoading ?? false,

    /**
     * Error message to display in the widget.
     * Null if no error is active.
     * @type {string | null}
     */
    error: options.error ?? null,

    /**
     * Optional action button label.
     * If set, an action button is rendered in the widget header.
     * @type {string | null}
     */
    actionLabel: options.actionLabel ?? null,

    /**
     * Callback fired when the action button is clicked.
     * @type {Function | null}
     */
    onAction: options.onAction ?? null,
  };
}

//#endregion