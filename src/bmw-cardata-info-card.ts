import { mdiChevronLeft, mdiChevronRight, mdiClose } from '@mdi/js';
import { formatDateTime, forwardHaptic, hasConfigOrEntityChanged } from 'custom-card-helpers';
import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

import './components';

import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EcoChart, VehicleButtons, VehicleMap } from './components/';
import { CardItem, cardTypes } from './const/data-keys';
import { IMAGE } from './const/imgconst';
import * as StateMapping from './const/state-mapping';
import styles from './css/styles.css';
import { localize } from './localize/localize';
import {
  HomeAssistant,
  VehicleCardConfig,
  EntityConfig,
  VehicleEntity,
  ButtonCardEntity,
  CardTypeConfig,
  CustomButtonEntity,
  defaultConfig,
  BaseButtonConfig,
  VehicleEntities,
  ecoChartModel,
  SECTION_DEFAULT_ORDER,
} from './types';
import { HEADER_ACTION, PreviewCard, MapData, SECTION } from './types';
import { FrontendLocaleData } from './types/ha-frontend/data/frontend-local-data';
import { fireEvent } from './types/ha-frontend/fire-event';
import { LovelaceCardEditor, LovelaceCardConfig, LovelaceCard } from './types/ha-frontend/lovelace/lovelace';
import {
  handleCardFirstUpdated,
  getCarEntity,
  handleCardSwipe,
  isEmpty,
  Create,
  isDarkColor,
  _getSingleCard,
  applyThemesOnElement,
  loadAndCleanExtraMap,
} from './utils';
import { getAddedButton, getDefaultButton, createCardElement, createCustomButtons } from './utils';

const ROWPX = 58;

