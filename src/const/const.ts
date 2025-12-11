import { version, repository } from '../../package.json';

export const CARD_VERSION = `v${version}`;
export const CARD_UPADE_SENSOR = 'update.vehicle_info_card_update';
export const REPOSITORY = repository.repo;

export const EXTRA_MAP_CARD_URL = 'https://cdn.jsdelivr.net/npm/extra-map-card/dist/extra-map-card-bundle.min.js';

export const PREVIEW_CONFIG_TYPES = ['btn_preview', 'card_preview', 'tire_preview'];

/**
 * Filters for binary sensors.
 */
type EntityFilter = {
  prefix?: string;
  suffix: string;
  aliases?: string[];
};

const binarySensorsFilters: Record<string, EntityFilter> = {
  lock: { prefix: 'lock', suffix: '_lock' },
  parkBrake: { suffix: '_parkbrakestatus' },
  liquidRangeCritical: { suffix: '_liquidrangecritical' },
  lowBrakeFluid: { suffix: '_warningbrakefluid' },
  lowWashWater: { suffix: '_warningwashwater' },
  lowCoolantLevel: { suffix: '_warningcoolantlevellow' },
  windowsClosed: { suffix: '_windowstatusoverall' },
  tirePressureWarning: { suffix: '_tirewarninglamp' },
  remoteStartActive: { suffix: '_remotestartactive' },
  engineState: { suffix: '_enginestate' },
  chargeFlapACStatus: { suffix: '_chargeflapacstatus' },
};

/**
 * Filters for sensor devices.
 */
const sensorDeviceFilters: Record<string, EntityFilter> = {
  adBlueLevel: { suffix: '_tankleveladblue' },
  averageSpeedReset: { suffix: '_averagespeedreset' },
  averageSpeedStart: { suffix: '_averagespeedstart' },
  chargeFlapDCStatus: { suffix: '_chargeflapdcstatus' },
  chargingPower: { suffix: '_chargingpowerkw' },
  distanceReset: { suffix: '_distancereset' },
  distanceStart: { suffix: '_distancestart' },
  distanceZEReset: { suffix: '_distancezereset' },
  distanceZEStart: { suffix: '_distancezestart' },
  ecoScoreAcceleration: { suffix: '_ecoscoreaccel' },
  ecoScoreBonusRange: { suffix: '_ecoscorebonusrange' },
  ecoScoreConstant: { suffix: '_ecoscoreconst' },
  ecoScoreFreeWheel: { suffix: '_ecoscorefreewhl' },
  ecoScoreTotal: { suffix: '_ecoscoretotal' },
  electricConsumptionReset: { suffix: '_electricconsumptionreset' },
  electricConsumptionStart: { suffix: '_electricconsumptionstart' },
  fuelLevel: { suffix: '_tanklevelpercent', aliases: ['_range_tank_level', '_range_tank_level_2'] },
  ignitionState: { suffix: '_ignitionstate' },
  liquidConsumptionReset: { suffix: '_liquidconsumptionreset' },
  liquidConsumptionStart: { suffix: '_liquidconsumptionstart' },
  lockSensor: { prefix: 'sensor.', suffix: '_lock' },
  maxSoc: { prefix: 'sensor.', suffix: '_max_state_of_charge', aliases: ['_state_of_charge_predicted_on_integration_side'] },
  odometer: { suffix: '_odometer', aliases: ['_vehicle_mileage', '_mileage'] },
  precondStatus: { suffix: '_preclimatestatus' },
  rangeElectric: {
    suffix: '_rangeelectrickm',
    aliases: ['_remaining_range_electric', '_electric_range', '_range_ev_remaining_range'],
  },
  rangeLiquid: {
    suffix: '_rangeliquid',
    aliases: ['_remaining_range_fuel', '_remaining_range_total', '_range_total_range_last_sent'],
  },
  soc: {
    prefix: 'sensor.',
    suffix: 'soc',
    aliases: ['_charging_level_hv', '_battery_charge_level', '_battery_hv_state_of_charge'],
  },
  starterBatteryState: { suffix: '_starterbatterystate' },
  sunroofStatus: { suffix: '_sunroofstatus' },
  tirePressureFrontLeft: { suffix: '_tirepressurefrontleft', aliases: ['_tire_pressure_front_left'] },
  tirePressureFrontRight: { suffix: '_tirepressurefrontright', aliases: ['_tire_pressure_front_right'] },
  tirePressureRearLeft: { suffix: '_tirepressurerearleft', aliases: ['_tire_pressure_rear_left'] },
  tirePressureRearRight: { suffix: '_tirepressurerearright', aliases: ['_tire_pressure_rear_right'] },
  doorStatusOverall: { suffix: '_doorstatusoverall', aliases: ['_doors_overall_state'] },
};

export const combinedFilters = { ...binarySensorsFilters, ...sensorDeviceFilters };
