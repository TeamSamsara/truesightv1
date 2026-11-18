/**
 * availabilityIndex.js — availability component
 * @version 1.0.0
 *
 * Public API for the shared availability input component.
 * This is the only file consuming features should import from.
 *
 * The availability component is a time-based input engine —
 * it handles all slot management, date selection, and validation.
 * It never writes to Firestore — it fires onSave with a complete
 * AvailabilityEntry for the consuming feature to persist.
 *
 * Usage:
 *   import { Availability, AVAILABILITY_MODE } from '../../shared/components/time/availability/availabilityIndex.js';
 *
 *   // Mount inside modal body
 *   Modal.open({ title: 'ADD AVAILABILITY', size: MODAL_SIZE.LG });
 *   const body = Modal.getBody();
 *
 *   Availability.init(body, {
 *     mode:          AVAILABILITY_MODE.SINGLE,
 *     existingEntry: entry,  // optional — pre-fills for edit
 *     deadline:      request.deadline,
 *     readOnly:      false,
 *   });
 *
 *   Availability.onSave(entry => {
 *     // write entry to Firestore
 *     Modal.close();
 *   });
 *
 *   Availability.onCancel(() => Modal.close());
 *
 *   Availability.onChangeRequest(entry => {
 *     // write change request to Firestore
 *     Modal.close();
 *   });
 *
 *   Availability.destroy(); // called automatically on Modal.close()
 *
 * Target path: src/shared/components/time/availability/availabilityIndex.js
 */

//#region Imports

import {
  init,
  destroy,
  onSave,
  onCancel,
  onChangeRequest,
}                          from './availabilityController.js';

import { AVAILABILITY_MODE } from '../../../data/availabilityModel.js';

//#endregion

//#region Public API

export const Availability = {
  init,
  destroy,
  onSave,
  onCancel,
  onChangeRequest,
};

//#endregion

//#region Re-exports — Constants

export { AVAILABILITY_MODE };

//#endregion