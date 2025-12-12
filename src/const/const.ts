import { version, repository } from '../../package.json';

export const CARD_VERSION = `v${version}`;
export const CARD_UPADE_SENSOR = 'update.vehicle_info_card_update';
export const REPOSITORY = repository.repo;

export const EXTRA_MAP_CARD_URL = 'https://cdn.jsdelivr.net/npm/extra-map-card/dist/extra-map-card-bundle.min.js';

export const PREVIEW_CONFIG_TYPES = ['btn_preview', 'card_preview', 'tire_preview'];

export const CARDATA_ENTITY_MAP: Record<string, string> = {
  doorStatusOverall: 'doors_overall_state',
  fuelLevel: 'range_tank_level',
  rangeLiquid: 'range_total_range_last_sent',
  rangeElectric: 'range_ev_remaining_range',
  soc: 'battery_hv_state_of_charge',
  maxSoc: 'state_of_charge_predicted_on_integration_side',
  odometer: 'vehicle_mileage',
  sunroofStatus: 'sunroof_overall_state',
  tirePressureFrontLeft: 'tire_pressure_front_left',
  tirePressureFrontRight: 'tire_pressure_front_right',
  tirePressureRearLeft: 'tire_pressure_rear_left',
  tirePressureRearRight: 'tire_pressure_rear_right',
  precondStatus: 'preconditioning_state',
  chargingPower: 'predicted_charge_speed',
  chargingVoltage: 'charging_ev_ac_charging_voltage',
  chargingCurrent: 'charging_ev_ac_charging_current',
  selectedProgram: 'charging_ev_charging_preference',
};

export const CARDATA_WINDOW_SUFFIXES = [
  'window_state_front_driver',
  'window_state_front_passenger',
  'window_state_rear_driver',
  'window_state_rear_passenger',
];
