<a name="readme-top"></a>

[![hacs][hacs-default]][hacs-default-link] [![hacs][hacs-validate]][hacs-validate-link] ![last-commit] ![total-downloads] ![latest-downloads]

# WORK IN PROGRESS, NOT READY 

# BMW Cardata Info Card

BMW Cardata Info Card is a Home Assistant Lovelace card for presenting read-only telemetry from the [BMW Cardata integration](https://github.com/bimmerconnected/bmw-cardata). The card focuses on surfacing battery status, tire pressures, range estimates, and other key sensors in an attractive dashboard without exposing remote control actions. Each area of the UI can be customized or swapped out for your own Lovelace cards.

## Features

- **Complete vehicle snapshot** with battery/charging, range, climate, security, and tire information in a single view.
- **Vehicle position map** with optional history traces and configurable providers.
- **Image slideshow** that cycles through your own vehicle photos.
- **Sensor-only focus** that keeps the integration read-only for peace of mind.
- **Highly configurable layout** where individual buttons and sub-cards can be replaced or reordered.
- **Localization** with translations for many languages.

## Prerequisites

- Home Assistant 2024.8 or newer.
- The [BMW Cardata integration](https://github.com/bimmerconnected/bmw-cardata) installed and providing the vehicle entities referenced below.

## Installation

### HACS (recommended)
1. In Home Assistant, add a custom repository pointing to `fdebrus/bmw-cardata-info-card` and select the **Plugin** category.
2. Install **BMW Cardata Info Card** from HACS.
3. Reload the browser cache (CTRL/⌘+SHIFT+R) after installation.

### Manual
1. Download the latest `bmw-cardata-info-card.js` from the [releases page](https://github.com/fdebrus/bmw-cardata-info-card/releases/latest).
2. Copy the file into your `/config/www/` directory.
3. Reference the script from your Lovelace resources:
   ```yaml
   url: /local/bmw-cardata-info-card.js
   type: module
   ```

## Basic configuration

Add the card to a dashboard using YAML mode or the card editor. The example below assumes your entities come from the BMW Cardata integration.

```yaml
- type: custom:bmw-cardata-info-card
  entity: sensor.my_bmw_vehicle_status
  name: My BMW i4
  image_list:
    - url: /local/bmw/front.png
    - url: /local/bmw/interior.png
  map:
    enabled: true
    provider: maptiler
  eco:
    enabled: true
  buttons:
    - type: custom:tile
      entity: lock.my_bmw
    - type: custom:tile
      entity: binary_sensor.my_bmw_windows
```

### Key options

| Field | Type | Description |
| --- | --- | --- |
| `type` | string | Must be `custom:bmw-cardata-info-card`. |
| `entity` | string | Vehicle status entity from BMW Cardata. |
| `name` | string | Optional override displayed in the header. |
| `image_list` | list | Paths to images used in the slideshow. |
| `map.enabled` | boolean | Show or hide the vehicle position map. |
| `buttons` | list | Custom buttons or Lovelace cards rendered in the action strip. |

## Entity discovery

The card auto-detects your vehicle prefix by scanning for BMW Cardata sensors in the format `sensor.<vehicle>_<suffix>`.
For an X3 xDrive30e the prefix would be `x3_xdrive30e`, so the card expects entities such as `sensor.x3_xdrive30e_range_ev_remaining_range`.
The following suffixes are used to populate the built-in UI sections:

| Card field | Required suffix |
| --- | --- |
| Fuel level | `range_tank_level` |
| Fuel/combined range | `range_total_range_last_sent` |
| EV range | `range_ev_remaining_range` |
| State of charge | `battery_hv_state_of_charge` |
| Target state of charge | `state_of_charge_predicted_on_integration_side` |
| Odometer | `vehicle_mileage` |
| Sunroof status | `sunroof_overall_state` |
| Door/lock summary | `doors_overall_state` |
| Tire pressures | `tire_pressure_front_left`, `tire_pressure_front_right`, `tire_pressure_rear_left`, `tire_pressure_rear_right` |
| Charging power | `predicted_charge_speed` |
| Charging voltage/current | `charging_ev_ac_charging_voltage`, `charging_ev_ac_charging_current` |
| Charging program | `charging_ev_charging_preference` |
| Preconditioning state | `preconditioning_state` |
| Window states | `window_state_front_driver`, `window_state_front_passenger`, `window_state_rear_driver`, `window_state_rear_passenger` |

If you use a person tracker for the map popup, set `device_tracker` to your `person.*` entity (e.g., `person.bmw`).
The default mapping aligns with the entities produced by the BMW Cardata integration, including the list above for an X3 xDrive30e.

## Localization support

<details>
  <summary>Supported languages</summary>

| Language Code | Name | Native Name |
| ------------- | ---------------------- | ---------------------- |
| `cs` | Czech | Čeština |
| `de` | German | Deutsch |
| `en` | English | English |
| `en_GB` | English | English (GB) |
| `es` | Spanish | Español |
| `fr` | French | Français |
| `it` | Italiano | Italian |
| `lt` | Lithuanian | Lietuvių |
| `nl` | Dutch | Nederlands |
| `pl` | Polish | Polski |
| `pt` | Portuguese | Português |
| `ru` | Russian | Русский |
| `sv` | Swedish | Svenska |
| `tr` | Turkish | Türkçe |
| `vi` | Vietnamese | Tiếng Việt |
| `zh_Hans` | Chinese | 简体中文 |
| `zh_Hant` | Chinese | 繁體中文 |

</details>

## Development

1. Install dependencies with `pnpm install`.
2. Run `pnpm start` for a development build with live reload, or `pnpm build` for a production bundle.
3. Localization helpers are available via `pnpm run import-lang` and `pnpm run update-lang`.

## Contributing

Issues and pull requests are welcome. Please keep changes focused on enhancing the BMW Cardata experience and note that the project surfaces sensor data only.

## License

MIT © 2024 Frederic Debrus.

[project-repo]: https://github.com/fdebrus/bmw-cardata-info-card
[hacs-default]: https://img.shields.io/badge/HACS-Default-41BDF5.svg
[hacs-default-link]: https://my.home-assistant.io/redirect/hacs_repository/?owner=fdebrus&repository=bmw-cardata-info-card&category=plugin
[hacs-validate]: https://github.com/fdebrus/bmw-cardata-info-card/actions/workflows/validate.yaml/badge.svg
[hacs-validate-link]: https://github.com/fdebrus/bmw-cardata-info-card/actions/workflows/validate.yaml
[last-commit]: https://img.shields.io/github/last-commit/fdebrus/bmw-cardata-info-card
[total-downloads]: https://img.shields.io/github/downloads/fdebrus/bmw-cardata-info-card/total?style=flat&logo=homeassistantcommunitystore&logoSize=auto&label=Downloads&color=%2318BCF2
[latest-downloads]: https://img.shields.io/github/downloads/fdebrus/bmw-cardata-info-card/latest/total?style=flat&logo=homeassistantcommunitystore&logoSize=auto
