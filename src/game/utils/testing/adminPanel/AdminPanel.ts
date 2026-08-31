import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.ts'
import {STORAGE_KEYS} from '@/game/engine/storage/defaultData.ts'
import LocalStorage from '@/game/engine/storage/LocalStorage.ts'
import type Storage from '@/game/engine/storage/Storage.ts'
import ABTest from '@/game/modules/ABTest.ts'
import type {FieldData, SelectOption} from '@/game/utils/testing/adminPanel/templates.ts'
import {
  createButton,
  createCheckboxItem,
  createFieldsetGrid,
  createNumberItem,
  createNumberRow,
  createSelectRow,
} from '@/game/utils/testing/adminPanel/templates.ts'

type AdminPanelConfig = {
  checkboxes: FieldData[]
  selects: FieldData[]
  numberInputs: FieldData[]
}

type AdminState = Record<string, string | number | boolean>

const DEBUG_KEY = 'isDebug'

// todo переусложнённая генерация. Изначально было пара параметров и разрослось.
export default class AdminPanel {
  #state: AdminState = {}
  #config!: AdminPanelConfig
  #panel!: HTMLElement
  #footer!: HTMLElement
  #adminPanelWindow!: HTMLDivElement
  #storage!: Storage

  #storeKeys: string[] = [STORAGE_KEYS.hints, STORAGE_KEYS.hintDarts, STORAGE_KEYS.hintCompass, STORAGE_KEYS.hasAdPass, STORAGE_KEYS.coins]

  constructor() {
    this.#init()
  }

  #init() {
    this.#storage = Locator.storage
    this.#config = this.#getConfig()