@customElement('bmw-cardata-info-card')
export class VehicleCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement('bmw-cardata-info-card-editor');
  }
  // Properties
  @property({ attribute: false })
  set hass(hass: HomeAssistant) {
    if (!hass) return;
    this._hass = hass;

    if (this._buttonReady && this.buttonCards) {
      Object.keys(this.buttonCards).forEach((key) => {
        const customCard = this.buttonCards[key].custom_card;
        const useCustom = this.buttonCards[key].card_type === 'custom';
        if (useCustom && !isEmpty(customCard)) {
          customCard.forEach((card) => {
            card.hass = hass;
          });
        }
      });
    }
  }

  @property({ attribute: false }) public _hass!: HomeAssistant;
  @property({ attribute: false }) public config!: VehicleCardConfig;
  @property({ type: Boolean }) public editMode: boolean = false;
  @property({ attribute: false }) public layout?: string;

  // Vehicle entities and attributes
  @state() vehicleEntities: VehicleEntities = {};
  @state() public buttonCards: Record<string, ButtonCardEntity> = {};
  @state() public _entityNotFound: boolean = false;

  @state() DataKeys: Record<string, CardItem[]> = {};
  @state() MapData?: MapData;
  @state() PreviewCard: PreviewCard = {};
  // Active card type
  @state() public _currentCardType: string | null = null;
  @state() private _activeSubCard: Set<string> = new Set();
  @state() private chargingInfoVisible!: boolean;

  // Single Map Card
  @state() public _singleMapCard?: LovelaceCardConfig;
  // Preview states
  @state() _currentPreviewType: 'button' | 'card' | 'tire' | null = null;

  // Loading state
  @state() public _loading = true;
  @state() private _buttonReady = false;
  @state() _currentSwipeIndex?: number;
  // Resize observer
  @state() _connected = false;

  // Misc
  @state() windowEntities: string[] = [];
  @state() mainSectionItems: Record<string, HTMLElement> = {};
  @state() _cardPreviewId?: string;
  @state() _cardId?: string | null;
  private _calculateCardHeight?: number;
  // Components
  @query('vehicle-buttons') vehicleButtons!: VehicleButtons;
  @query('vehicle-map') vehicleMap!: VehicleMap;
  @query('eco-chart') ecoChart!: EcoChart;
  @query('extra-map-card') _extraMapCard?: any;

  connectedCallback(): void {
    super.connectedCallback();
    window.BenzCard = this;

    if (this.editMode) {
      this._loading = false;
      if (this.isEditorPreview) {
        window.addEventListener('editor-event', this.handleEditorEvents.bind(this));
      }
    }
    this._connected = true;
  }

  disconnectedCallback(): void {
    window.removeEventListener('editor-event', this.handleEditorEvents.bind(this));
    this._connected = false;

    super.disconnectedCallback();
  }

  public static getStubConfig = (hass: HomeAssistant): Record<string, unknown> => {
    const entity = getCarEntity(hass);
    console.log('entity', entity);
    return {
      ...defaultConfig,
      entity: entity,
      images: [],
    };
  };

  public setConfig(config: VehicleCardConfig): void {
    this.config = {
      ...defaultConfig,
      ...config,
      map_popup_config: {
        ...defaultConfig.map_popup_config,
        ...config.map_popup_config,
      },
      selected_theme: {
        ...defaultConfig.selected_theme,
        ...config.selected_theme,
      },
      extra_configs: {
        ...defaultConfig.extra_configs,
        ...config.extra_configs,
        tire_card_custom: {
          ...defaultConfig.extra_configs.tire_card_custom,
          ...config.extra_configs?.tire_card_custom,
        },
        images_swipe: {
          ...defaultConfig.extra_configs.images_swipe,
          ...config.extra_configs?.images_swipe,
        },
      },
      button_grid: {
        ...defaultConfig.button_grid,
        ...config.button_grid,
      },
      use_custom_cards: {
        ...defaultConfig.use_custom_cards,
        ...config.use_custom_cards,
      },
    };
  }

  get userLang(): string {
    if (!this.config.selected_language || this.config.selected_language === 'system') {
      return this._hass.language;
    }
    return this.config.selected_language;
  }

  private get baseCardTypes(): CardTypeConfig[] {
    return cardTypes(this.userLang);
  }

  private get isCharging(): boolean {
    const chargingActive = this.getEntityAttribute(this.vehicleEntities.rangeElectric?.entity_id, 'chargingactive');
    return Boolean(chargingActive);
  }

  get carVinNumber(): string {
    if (!this.config.entity) return '';
    return this.getEntityAttribute(this.config.entity, 'vin');
  }

  get isDark(): boolean {
    if (this.config?.selected_theme?.mode === 'dark') {
      return true;
    } else if (this.config?.selected_theme?.mode === 'light') {
      return false;
    }
    return this._hass.selectedTheme?.dark ?? this._isDarkTheme();
  }

  get _locale(): FrontendLocaleData {
    const locale = this._hass.locale;
    const language = this.userLang.includes('_') ? this.userLang.replace('_', '-') : this.userLang;
    const newLocale = {
      ...locale,
      language,
    };
    return newLocale;
  }

  get isEditorPreview(): boolean {
    const parentElementClassPreview = this.offsetParent?.classList.contains('element-preview');
    return parentElementClassPreview || false;
  }

  public static get styles(): CSSResultGroup {
    return styles;
  }

  protected async willUpdate(changedProps: PropertyValues): Promise<void> {
    super.willUpdate(changedProps);

    if (
      changedProps.has('config') &&
      this.config.map_popup_config?.single_map_card === true &&
      this.config?.device_tracker &&
      this.config.extra_configs?.maptiler_api_key
    ) {
      if (!this._singleMapCard) {
        this.createSingleMapCard();
      }
    }

    if (changedProps.has('config') && this.config.selected_theme) {
      const oldTheme = changedProps.get('config')?.selected_theme?.theme;
      const newTheme = this.config.selected_theme.theme;
      if (oldTheme !== newTheme) {
        this.applyTheme(newTheme);
      }
    }
  }

  protected async firstUpdated(changedProps: PropertyValues): Promise<void> {
    super.firstUpdated(changedProps);
    await new Promise((resolve) => setTimeout(resolve, 0));
    handleCardFirstUpdated(this);
    this._setUpButtonCards();
    this._setUpPreview();
  }

  protected async updated(changedProps: PropertyValues): Promise<void> {
    super.updated(changedProps);

    if (changedProps.has('_currentCardType') && this._currentCardType !== null && !this.editMode) {
      const cardElement = this.shadowRoot?.querySelector('.card-element');
      if (cardElement) {
        handleCardSwipe(cardElement, this.toggleCard.bind(this));
      }
    }
  }

  protected shouldUpdate(_changedProps: PropertyValues): boolean {
    if (_changedProps.has('_currentCardType') && this._currentCardType) {
      this._activeSubCard = new Set<string>();
    }

    return hasConfigOrEntityChanged(this, _changedProps, true);
  }

  private async _setUpButtonCards(): Promise<void> {
    if (this._currentPreviewType !== null) return;
    this._buttonReady = false;

    const logging: string[] = [];
    for (const baseCard of this.baseCardTypes) {
      this.buttonCards[baseCard.type] = await getDefaultButton(this._hass, this.config, baseCard);
      logging.push(baseCard.type);
      // this.buttonCards = buttonCards;
      // console.log('Button Cards ready:', logging);
    }

    if (this.config.added_cards && Object.keys(this.config.added_cards).length > 0) {
      for (const [key, card] of Object.entries(this.config.added_cards)) {
        if (card) {
          this.buttonCards[key] = await getAddedButton(this._hass, card, key);
        }
        logging.push(key);
      }
    }

    // console.log('%cButton ready: %O', 'color: #bada55', logging);
    this._buttonReady = true;
    this._calculateCardHeight = this.getGridRowSize() * ROWPX;
    // console.log('Card height calculated', this._calculateCardHeight);
    setTimeout(() => {
      this._loading = false;
    }, 2000);
  }

  private async _setUpPreview(): Promise<void> {
    if (!this._currentPreviewType && this.config?.card_preview) {
      this._currentPreviewType = 'card';
    } else if (!this._currentPreviewType && this.config?.btn_preview) {
      this._currentPreviewType = 'button';
    } else if (!this._currentPreviewType && this.config?.tire_preview) {
      this._currentPreviewType = 'tire';
    }

    if (this._currentPreviewType !== null) {
      await this._configurePreview(this._currentPreviewType);
    } else {
      this._currentPreviewType = null;
    }
  }

  private async _configurePreview(cardType: 'button' | 'card' | 'tire' | null): Promise<void> {
    if (!cardType && !this.isEditorPreview) return;

    let cardConfig: LovelaceCardConfig[] | BaseButtonConfig = [];
    let cardElement: any;

    switch (cardType) {
      case 'button':
        cardConfig = this.config?.btn_preview as BaseButtonConfig;
        if (!cardConfig) return;
        cardElement = await createCustomButtons(this._hass, cardConfig);
        if (!cardElement) return;
        this.PreviewCard!.buttonPreview = cardElement;
        break;
      case 'card':
        cardConfig = this.config?.card_preview as LovelaceCardConfig[];
        if (!cardConfig) return;
        cardElement = await createCardElement(this._hass, cardConfig);
        if (!cardElement) return;
        this.PreviewCard!.cardPreview = cardElement;
        break;
      case 'tire':
        this._currentPreviewType = 'tire';
        break;
      default:
        return;
    }

    if (cardType === null) {
      this._resetCardPreview(); // Reset preview
      return;
    }

    this._currentPreviewType = cardType;
    this.requestUpdate();
  }

  private _resetCardPreview(): void {
    this.PreviewCard = {} as PreviewCard;
    this._currentPreviewType = null;
    this.requestUpdate();
  }

  public localize = (string: string, search = '', replace = ''): string => {
    return localize(string, this.userLang, search, replace);
  };

  private createSingleMapCard() {
    setTimeout(async () => {
      this._singleMapCard = (await _getSingleCard(this)) as LovelaceCardConfig;
      setTimeout(() => {
        // check if the map card is loaded
        if (this._extraMapCard && this.layout === 'panel' && !this.isEditorPreview) {
          const root = this._extraMapCard!.shadowRoot.getElementById('root') as HTMLElement;
          root.style.paddingBottom = 'unset';
        }
      }, 0);
    }, 0);
  }

  /* -------------------------------------------------------------------------- */
  /* MAIN RENDER                                                                */
  /* -------------------------------------------------------------------------- */

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult {
    if (!this.config || !this._hass || !this.config.entity || this._entityNotFound) {
      return this._showWarning('No entity provided');
    }

    if (this._currentPreviewType !== null && this.isEditorPreview) {
      return this._renderCardPreview();
    }

    if (this.config.map_popup_config?.single_map_card === true && this._singleMapCard !== undefined) {
      return html`${this._singleMapCard}`;
    }

    const loadingEl = html`
      <div class="loading-image" style="height: ${this._calculateCardHeight}px">
        <img src="${IMAGE.logoLoading}" alt="Loading" />
      </div>
    `;

    const noHeader = this.config.name?.trim() === '' || this.config.name === undefined;
    const headerTitle = noHeader ? nothing : html`<header><h1>${this.config.name}</h1></header>`;

    const mainContent = html`${headerTitle}
    ${this._currentCardType !== null ? this._renderCustomCard() : this._renderMainCard()}`;

    return html`
      <ha-card style=${this._computeCardStyles()} class=${this._computeClasses()} ?no-header=${noHeader}>
        <div class="bg"></div>
        <div class="content">${this._loading ? loadingEl : mainContent}</div>
      </ha-card>
    `;
  }

  private _renderCardPreview(): TemplateResult {
    if (!this._currentPreviewType) return html``;
    const type = this._currentPreviewType;
    const typeMap = {
      button: Create.BtnPreview(this.PreviewCard!.buttonPreview as CustomButtonEntity, this._hass),
      card: html`<ha-card class="preview-card">${this.PreviewCard!.cardPreview}</ha-card>`,
      tire: this._renderDefaultTyreCard(),
    };

    return typeMap[type];
  }

  private _renderMainCard(): TemplateResult {
    const sectionToRender = this.config.extra_configs?.section_order ?? [...SECTION_DEFAULT_ORDER];
    // render by config order or default order
    // console.log('sectionToRender', sectionToRender);
    return html`
      <main id="main-wrapper">
        ${sectionToRender.map((section) => {
          switch (section) {
            case SECTION.HEADER_INFO:
              return this._renderHeaderInfo();
            case SECTION.IMAGES_SLIDER:
              return this._renderHeaderSlides();
            case SECTION.MINI_MAP:
              return this._renderMap();
            case SECTION.BUTTONS:
              return this._renderButtons();
            default:
              return '';
          }
        })}
      </main>
    `;
  }

  private _renderHeaderInfo(): TemplateResult {
    if (!this.config?.show_header_info && this.config?.show_header_info !== undefined) return html``;
    return html`
      <div id=${SECTION.HEADER_INFO} class="header-info-box">
        ${this._renderInfoBox()} ${this._renderChargingInfo()} ${this._renderRangeInfo()}
      </div>
    `;
  }

  private _renderInfoBox(): TemplateResult {
    const isCharging = this.isCharging;
    const justify = isCharging ? 'space-evenly' : 'center';

    const defaultIndicData = this.createDataArray([{ key: 'lockSensor' }, { key: 'parkBrake' }]);

    // Helper function to render items
    const renderItem = (icon: string, label: string, onClick: () => void, isActive: boolean = false) => html`
      <div class="item active-btn" @click=${onClick} ?active=${isActive}>
        <ha-icon icon=${icon}></ha-icon>
        <div class="added-item-arrow">
          <span>${label}</span>
          <div class="subcard-icon" ?active=${isActive}>
            <ha-icon icon="mdi:chevron-down"></ha-icon>
          </div>
        </div>
      </div>
    `;

    // Render default indicators
    const defaultIndicators = defaultIndicData.map(
      ({ state, icon, key }) => html`
        <div class="item active-btn" @click=${() => this.toggleMoreInfo(this.vehicleEntities[key]?.entity_id)}>
          <ha-icon .icon=${icon}></ha-icon>
          <span>${state}</span>
        </div>
      `
    );

    // Render added charging info if charging
    const addedChargingInfo = this.isCharging
      ? renderItem(
          'mdi:ev-station',
          this.localize('card.common.stateCharging'),
          () => (this.chargingInfoVisible = !this.chargingInfoVisible),
          this.chargingInfoVisible
        )
      : nothing;

    // BMW cardata is read-only; expose the services status strip (mirroring Mercedes) but disabled
    const readOnlyServices = html`
      <div class="item readonly" aria-label="${this.localize('card.common.titleServices')}">
        <ha-icon icon="mdi:cog-off-outline"></ha-icon>
        <div class="added-item-arrow">
          <span>${this.localize('card.common.titleServices')}</span>
          <div class="subcard-icon readonly">
            <span>${this.localize('card.common.stateLocked')}</span>
          </div>
        </div>
      </div>
    `;

    // Combine all parts and render
    return html`
      <div class="info-box" style=${`justify-content: ${justify}`}>
        ${defaultIndicators} ${addedChargingInfo} ${readOnlyServices}
      </div>
    `;
  }

  private _renderChargingInfo(): TemplateResult {
    if (!this.DataKeys.chargingOverview) return html``;
    const chargingOverview = this.DataKeys.chargingOverview;
    const chargingData = this.createDataArray(chargingOverview);
    const chargingClass = this.chargingInfoVisible ? 'info-box charge active' : 'info-box charge';

    return html`
      <div class=${chargingClass} .hidden=${this.isCharging}>
        ${chargingData.map(({ name, state, icon }) => {
          if (state) {
            return html`
              <div class="item charge">
                <div class="icon-state">
                  <ha-icon .icon=${icon}></ha-icon>
                  <span>${state}</span>
                </div>
                <div class="item-name">
                  <span>${name}</span>
                </div>
              </div>
            `;
          } else {
            return html``;
          }
        })}
      </div>
    `;
  }

  private _renderRangeInfo(): TemplateResult | void {
    if (this.chargingInfoVisible) return;
    const getEntityInfo = (entity: string | undefined) => {
      if (!entity) return null;
      const state = parseInt(this.getEntityState(entity));
      const stateDisplay = this.getStateDisplay(entity);
      return { state, stateDisplay };
    };

    const entities = ['fuelLevel', 'rangeLiquid', 'rangeElectric', 'soc'];
    const [fuelInfo, rangeLiquidInfo, rangeElectricInfo, socInfo] = entities.map((entity) =>
      getEntityInfo(this.vehicleEntities[entity]?.entity_id)
    );

    const renderInfoBox = (icon: string, state: number, fuelInfo: string, rangeInfo: string, eletric: boolean) => html`
      <div class="info-box range">
        <div class="item">
          <ha-icon icon="${icon}"></ha-icon>
          <div><span>${fuelInfo}</span></div>
        </div>
        <div class="fuel-wrapper">
          <div
            class="fuel-level-bar"
            ?electric=${eletric}
            ?charging=${eletric && this.isCharging}
            style="--vic-range-width: ${state}%;"
          ></div>
        </div>
        <div class="item">
          <span>${rangeInfo}</span>
        </div>
      </div>
    `;

    const renderBothInfoBoxes = () =>
      html` ${fuelInfo && rangeLiquidInfo
        ? renderInfoBox(
            'mdi:gas-station',
            fuelInfo.state!,
            fuelInfo.stateDisplay!,
            rangeLiquidInfo.stateDisplay!,
            false
          )
        : ''}
      ${socInfo && rangeElectricInfo
        ? renderInfoBox('mdi:ev-station', socInfo.state!, socInfo.stateDisplay!, rangeElectricInfo.stateDisplay!, true)
        : ''}`;

    return html`<div class="combined-info-box">${renderBothInfoBoxes()}</div>`;
  }

  private _renderHeaderSlides(): TemplateResult {
    if (!this.config.images || (!this.config?.show_slides && this.config.show_slides !== undefined)) return html``;

    return html`
      <div id=${SECTION.IMAGES_SLIDER}>
        <header-slide .config=${this.config} .editMode=${this.editMode}></header-slide>
      </div>
    `;
  }

  private _renderMap(): TemplateResult | void {
    const config = this.config;
    const deviceTracker = config.device_tracker;
    const deviceState = this.getEntityState(deviceTracker);
    const isDark = this._isDarkTheme();
    if (!config.show_map) {
      return;
    }
    if ((!config.device_tracker || /(unknown|unavailable)/.test(deviceState) || !deviceState) && config.show_map) {
      return this._showWarning('No device_tracker entity provided or entity is unavailable');
    }
    return html`
      <div id=${SECTION.MINI_MAP}>
        <vehicle-map .hass=${this._hass} .mapData=${this.MapData!} .card=${this} .isDark=${isDark}></vehicle-map>
      </div>
    `;
  }

  private _renderEcoChart(): TemplateResult {
    if (this._currentCardType !== 'ecoCards') return html``;

    const getEcoScore = (entity: string | undefined): number => {
      if (!entity) return 0;
      const state = this.getEntityState(entity);
      return state === 'unavailable' ? 0 : parseFloat(state);
    };

    const filteredData = Object.values(this.DataKeys.ecoScores).filter((item) => item.key !== 'ecoScoreBonusRange');

    const echoChartObj = {} as ecoChartModel;

    const chartData = filteredData.map((item) => {
      const label = this.localize(`card.ecoCard.${item.key}`);
      const score = getEcoScore(this.vehicleEntities[item.key]?.entity_id);
      return { series: score, labels: label };
    });

    echoChartObj.chartData = chartData;
    echoChartObj.bonusRange = {
      label: this.localize('card.ecoCard.ecoScoreBonusRange'),
      value: this.getStateDisplay(this.vehicleEntities.ecoScoreBonusRange?.entity_id),
    };

    return html`<eco-chart .ecoChartData=${echoChartObj}></eco-chart>`;
  }

  private _renderButtons(): TemplateResult {
    if (this.config?.show_buttons === false || !this._buttonReady) return html``;
    const notHidden = Object.entries(this.buttonCards).filter(([, value]) => !value.button.hidden);
    const buttonCards = Object.fromEntries(notHidden);
    const config = this.config;
    return html`
      <div id=${SECTION.BUTTONS}>
        <vehicle-buttons
          .hass=${this._hass}
          .component=${this}
          ._config=${config}
          ._buttons=${buttonCards}
          ._cardCurrentSwipeIndex=${this._currentSwipeIndex}
        ></vehicle-buttons>
      </div>
    `;
  }

  private _renderCustomCard(): TemplateResult {
    if (!this._currentCardType) return html``;

    const cardConfigMap = {
      tripCards: this._renderDefaultTripCard(),
      vehicleCards: this._renderDefaultVehicleCard(),
      ecoCards: this._renderDefaultEcoCard(),
      tyreCards: this._renderDefaultTyreCard(),
      emptyCustom: this._showWarning('No custom card provided'),
    };

    const cardHeaderBox = html`<div class="added-card-header">
      <ha-icon-button .label=${'Close'} .path=${mdiClose} class="click-shrink" @click=${() => this.toggleCard('close')}>
      </ha-icon-button>
      <div class="card-toggle">
        <ha-icon-button
          .label=${'Previous'}
          .path=${mdiChevronLeft}
          @click=${() => this.toggleCard('prev')}
          class="click-shrink"
        ></ha-icon-button>

        <ha-icon-button
          .label=${'Next'}
          .path=${mdiChevronRight}
          @click=${() => this.toggleCard('next')}
          class="click-shrink"
        ></ha-icon-button>
      </div>
    </div>`;

    const key = this._currentCardType;
    const defaultType = (key: string) => this.buttonCards[key]?.card_type ?? 'default';
    const selectedCard = this.buttonCards[key];

    if (!selectedCard) {
      return html`<main id="cards-wrapper">${cardHeaderBox}${this._showWarning('No custom card provided')}</main>`;
    }
    const cardType = selectedCard.card_type ?? 'default';
    const customCard = !isEmpty(selectedCard.custom_card)
      ? selectedCard.custom_card.map((card: LovelaceCardConfig) => card)
      : cardConfigMap.emptyCustom;

    const renderCard = cardType === 'custom' ? customCard : cardConfigMap[key] ?? cardConfigMap.emptyCustom;

    const lastCarUpdate = this.config.entity ? this._hass.states[this.config.entity].last_changed : '';
    const formattedDate = formatDateTime(new Date(lastCarUpdate), this._locale);

    return html`
      <main id="cards-wrapper">
        ${cardHeaderBox}
        <section class="card-element" type=${defaultType(key)}>${renderCard}</section>
        ${defaultType(key) === 'default'
          ? html`
              <div class="last-update">
                <span>${this.localize('card.common.lastUpdate')}: ${formattedDate}</span>
              </div>
            `
          : nothing}
      </main>
    `;
  }

  private _renderDefaultTripCard(): TemplateResult | void {
    const { tripOverview, tripFromStart, tripFromReset } = this.DataKeys;
    const sections = [
      {
        title: this.localize('card.tripCard.overview'),
        data: this.createDataArray(tripOverview),
        key: '',
      },
      {
        title: this.localize('card.tripCard.fromStart'),
        data: this.createDataArray(tripFromStart),
        key: 'fromStart',
      },
      {
        title: this.localize('card.tripCard.fromReset'),
        data: this.createDataArray(tripFromReset),
        key: 'fromReset',
      },
    ];
    return html` ${sections.map((section) => this.createItemDataRow(section.title, section.data, section.key))} `;
  }

  private _renderDefaultVehicleCard(): TemplateResult | void {
    const warningsData = this.createDataArray(this.DataKeys.vehicleWarnings);

    const isSubCardVisible = this.isOverviewDataActive() || !this._activeSubCard.has('warnings');

    return html`
      <div class="default-card">
        <div class="data-header">${this.localize('card.vehicleCard.vehicleStatus')}</div>
        <div class="data-box">${this._renderOverviewDataWithSubCard()}</div>
      </div>
      <div class="default-card">
        <div class="data-header">
          <div @click=${() => this.toggleSubCard('warnings')} ?clickable=${true}>
            ${this.localize('card.vehicleCard.vehicleWarnings')}
          </div>
          <div class="subcard-icon" ?active=${!isSubCardVisible} @click=${() => this.toggleSubCard('warnings')}>
            <ha-icon icon="mdi:chevron-down"></ha-icon>
          </div>
        </div>
        <div class="data-box" active=${!isSubCardVisible}>
          ${warningsData.map(({ key, icon, state, name, active }) => {
            return html`
              <div class="data-row">
                <div>
                  <ha-icon
                    class="data-icon"
                    .icon="${icon}"
                    @click=${() => this.toggleMoreInfo(this.vehicleEntities[key]?.entity_id)}
                  ></ha-icon>
                  <span>${name}</span>
                </div>
                <div
                  class="data-value-unit"
                  ?error=${active}
                  @click=${() => this.toggleMoreInfo(this.vehicleEntities[key]?.entity_id)}
                >
                  <span>${state}</span>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  private _renderDefaultEcoCard(): TemplateResult | void {
    const ecoData = this.createDataArray(this.DataKeys.ecoScores);

    return html`<div class="default-card">
        <div class="data-header">${this.localize('card.ecoCard.ecoDisplay')}</div>
        <div class="data-box">${this._renderEcoChart()}</div>
      </div>
      ${this.createItemDataRow(this.localize('card.ecoCard.ecoScore'), ecoData, 'ecoScores')}`;
  }

  private _renderDefaultTyreCard(): TemplateResult {
    if (!this.DataKeys.tyrePressures) return html``;
    const tireConfig = this.config?.extra_configs?.tire_card_custom || {};
    const customTyreBg = tireConfig?.background || IMAGE.tyreBg;
    const isHorizontal = tireConfig?.horizontal ?? false;
    const tireImageSize = tireConfig?.image_size ?? 100;
    const tireValueSize = tireConfig?.value_size ?? 100;
    const tireTop = tireConfig?.top ?? 50;
    const tireLeft = tireConfig?.left ?? 50;

    const sizeStyle = {
      '--vic-tire-top': `${tireTop}%`,
      '--vic-tire-left': `${tireLeft}%`,
      '--vic-tire-size': `${tireImageSize}%`,
      '--vic-tire-value-size': tireValueSize / 100,
    };

    const isPressureWarning = this.getBooleanState(this.vehicleEntities.tirePressureWarning?.entity_id);

    const tireCardTitle = this.localize('card.tyreCard.tyrePressure');
    const tireWarningProblem = this.localize('card.tyreCard.tireWarningProblem');
    const tireWarningOk = this.localize('card.tyreCard.tireWarningOk');

    const tyreInfo = isPressureWarning ? tireWarningProblem : tireWarningOk;

    return html`
      <div class="default-card">
        <div class="data-header">${tireCardTitle}</div>
        <div class="tyre-toggle-btn click-shrink" @click=${(ev: Event) => this.toggleTireDirection(ev)}>
          <ha-icon icon="mdi:rotate-right-variant"></ha-icon>
        </div>
        <div class="data-box tyre-wrapper" ?rotated=${isHorizontal} style=${styleMap(sizeStyle)}>
          <div class="background" style="background-image: url(${customTyreBg})"></div>
          ${this.DataKeys.tyrePressures.map(
            (tyre) =>
              html` <div
                class="tyre-box"
                tyre=${tyre.key.replace('tirePressure', '').toLowerCase()}
                ?rotated=${isHorizontal}
              >
                <span class="tyre-value">${this.getStateDisplay(this.vehicleEntities[tyre.key]?.entity_id)}</span>
                <span class="tyre-name">${tyre.name}</span>
              </div>`
          )}
        </div>
        <div class="tyre-info" ?warning=${isPressureWarning}>
          <span>${tyreInfo}</span>
        </div>
      </div>
    `;
  }

  private toggleTireDirection(ev: Event): void {
    ev.stopPropagation();
    const target = ev.target as HTMLElement;
    const tyreWrapper = target.closest('.default-card')?.querySelector('.tyre-wrapper');
    const tyreBoxex = tyreWrapper?.querySelectorAll('.tyre-box');
    if (!tyreWrapper || !tyreBoxex) return;

    const isHorizontal = tyreWrapper.attributes.hasOwnProperty('rotated');

    tyreWrapper.toggleAttribute('rotated', !isHorizontal);

    tyreBoxex.forEach((el) => {
      el.toggleAttribute('rotated', !isHorizontal);
    });
  }

  private _showWarning(warning: string): TemplateResult {
    return html` <hui-warning>${warning}</hui-warning> `;
  }

  /* --------------------------- ADDITIONAL METHODS --------------------------- */

  public _isDarkTheme(): boolean {
    const css = getComputedStyle(this);
    const primaryTextColor = css.getPropertyValue('--primary-text-color');
    const isDark = isDarkColor(primaryTextColor);
    return isDark;
  }

  /* -------------------------------------------------------------------------- */
  /* ADDED CARD FUNCTIONALITY                                                   */
  /* -------------------------------------------------------------------------- */

  toggleCard = (action: HEADER_ACTION) => {
    forwardHaptic('light');
    const cardElement = this.shadowRoot?.querySelector('.card-element') as HTMLElement;
    if (!this._currentCardType || !cardElement) return;
    const baseCardTypes = Object.values(this.buttonCards).filter((card) => card.button_type !== 'action');

    if (action === 'next' || action === 'prev') {
      const currentIndex = baseCardTypes.findIndex((card) => card.key === this._currentCardType);
      const newIndex =
        action === 'next'
          ? (currentIndex + 1) % baseCardTypes.length
          : (currentIndex - 1 + baseCardTypes.length) % baseCardTypes.length;

      cardElement.style.animation = 'none';
      setTimeout(() => {
        this._currentCardType = baseCardTypes[newIndex].key;
        cardElement.style.animation = 'fadeIn 0.3s ease';
      }, 300);
      // this.activeCardType = cardTypes[newIndex].type;
    } else if (action === 'close') {
      this._currentCardType = null;
    }
  };

  public toggleCardFromButtons = (cardType: string) => {
    forwardHaptic('light');
    setTimeout(() => {
      this._currentCardType = this._currentCardType === cardType ? null : cardType;
    }, 150);
  };

  /* --------------------- SUBCARDS METHODS AND RENDERING --------------------- */

  private _renderOverviewDataWithSubCard(): TemplateResult {
    const overViewData = this.createDataArray(this.DataKeys.vehicleOverview);

    // Map to handle the visibility and rendering of subcards
    const subCardMapping = {
      lockSensor: {
        key: 'lock',
        renderSubCard: () => this._renderSubCard('lock'),
      },
      windowsClosed: {
        key: 'window',
        renderSubCard: () => this._renderSubCard('window'),
      },
      doorStatusOverall: {
        key: 'door',
        renderSubCard: () => this._renderSubCard('door'),
      },
    };

    const toggleMoreInfo = (key: string) => {
      const entityId =
        key === 'lockSensor' || key === 'doorStatusOverall'
          ? this.vehicleEntities.lockSensor?.entity_id
          : this.vehicleEntities[key]?.entity_id;

      if (entityId) {
        this.toggleMoreInfo(entityId);
      }
    };

    const subCardVisible = (key: string) => this.isSubCardActive(key);

    const toggleSubCard = (key: string) => {
      if (['doorStatusOverall', 'lockSensor', 'windowsClosed'].includes(key)) {
        this.toggleSubCard(subCardMapping[key].key);
      } else {
        toggleMoreInfo(key);
      }
    };

    return html`
      ${overViewData.map(({ key, name, icon, state, active }) => {
        if (state) {
          const subCard = subCardMapping[key];
          return html`
            <div class="data-row">
              <div>
                <ha-icon
                  class="data-icon"
                  .icon="${icon}"
                  ?warning=${!active}
                  @click=${() => toggleMoreInfo(key)}
                ></ha-icon>
                <span class="data-label">${name}</span>
              </div>
              <div class="data-value-unit" @click=${() => toggleSubCard(key)}>
                <span ?warning=${!active} style="text-transform: capitalize;">${state}</span>
                ${subCard
                  ? html`
                      <ha-icon class="subcard-icon" ?active=${subCardVisible(subCard.key)} icon="mdi:chevron-down">
                      </ha-icon>
                    `
                  : ''}
              </div>
            </div>
            ${subCard ? subCard.renderSubCard() : ''}
          `;
        } else {
          return html``;
        }
      })}
    `;
  }

  private _renderSubCard(attributeType: 'lock' | 'window' | 'door'): TemplateResult {
    const lang = this.userLang;
    const state: Record<string, string | boolean> = {};
    const entityID = this.getEntityTypeId(attributeType);
    const stateMapping = this.getAttrStateMap(attributeType, lang);
    const attributesVisible = this.isSubCardActive(attributeType);

    // Iterate over the keys of the stateMapping object
    Object.keys(stateMapping).forEach((key) => {
      let attributeState: string | boolean | null | undefined;
      // Check if the attribute is the charge flap DC status
      if (key === 'chargeflapdcstatus' && this.vehicleEntities.chargeFlapDCStatus?.entity_id !== undefined) {
        attributeState = this.getEntityState(this.vehicleEntities.chargeFlapDCStatus.entity_id);
      } else if (key === 'sunroofstatus' && this.vehicleEntities.sunroofStatus?.entity_id !== undefined) {
        attributeState = this.getEntityState(this.vehicleEntities.sunroofStatus.entity_id);
      } else {
        attributeState = this.getEntityAttribute(entityID, key);
      }
      // Check if the attribute state

      if (attributeState !== undefined && attributeState !== null) {
        state[key] = attributeState;
      }
    });
    // Render the attributes
    return html`
      <div class="sub-attributes" ?active=${attributesVisible}>
        ${Object.keys(state).map((key) => {
          const rawState = state[key];
          // Check if the state is valid and the attribute mapping exists
          if (rawState !== undefined && rawState !== null && stateMapping[key]) {
            const readableState = stateMapping[key].state[rawState] || 'Unknown';
            let classState: boolean;
            if (key === 'sunroofstatus') {
              classState = rawState === '0' ? false : true;
            } else {
              classState = ['2', '1', false].includes(rawState as string) ? false : true;
            }
            return html`
              <div class="data-row">
                <span>${stateMapping[key].name}</span>
                <div class="data-value-unit" ?warning=${classState}>
                  <span style="text-transform: capitalize">${readableState}</span>
                </div>
              </div>
            `;
          }
          // Return nothing if the attribute state is not valid or attribute mapping does not exist
          return '';
        })}
      </div>
    `;
  }

  private getEntityTypeId(attributeType: 'lock' | 'window' | 'door'): string | undefined {
    const entityMapping: Record<string, string | undefined> = {
      lock: this.vehicleEntities.lockSensor?.entity_id,
      window: this.vehicleEntities.windowsClosed?.entity_id,
      door: this.vehicleEntities.lockSensor?.entity_id,
    };
    return entityMapping[attributeType];
  }

  private getAttrStateMap(
    attributeType: 'lock' | 'window' | 'door',
    lang: string
  ): Record<'lock' | 'window' | 'door', string> {
    const stateMapping: Record<string, any> = {
      lock: StateMapping.lockAttributes(lang),
      window: StateMapping.windowAttributes(lang),
      door: StateMapping.doorAttributes(lang),
    };
    return stateMapping[attributeType] || {};
  }

  /* -------------------------------------------------------------------------- */
  /* GET ENTITIES STATE AND ATTRIBUTES                                          */
  /* -------------------------------------------------------------------------- */

  private createItemDataRow(title: string, data: EntityConfig[], key: string): TemplateResult {
    const isActive = (key: string) => this.isSubCardActive(key);

    const subCardToggleBtn = (key: string) => {
      if (key !== '') {
        return html`
          <div class="subcard-icon" ?active=${isActive(key)} @click=${() => this.toggleSubCard(key)}>
            <ha-icon icon="mdi:chevron-down"></ha-icon>
          </div>
        `;
      }
      return html``;
    };

    return html`
      <div class="default-card">
        <div class="data-header">
          <div @click=${() => this.toggleSubCard(key)} ?clickable=${key !== ''}>${title}</div>
          ${subCardToggleBtn(key)}
        </div>
        <div class="data-box" active=${isActive(key)}>
          ${data.map(({ key, name, icon, state }) => {
            if (state) {
              return html`
                <div class="data-row">
                  <div>
                    <ha-icon class="data-icon" .icon="${icon}"></ha-icon>
                    <span class="data-label">${name}</span>
                  </div>
                  <div
                    class="data-value-unit"
                    @click=${() => this.toggleMoreInfo(this.vehicleEntities[key]?.entity_id)}
                  >
                    <span>${state}</span>
                  </div>
                </div>
              `;
            } else {
              return html``;
            }
          })}
        </div>
      </div>
    `;
  }

  private toggleSubCard(key: string): void {
    if (key === undefined) return;
    const subCard = this._activeSubCard;
    if (key === 'warnings' && this.isOverviewDataActive()) {
      subCard.forEach((key) => subCard.delete(key));
      this.updateComplete.then(() => {
        subCard.add(key);
        this.requestUpdate();
      });
    } else {
      subCard.has(key) ? subCard.delete(key) : subCard.add(key);
      this.requestUpdate();
    }
  }

  private isSubCardActive = (key: string): boolean => {
    return key === '' ? true : this._activeSubCard.has(key);
  };

  private isOverviewDataActive(): boolean {
    return ['lock', 'window', 'door'].some((k) => this._activeSubCard.has(k));
  }

  private createDataArray(keys: EntityConfig[]): EntityConfig[] {
    return keys
      .map((config) => this.getEntityInfoByKey(config))
      .filter((config): config is EntityConfig => config !== null);
  }

  private getEntityInfoByKey = ({ key, name, icon, state, unit }: EntityConfig): EntityConfig | null => {
    const vehicleEntityKey = this.vehicleEntities[key];

    if (!vehicleEntityKey) {
      return null;
    }

    const defaultInfo = this.getDefaultEntityInfo({ key, name, icon, state, unit }, vehicleEntityKey);

    const entityInfoMap = {
      soc: this.getSocInfo,
      maxSoc: this.getMaxSocInfo,
      chargingPower: this.getChargingPowerInfo,
      parkBrake: this.getParkBrakeInfo,
      windowsClosed: this.getWindowsClosedInfo,
      ignitionState: this.getIgnitionStateInfo,
      lockSensor: this.getLockSensorInfo,
      starterBatteryState: this.getStarterBatteryInfo,
    };

    const getInfoFunction = entityInfoMap[key];

    if (getInfoFunction) {
      return getInfoFunction(defaultInfo, vehicleEntityKey);
    } else {
      return this.getWarningOrDefaultInfo(defaultInfo, key, vehicleEntityKey);
    }
  };

  /* --------------------------- ENTITY INFO BY KEYS -------------------------- */

  private getDefaultEntityInfo = (
    { key, name, icon, state, unit }: EntityConfig,
    vehicleEntity: VehicleEntity
  ): EntityConfig => {
    return {
      key,
      name: name ?? vehicleEntity.original_name,
      icon: icon ?? this.getEntityAttribute(vehicleEntity.entity_id, 'icon'),
      state: state ?? this.getStateDisplay(vehicleEntity.entity_id),
      unit: unit ?? this.getEntityAttribute(vehicleEntity.entity_id, 'unit_of_measurement'),
    };
  };

  private getSocInfo = (defaultInfo: EntityConfig, vehicleEntity: VehicleEntity): EntityConfig => {
    const currentState = this.getEntityState(vehicleEntity.entity_id);
    const stateValue = currentState ? parseFloat(currentState) : 0;
    let socIcon: string;
    if (stateValue < 35) {
      socIcon = 'mdi:battery-charging-low';
    } else if (stateValue < 70) {
      socIcon = 'mdi:battery-charging-medium';
    } else {
      socIcon = 'mdi:battery-charging-high';
    }
    return { ...defaultInfo, icon: socIcon };
  };

  private getMaxSocInfo = (defaultInfo: EntityConfig, vehicleEntity: VehicleEntity): EntityConfig => {
    const maxSocState = this.getEntityState(vehicleEntity.entity_id);
    const maxSocStateValue = maxSocState ? parseFloat(maxSocState) : 0;
    const iconValue = Math.round(maxSocStateValue / 10) * 10;
    const maxSocIcon = `mdi:battery-charging-${iconValue}`;

    return { ...defaultInfo, icon: maxSocIcon };
  };

  private getChargingPowerInfo = (defaultInfo: EntityConfig, vehicleEntity: VehicleEntity): EntityConfig => {
    const powerStateDislay = this.getStateDisplay(vehicleEntity.entity_id);

    if (powerStateDislay) {
      return { ...defaultInfo, state: powerStateDislay };
    }

    const voltageEntity = this.vehicleEntities.chargingVoltage?.entity_id;
    const currentEntity = this.vehicleEntities.chargingCurrent?.entity_id;

    if (voltageEntity && currentEntity) {
      const voltage = Number(this.getEntityState(voltageEntity));
      const current = Number(this.getEntityState(currentEntity));

      if (!Number.isNaN(voltage) && !Number.isNaN(current)) {
        const calculatedPower = (voltage * current) / 1000;
        return { ...defaultInfo, state: `${calculatedPower.toFixed(2)} kW` };
      }
    }

    return defaultInfo;
  };

  private getParkBrakeInfo = (defaultInfo: EntityConfig, vehicleEntity: VehicleEntity): EntityConfig => {
    const parkBrakeState = this.getBooleanState(vehicleEntity.entity_id);
    const entityState = parkBrakeState
      ? this.localize('card.common.stateParkBrakeOn')
      : this.localize('card.common.stateParkBrakeOff');
    return {
      ...defaultInfo,
      state: entityState,
      active: parkBrakeState,
    };
  };

  private getDoorStatusInfo = (): { state: string; active: boolean } => {
    const doorStatusEntityId = this.vehicleEntities.doorStatusOverall?.entity_id;

    if (!doorStatusEntityId) {
      return { state: '', active: false };
    }

    const rawDoorState = this.getEntityState(doorStatusEntityId);
    const isClosed = rawDoorState?.toString().toUpperCase() === 'SECURED';

    return {
      state: isClosed ? this.localize('card.common.stateClosed') : this.localize('card.common.stateOpen'),
      active: Boolean(isClosed),
    };
  };

  private getWindowsClosedInfo = (defaultInfo: EntityConfig, _vehicleEntity: VehicleEntity): EntityConfig => {
    void _vehicleEntity;
    const isClosedState = (state?: string | null) => {
      if (state === null || state === undefined) return false;
      const normalized = state.toString().toUpperCase();
      return normalized === 'CLOSED' || normalized === '0' || normalized === 'FALSE';
    };

    const openWindows = this.windowEntities.filter((entityId) => !isClosedState(this.getEntityState(entityId)));
    const sunroofState = this.vehicleEntities.sunroofStatus?.entity_id
      ? this.getEntityState(this.vehicleEntities.sunroofStatus.entity_id)
      : undefined;

    const closed = openWindows.length === 0 && (sunroofState === undefined || isClosedState(sunroofState));

    const windowStateOverall = closed
      ? this.localize('card.common.stateClosed')
      : `${openWindows.length} ${this.localize('card.common.stateOpen')}`;

    return {
      ...defaultInfo,
      state: windowStateOverall,
      active: closed,
    };
  };

  private getIgnitionStateInfo = (defaultInfo: EntityConfig, vehicleEntity: VehicleEntity): EntityConfig => {
    const realState = this.getEntityState(vehicleEntity.entity_id);
    const stateStr = StateMapping.ignitionState(this.userLang)[realState] || this.localize('card.common.stateUnknown');
    const activeState = realState === '0' || realState === '1' ? true : false;
    return {
      ...defaultInfo,
      state: stateStr,
      active: activeState,
    };
  };

  private getLockSensorInfo = (defaultInfo: EntityConfig, vehicleEntity: VehicleEntity): EntityConfig => {
    const lockState = this.getEntityState(vehicleEntity.entity_id);
    const isLocked = lockState?.toString().toUpperCase() === 'SECURED';
    const lockIcon = isLocked ? 'mdi:lock' : 'mdi:lock-open-variant';
    const lockStateFormatted = isLocked
      ? this.localize('card.common.stateLocked') || 'Locked'
      : this.localize('card.common.stateUnlocked') || 'Unlocked';

    return {
      ...defaultInfo,
      icon: lockIcon,
      state: lockStateFormatted,
      active: isLocked,
    };
  };

  private getStarterBatteryInfo = (defaultInfo: EntityConfig, vehicleEntity: VehicleEntity): EntityConfig => {
    const lang = this.userLang;
    const stateValue = this.getEntityState(vehicleEntity.entity_id);
    const stateFormated = StateMapping.starterBattery(lang)[stateValue] || 'Unknown';

    return {
      ...defaultInfo,
      state: stateFormated,
    };
  };

  private getWarningOrDefaultInfo = (
    defaultInfo: EntityConfig,
    key: string,
    vehicleEntity: VehicleEntity
  ): EntityConfig => {
    if (this.DataKeys.vehicleWarnings.map((key) => key.key).includes(key)) {
      const warningState = this.getBooleanState(vehicleEntity.entity_id);

      return {
        ...defaultInfo,
        state: warningState ? 'Problem' : 'OK',
        active: warningState ? true : false,
      };
    }
    return defaultInfo;
  };

  /* --------------------- GET ENTITY STATE AND ATTRIBUTES -------------------- */

  public getStateDisplay(entityId: string | undefined): string {
    if (!entityId || !this._hass.states[entityId]) return '';
    return this._hass.formatEntityState(this._hass.states[entityId]);
  }

  public getSecondaryInfo(cardType: string): string {
    const { odometer, lockSensor, ecoScoreBonusRange } = this.vehicleEntities;

    switch (cardType) {
      case 'tripCards':
        return this.getStateDisplay(odometer?.entity_id);

      case 'vehicleCards':
        const lang = this.userLang;
        const lockState = this.getEntityState(lockSensor?.entity_id);
        const realState = StateMapping.lockStates(lang)[lockState] || StateMapping.lockStates['4'];

        return realState;

      case 'ecoCards':
        return this.getStateDisplay(ecoScoreBonusRange?.entity_id);

      case 'tyreCards':
        const secondaryInfoTyres = this.getMinMaxTyrePressure();
        return secondaryInfoTyres;

      default:
        return 'Unknown Card';
    }
  }

  private getBooleanState(entity: string | undefined): boolean {
    if (!entity || !this._hass.states[entity]) return false;
    return this._hass.states[entity].state === 'on';
  }

  private getEntityState(entity: string | undefined): string {
    if (!entity || !this._hass.states[entity]) return '';
    return this._hass.states[entity].state;
  }

  private getEntityAttribute(entity: string | undefined, attribute: string) {
    if (!entity || !this._hass.states[entity] || !this._hass.states[entity].attributes) return undefined;
    return this._hass.states[entity].attributes[attribute];
  }

  public getFormattedAttributeState(entity: string | undefined, attribute: string): string {
    if (!entity || !this._hass.states[entity] || !this._hass.states[entity].attributes) return '';
    return this._hass.formatEntityAttributeValue(this._hass.states[entity], attribute);
  }

  private toggleMoreInfo(entity: string): void {
    fireEvent(this, 'hass-more-info', { entityId: entity });
  }

  private getMinMaxTyrePressure = (): string => {
    if (!this.DataKeys.tyrePressures) return '';
    const pressuresWithUnits = this.DataKeys.tyrePressures.map((key) => ({
      pressure: this.getEntityState(this.vehicleEntities[key.key]?.entity_id) || '',
      unit: this.getEntityAttribute(this.vehicleEntities[key.key]?.entity_id, 'unit_of_measurement'),
    }));

    // Find the minimum and maximum pressures
    const minPressure = Math.min(...pressuresWithUnits.map(({ pressure }) => parseFloat(pressure)));
    const maxPressure = Math.max(...pressuresWithUnits.map(({ pressure }) => parseFloat(pressure)));

    // Format the minimum and maximum pressures with their original units
    const tireUnit = pressuresWithUnits[0]?.unit || '';
    const formattedMinPressure = minPressure % 1 === 0 ? minPressure.toFixed(0) : minPressure.toFixed(1);
    const formattedMaxPressure = maxPressure % 1 === 0 ? maxPressure.toFixed(0) : maxPressure.toFixed(1);
    return `${formattedMinPressure} - ${formattedMaxPressure} ${tireUnit}`;
  };

  public getErrorNotify(cardType: string): boolean {
    if (!this.DataKeys.vehicleWarnings) return false;
    const { vehicleEntities } = this;
    switch (cardType) {
      case 'vehicleCards':
        const warnKeys = [
          ...this.DataKeys.vehicleWarnings.map((key) => key.key).filter((key) => key !== 'tirePressureWarning'),
        ];
        const hasWarning = warnKeys.some((key) => this.getBooleanState(vehicleEntities[key]?.entity_id));
        return hasWarning;
      case 'tyreCards':
        return this.getBooleanState(vehicleEntities.tirePressureWarning?.entity_id);
      default:
        return false;
    }
  }

  /* ---------------------------- THEME METHODS ---------------------------- */
  private applyTheme(theme: string): void {
    const themeData = this._hass.themes.themes[theme];
    if (themeData) {
      // Filter out only top-level properties for CSS variables and the modes property
      const filteredThemeData = Object.keys(themeData)
        .filter((key) => key !== 'modes')
        .reduce((obj, key) => {
          obj[key] = themeData[key];
          return obj;
        }, {} as Record<string, string>);

      // Get the current mode (light or dark)
      const mode = this.isDark ? 'dark' : 'light';
      const modeData = themeData.modes && typeof themeData.modes === 'object' ? themeData.modes[mode] : {};

      // Merge the top-level and mode-specific variables
      const allThemeData = { ...filteredThemeData, ...modeData };
      applyThemesOnElement(
        this,
        { default_theme: this._hass.themes.default_theme, themes: { [theme]: allThemeData } },
        theme,
        false
      );
    }
  }

  /* ---------------------------- COMPUTE CARD STYLES & CLASSES ---------------------------- */
  private _computeCardStyles() {
    // if (!this._resizeInitiated) return;
    const isDarkMode = this._hass?.themes?.darkMode ?? this.isDark;
    const backgroundUrl = isDarkMode ? IMAGE.bmwDark : IMAGE.bmwLight;
    const bgOpacity = isDarkMode ? '0.26' : '0.22';
    const glassBg = isDarkMode ? 'rgba(10, 14, 22, 0.65)' : 'rgba(255, 255, 255, 0.7)';
    const glassBorder = isDarkMode
      ? '1px solid rgba(255, 255, 255, 0.14)'
      : '1px solid rgba(0, 0, 0, 0.08)';
    return styleMap({
      '--vehicle-card-bg': this.config.show_background ? `url("${backgroundUrl}")` : 'none',
      '--vic-background-image': this.config.show_background ? `url("${backgroundUrl}")` : 'none',
      '--vic-bg-opacity': bgOpacity,
      '--vic-glass-bg': glassBg,
      '--vic-glass-border': glassBorder,
    });
  }

  private _computeClasses() {
    // if (this._loading) return;
    const showBackground = this.config.show_background && !this._loading;
    const sectionOrder = this.config.extra_configs?.section_order ?? [...SECTION_DEFAULT_ORDER];
    const lastItem = sectionOrder[sectionOrder.length - 1];
    const firstItem = sectionOrder[0];
    const mapSingle = sectionOrder.includes(SECTION.MINI_MAP) && sectionOrder.length === 1;
    return classMap({
      __background: showBackground,
      __map_last: lastItem === SECTION.MINI_MAP && firstItem !== SECTION.MINI_MAP,
      __map_first: firstItem === SECTION.MINI_MAP && lastItem !== SECTION.MINI_MAP,
      __map_single: mapSingle,
    });
  }

  /* --------------------------- CONFIGURATION METHODS -------------------------- */
  private _setUpButtonAnimation = (): void => {
    if (this.isEditorPreview || this.vehicleButtons === null) return;
    setTimeout(() => {
      const gridItems = this.vehicleButtons.shadowRoot?.querySelectorAll('.grid-item');
      if (!gridItems) return;
      gridItems.forEach((item) => {
        item.classList.add('zoom-in');
        item.addEventListener('animationend', () => {
          item.classList.remove('zoom-in');
        });
      });
    }, 50);
  };

  /* ----------------------------- EVENTS HANDLERS ---------------------------- */

  private handleEditorEvents(e: Event): void {
    e.stopPropagation();
    if (!this.isEditorPreview) return;

    const actionType = (e as CustomEvent).detail;
    console.log('actionType', actionType);
    switch (true) {
      case actionType.startsWith('btn_'):
        const btnType = actionType.replace('btn_', '');
        this.vehicleButtons?.showCustomBtnEditor(btnType);
        break;

      case actionType.startsWith('toggle_preview_'):
        console.log('toggle_preview_', actionType);
        const preview = actionType.replace('toggle_preview_', '');
        this._currentPreviewType = preview;
        this.updateComplete.then(() => {
          this._configurePreview(preview);
        });
        break;
      case actionType.startsWith('swipe_'):
        const swipeAction = actionType.replace('swipe_', '');
        this.vehicleButtons?.swipeToButton(swipeAction);
        break;
      default:
        break;
    }
  }

  /* ---------------------------- GRID LAYOUT METHODS --------------------------- */
  private getGridRowSize(): number {
    const { show_slides = true, show_map = true, show_buttons = true, show_header_info = true } = this.config;

    // Header Name
    const configName = this.config.name?.trim() === '';
    const name = configName ? ROWPX / 44 : 0;

    // Mini map height
    const mini_map_height = this.config.extra_configs?.mini_map_height ?? 150;
    const minimapHeight = mini_map_height / ROWPX;

    // Grid buttons height
    const visibleButtons = Object.values(this.buttonCards).filter((card) => !card.button.hidden).length;
    const rows_size = this.config.button_grid?.rows_size ?? 2;
    const columns_size = this.config.button_grid?.columns_size ?? 2;

    const possibleRows = Math.ceil(visibleButtons / columns_size);
    const buttonRows = rows_size > possibleRows ? possibleRows : rows_size;

    const layoutRowHeight = this.config.button_grid?.button_layout === 'vertical' ? 57 * 2 : 57;
    const gridButtonsHeight = (buttonRows * layoutRowHeight + 12) / ROWPX;

    // Images height
    const configImgMaxHeight = this.config.extra_configs?.images_swipe?.max_height ?? 150;
    const imagesHeight = (configImgMaxHeight + 28) / ROWPX;

    const headerInfoHeight = 70 / ROWPX;

    // Mini map in section last or first
    const sectionsList = this.config.extra_configs?.section_order ?? [...SECTION_DEFAULT_ORDER];
    const miniMapAtTopOrBottom =
      sectionsList[sectionsList.length - 1] === SECTION.MINI_MAP || sectionsList[0] === SECTION.MINI_MAP
        ? 12 / ROWPX
        : 0;

    let gridRowSize = 0; // 58px
    if (show_slides) gridRowSize += imagesHeight;
    if (show_map) gridRowSize += minimapHeight;
    if (show_buttons) gridRowSize += gridButtonsHeight;
    if (show_header_info) gridRowSize += headerInfoHeight;
    if (configName) gridRowSize += name;
    gridRowSize -= miniMapAtTopOrBottom;

    return gridRowSize;
  }

  public getCardSize() {
    // console.log('mansory', this.getGridRowSize());
    return 3;
  }

  public getLayoutOptions() {
    const gridRowSize = this.getGridRowSize();
    return {
      grid_min_rows: gridRowSize,
      grid_columns: 4,
      grid_min_columns: 4,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bmw-cardata-info-card': VehicleCard;
  }
  interface Window {
    BenzCard: VehicleCard;
  }
}

// Load and clean extra map resources
loadAndCleanExtraMap().catch(console.error);
