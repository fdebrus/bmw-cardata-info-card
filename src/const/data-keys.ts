import { localize } from '../localize/localize';
import { CardTypeConfig } from '../types/card-types';
const createShowOpts = (nameKey: string, lang: string, configKey: string) => ({
  label: localize(nameKey, lang),
  configKey,
});

export const editorShowOpts = (lang: string) => [
  createShowOpts('editor.showOpts.show_slides', lang, 'show_slides'),
  createShowOpts('editor.showOpts.show_buttons', lang, 'show_buttons'),
  createShowOpts('editor.showOpts.show_map', lang, 'show_map'),
  createShowOpts('editor.showOpts.show_header_info', lang, 'show_header_info'),
  createShowOpts('editor.showOpts.show_background', lang, 'show_background'),
  createShowOpts('editor.showOpts.enable_map_popup', lang, 'enable_map_popup'),
  createShowOpts('editor.showOpts.show_address', lang, 'show_address'),
  createShowOpts('editor.showOpts.show_error_notify', lang, 'show_error_notify'),
];

const createCard = (key: string, icon: string, config: string, button: string, lang: string): CardTypeConfig => ({
  type: key,
  name: localize(`card.cardType.${key}`, lang),
  icon,
  config,
  button,
});

export const cardTypes = (lang: string) => [
  createCard('tripCards', 'mdi:map-marker-path', 'trip_card', 'trip_button', lang),
  createCard('vehicleCards', 'mdi:car-info', 'vehicle_card', 'vehicle_button', lang),
  createCard('tyreCards', 'mdi:tire', 'tyre_card', 'tyre_button', lang),
];

export type CardItem = {
  key: string;
  name: string;
  icon?: string;
};

const createItem = (key: string, nameKey: string, lang: string, icon?: string): CardItem => ({
  key,
  name: localize(`card.${nameKey}`, lang),
  ...(icon ? { icon } : {}),
});

const tripOverview = (lang: string) => [
  createItem('odometer', 'tripCard.odometer', lang, 'mdi:counter'),
  createItem('fuelLevel', 'tripCard.fuelLevel', lang),
  createItem('rangeElectric', 'tripCard.rangeElectric', lang),
  createItem('soc', 'tripCard.soc', lang),
  createItem('maxSoc', 'tripCard.maxSoc', lang),
];

const tripFromReset = (): CardItem[] => [];

const tripFromStart = (): CardItem[] => [];

const vehicleOverview = (lang: string): CardItem[] => [
  createItem('lockSensor', 'vehicleCard.lockSensor', lang),
  createItem('windowsClosed', 'vehicleCard.windowsClosed', lang),
  createItem('doorStatusOverall', 'vehicleCard.doorStatusOverall', lang, 'mdi:car-door-lock'),
  createItem('sunroofStatus', 'vehicleCard.sunroofStatus', lang),
];

const vehicleWarnings = (): CardItem[] => [];

const ecoScores = (): CardItem[] => [];

const tyrePressures = (lang: string): CardItem[] => [
  createItem('tirePressureFrontLeft', 'tyreCard.tirePressureFrontLeft', lang, 'mdi:tire'),
  createItem('tirePressureFrontRight', 'tyreCard.tirePressureFrontRight', lang, 'mdi:tire'),
  createItem('tirePressureRearLeft', 'tyreCard.tirePressureRearLeft', lang, 'mdi:tire'),
  createItem('tirePressureRearRight', 'tyreCard.tirePressureRearRight', lang, 'mdi:tire'),
];

const chargingOverview = (lang: string): CardItem[] => [
  createItem('chargingPower', 'chargingOverview.chargingPower', lang, 'mdi:flash'),
  createItem('soc', 'chargingOverview.soc', lang),
  createItem('maxSoc', 'chargingOverview.maxSoc', lang),
  createItem('selectedProgram', 'chargingOverview.selectedProgram', lang, 'mdi:ev-station'),
];

const precondSeats = (lang: string): CardItem[] => [
  createItem('precondSeatFrontLeft', 'precondSeatTemp.frontLeft', lang),
  createItem('precondSeatFrontRight', 'precondSeatTemp.frontRight', lang),
  createItem('precondSeatRearLeft', 'precondSeatTemp.rearLeft', lang),
  createItem('precondSeatRearRight', 'precondSeatTemp.rearRight', lang),
];

const precondTemps = (lang: string): CardItem[] => [
  createItem('temperature_points_frontLeft', 'precondSeatTemp.frontLeft', lang),
  createItem('temperature_points_frontRight', 'precondSeatTemp.frontRight', lang),
  createItem('temperature_points_rearLeft', 'precondSeatTemp.rearLeft', lang),
  createItem('temperature_points_rearRight', 'precondSeatTemp.rearRight', lang),
];

export const baseDataKeys = (lang: string) => ({
  tripOverview: tripOverview(lang),
  tripFromReset: tripFromReset(),
  tripFromStart: tripFromStart(),
  vehicleOverview: vehicleOverview(lang),
  vehicleWarnings: vehicleWarnings(),
  ecoScores: ecoScores(),
  tyrePressures: tyrePressures(lang),
  chargingOverview: chargingOverview(lang),
  precondSeats: precondSeats(lang),
  precondTemps: precondTemps(lang),
});