    this.#initState()
    this.#renderPanel()
    this.#renderComponents()
  }

  #getConfig = () => ({
    checkboxes: this.#getCheckboxConfig(),
    selects: this.#getSelectConfig(),
    numberInputs: this.#getNumberInputConfig(),
  })

  #getCheckboxConfig() {
    const {playerData} = this.#storage

    return [
      {
        key: DEBUG_KEY,
        label: 'debug:',
        value: LocalStorage.isDebug,
        tooltip: 'режим дебага, если он выключен то игнорируются остальные параметры дебага',
      },
      {key: STORAGE_KEYS.hasAdPass, label: 'AdPass:', value: playerData.hasAdPass, tooltip: 'куплен ли пропуск рекламы'},
    ]
  }

  #getSelectConfig() {
    return [
      {
        key: STORAGE_KEYS.levelIndex,
        label: 'Уровень',
        value: this.#storage.playerData.levelIndex,
        tooltip: 'выбор уровня',
      },
    ]
  }

  #getNumberInputConfig() {
    const {playerData} = this.#storage

    return [
      {
        key: STORAGE_KEYS.userLevel,
        label: 'userLevel',
        min: 1,
        max: 99999,
        value: playerData.userLevel,
        tooltip: 'установка уровня игрока',
      },
      {key: STORAGE_KEYS.hints, label: 'magnifiers', min: 0, max: 999, value: playerData.hints ?? 0, tooltip: 'лупы'},
      {key: STORAGE_KEYS.hintDarts, label: 'darts', min: 0, max: 999, value: playerData.hintDarts ?? 0, tooltip: 'дартс'},
      {key: STORAGE_KEYS.hintCompass, label: 'compass', min: 0, max: 999, value: playerData.hintCompass ?? 0, tooltip: 'компас'},
      {key: STORAGE_KEYS.coins, label: 'coins', min: 0, max: 99999, value: playerData.coins ?? 0, tooltip: 'игровая валюта'},
    ]
  }

  #initState() {
    this.#config.checkboxes.forEach((checkbox) => (this.#state[checkbox.key] = checkbox.value))
    this.#config.selects.forEach((select) => (this.#state[select.key] = select.value))
    this.#config.numberInputs.forEach((input) => (this.#state[input.key] = input.value))
  }

  #renderPanel = () => {
    this.#adminPanelWindow = document.createElement('div')
    this.#adminPanelWindow.className = 'admin-panel__bg'
    this.#adminPanelWindow.innerHTML = `
      <section class="admin-panel__window" role="dialog" aria-modal="true" aria-label="Admin">
        <header class="admin-panel__header">
          <h2>Admin</h2>
          <button class="admin-panel__close" type="button" aria-label="Закрыть"></button>
        </header>
        <div class="admin-panel__content"></div>
        <footer class="admin-panel__footer"></footer>
      </section>`
    document.body.append(this.#adminPanelWindow)

    this.#panel = this.#adminPanelWindow.querySelector<HTMLElement>('.admin-panel__content')!
    this.#footer = this.#adminPanelWindow.querySelector<HTMLElement>('.admin-panel__footer')!
    this.#adminPanelWindow.querySelector<HTMLElement>('.admin-panel__close')!.addEventListener('click', this.#destroy)
  }

  #renderComponents = () => {
    this.#renderDebugRow()
    this.#renderProgressGroup()
    this.#renderStoreGroup()
    this.#renderButtons()
    this.#renderInfoSection()
  }

  #renderDebugRow() {
    const row = document.createElement('label')
    row.className = 'admin-panel__debug-row'
    row.title = 'Режим отладки'
    row.innerHTML = `
      Debug
      <input type="checkbox" data-key="${DEBUG_KEY}" aria-label="Включить режим отладки" ${this.#state[DEBUG_KEY] ? 'checked' : ''}>
    `

    row.querySelector<HTMLInputElement>('input')!.addEventListener('change', this.#onCheckboxChange)
    this.#panel.append(row)
  }

  #renderProgressGroup() {
    const grid = createFieldsetGrid(this.#panel, 'Progress')
    const [levelData] = this.#config.selects

    grid.classList.add('admin-panel__fieldset-container--progress')
    grid.append(createSelectRow(levelData, this.#getLevelOptions(), this.#onSelectChange))

    this.#config.numberInputs
      .filter(({key}) => !this.#storeKeys.includes(key))
      .forEach((input) => grid.append(createNumberRow(input, this.#onNumberChange)))
  }

  #getLevelOptions(): SelectOption[] {
    const levels = Object.values(ABTest.getFilteredLevels()) as Array<{levelName: string}>

    return levels.map(({levelName}, index) => ({
      label: `${index + 1}. ${levelName}`,
      value: index,
    }))
  }

  #renderStoreGroup() {
    const grid = createFieldsetGrid(this.#panel, 'Store')
    grid.classList.add('admin-panel__fieldset-container--store')

    this.#config.checkboxes
      .filter(({key}) => this.#storeKeys.includes(key))
      .forEach((checkbox) => {
        const item = createCheckboxItem(checkbox, this.#onCheckboxChange)
        item.classList.add('admin-panel__fieldset-item--wide')
        grid.append(item)
      })

    this.#config.numberInputs
      .filter(({key}) => this.#storeKeys.includes(key))
      .forEach((input) => grid.append(createNumberItem(input, this.#onNumberChange)))
  }

  #renderButtons() {
    const row = document.createElement('div')
    row.className = 'admin-panel__row'

    const saveButton = createButton('Save', 'admin-panel__btn admin-panel__btn--save', this.#onSave)
    const resetButton = createButton('Hard Reset', 'admin-panel__btn admin-panel__btn--reset', this.#onHardReset)

    row.append(saveButton, resetButton)
    this.#footer.append(row)
  }

  #renderInfoSection = () => {
    const wrap = document.createElement('div')
    const list = document.createElement('div')
    wrap.className = 'admin-panel__hotkeys'
    list.className = 'admin-panel__hotkeys-list'
    ;['showPanel: 0', 'fastWin: 8', 'nextLevel: 9'].forEach((text) => {
      const item = document.createElement('p')
      item.className = 'admin-panel__hotkeys-item'
      item.textContent = text
      list.append(item)
    })

    wrap.append(list)
    this.#panel.append(wrap)
  }

  #onCheckboxChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement
    const key = input.dataset.key
    if (!key) return

    const checked = input.checked

    this.#state[key] = checked
    if (key === DEBUG_KEY) LocalStorage.isDebug = checked
  }

  #onSelectChange = (event: Event) => {
    const select = event.currentTarget as HTMLSelectElement
    const key = select.dataset.key
    if (!key) return

    this.#state[key] = Number(select.value)
  }

  #onNumberChange = (event: Event) => {
    const inputElement = event.currentTarget as HTMLInputElement
    const key = inputElement.dataset.key
    if (!key) return

    const value = inputElement.value.trim()
    const data = this.#config.numberInputs.find((input) => input.key === key)
    if (!data) return

    const min = data.min ?? 0
    const max = data.max ?? 9999

    this.#state[key] = value === '' ? 0 : Math.max(min, Math.min(max, Number(value)))
  }

  #onSave = () => {
    this.#applySettings({...this.#state})
  }

  #applySettings = (data: AdminState) => {
    delete data[DEBUG_KEY]

    const playerData = this.#storage.playerData
    Object.assign(playerData, data)

    this.#destroy()
    SdkManager.leaderboard.setScore(playerData.userLevel).catch((error: unknown) => console.log('[leaderboard.setScore]', error))
    this.#storage.save(true)

    Locator.game.app.stage.visible = false
    setTimeout(() => location.reload(), 500)
  }

  #onHardReset = () => {
    this.#storage.resetAllData()
    this.#destroy()
  }

  #destroy = () => {
    this.#adminPanelWindow?.remove()
  }
}
