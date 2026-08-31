type FieldData = {
  key: string
  label: string
  value: string | number | boolean
  tooltip?: string
  disabled?: boolean
  min?: number
  max?: number
}

type SelectOption = {
  label: string
  value: string | number
}

type ChangeHandler = (event: Event) => void

const createFieldsetGrid = (panel: HTMLElement, title: string) => {
  const fieldset = document.createElement('fieldset')
  fieldset.className = 'admin-panel__fieldset'

  const legend = document.createElement('legend')
  legend.innerText = title
  fieldset.appendChild(legend)

  const grid = document.createElement('div')
  grid.className = 'admin-panel__fieldset-container'

  fieldset.appendChild(grid)
  panel.appendChild(fieldset)

  return grid
}

const createCheckboxRow = (data: FieldData, onChange: ChangeHandler) => {
  const row = document.createElement('div')
  row.className = 'admin-panel__row'

  row.innerHTML = `
  <label for="cb_${data.key}"${data.tooltip ? ` title="${data.tooltip}"` : ''}>${data.label}</label>
  <input id="cb_${data.key}" type="checkbox" ${data.value ? 'checked' : ''} ${data.disabled ? 'disabled' : ''}>
`

  const input = row.querySelector<HTMLInputElement>('input')!
  input.dataset.key = data.key
  input.addEventListener('change', onChange)

  return row
}

const createCheckboxItem = (data: FieldData, onChange: ChangeHandler) => {
  const item = document.createElement('div')
  item.className = 'admin-panel__fieldset-item'

  item.innerHTML = `
  <label for="cb_${data.key}"${data.tooltip ? ` title="${data.tooltip}"` : ''}>${data.label}</label>
  <input id="cb_${data.key}" type="checkbox" ${data.value ? 'checked' : ''} ${data.disabled ? 'disabled' : ''}>
`

  const input = item.querySelector<HTMLInputElement>('input')!
  input.dataset.key = data.key
  input.addEventListener('change', onChange)

  return item
}

const createNumberItem = (data: FieldData, onChange: ChangeHandler) => {
  const item = document.createElement('div')
  item.className = 'admin-panel__fieldset-item--store'

  item.innerHTML = `
    <label for="num_${data.key}"${data.tooltip ? ` title="${data.tooltip}"` : ''}>${data.label}</label>
    <input
      id="num_${data.key}"
      type="number"
      class="admin-panel__input"
      inputmode="numeric"
      min="${data.min ?? 0}"
      max="${data.max ?? 9999}"
      value="${data.value}"
      ${data.disabled ? 'disabled' : ''}
    >
  `

  const input = item.querySelector<HTMLInputElement>('input')!
  input.dataset.key = data.key
  input.addEventListener('input', onChange)

  return item
}

const createNumberRow = (data: FieldData, onChange: ChangeHandler) => {
  const row = document.createElement('div')
  row.className = 'admin-panel__row'

  row.innerHTML = `
    <label for="num_${data.key}"${data.tooltip ? ` title="${data.tooltip}"` : ''}>${data.label}</label>
    <input
      id="num_${data.key}"
      type="number"
      class="admin-panel__input"
      inputmode="numeric"
      min="${data.min ?? 0}"
      max="${data.max ?? 9999}"
      value="${data.value}"
      ${data.disabled ? 'disabled' : ''}
    >
  `

  const input = row.querySelector<HTMLInputElement>('input')!
  input.dataset.key = data.key
  input.addEventListener('input', onChange)

  return row
}

const createSelectRow = (data: FieldData, options: SelectOption[], onChange: ChangeHandler) => {
  const row = document.createElement('div')
  row.className = 'admin-panel__row'

  const opts = options.map((o) => `<option value="${o.value}" ${o.value === data.value ? 'selected' : ''}>${o.label}</option>`).join('')

  row.innerHTML = `
    <label for="sel_${data.key}"${data.tooltip ? ` title="${data.tooltip}"` : ''}>${data.label}</label>
    <select id="sel_${data.key}" class="admin-panel__select" ${data.disabled ? 'disabled' : ''}>${opts}</select>
  `

  const select = row.querySelector<HTMLSelectElement>('select')!
  select.dataset.key = data.key
  select.addEventListener('change', onChange)

  return row
}

const createButton = (text: string, className: string, onClick: (event: MouseEvent) => void) => {
  const btn = document.createElement('button')
  btn.className = className
  btn.innerText = text
  btn.addEventListener('click', onClick, {once: true})
  return btn
}

export {createButton, createCheckboxItem, createCheckboxRow, createFieldsetGrid, createNumberItem, createNumberRow, createSelectRow}

export type {FieldData, SelectOption}
