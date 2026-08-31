# Catch Master

<p align="center">
  <a href="https://westerovs.github.io/catch-master/">
    <img src="https://img.shields.io/badge/▶%20PLAY%20GAME-Catch%20Master-2ea44f?style=for-the-badge" alt="Play Catch Master">
  </a>
</p>

### Запуск dev:

```bash
npm start
```

## Устройство игрового уровня

Игровая логика уровня построена на ECS: сущности состоят из компонентов с данными, а системы находят нужные компоненты и изменяют их каждый кадр.

### Основные части ECS

- [`LevelRuntime`](src/game/levelRuntime/LevelRuntime.ts) создаёт сущности и системы, подключает их к игровому циклу и полностью очищает при завершении уровня.
- [`Entity`](src/game/levelRuntime/core/Entity.ts) — идентификатор и набор компонентов конкретного игрового объекта.
- [`EntityManager`](src/game/levelRuntime/core/EntityManager.ts) создаёт, удаляет и ищет сущности по компонентам.
- [`System`](src/game/levelRuntime/core/System.ts) — базовый класс игровой системы.
- [`SystemManager`](src/game/levelRuntime/core/SystemManager.ts) запускает системы в заданном порядке каждый кадр.

```text
levelRuntime/
├── core/                 Entity, EntityManager, System, SystemManager
├── basket/               компоненты и анимация корзины
├── drop/                 создание, ловля и удаление падающих предметов
├── features/             дополнительные механики предметов
└── mechanics/
    ├── movement/         позиция, скорость и перемещение
    ├── pointerControl/   управление корзиной
    ├── rendering/        создание и синхронизация PixiJS-объектов
    └── rotation/         вращение сущностей
```

### Сущности и компоненты

| Сущность       | Основные компоненты                                                                  | Назначение                                           |
| -------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `basket`       | `PositionComponent`, `SpriteComponent`, `PointerControlComponent`, `BasketComponent` | Корзина игрока, её позиция, отображение и управление |
| `drop-spawner` | `DropSpawnerComponent`                                                               | Интервал создания падающих предметов                 |
| `drop-*`       | `PositionComponent`, `VelocityComponent`, `SpriteComponent`, `DropComponent`         | Падающий предмет и его игровые параметры             |

### Системы уровня

```text
PointerControlSystem  → задаёт движение корзины к указателю
DropSpawnSystem       → создаёт падающие предметы
MovementSystem        → изменяет позицию по скорости
DropBoundsSystem      → удерживает предметы в игровых границах
DropCatchSystem       → определяет попадание предмета в корзину
DespawnSystem         → удаляет упавшие предметы
RotationSystem        → вращает предметы
RenderSystem          → синхронизирует ECS с PixiJS-сценой
```

`SystemManager` вызывает системы последовательно. Поэтому ввод сначала обновляет корзину, затем выполняются игровые расчёты, а `RenderSystem` последним переносит итоговые координаты в PixiJS.

## Фичи

### Зигзагообразное движение предметов

Некоторые предметы падают не по прямой, а движутся по синусоиде. Фича полностью собрана из отдельных частей ECS:

```text
gameplayConfig
    → DropSpawnSystem добавляет ZigzagComponent
    → ZigzagSystem изменяет PositionComponent.x
    → RenderSystem переносит позицию в PixiJS
```

- Список предметов и параметры движения находятся в [`gameplayConfig.ts`](src/game/levelRuntime/gameplayConfig.ts).
- [`ZigzagComponent.ts`](src/game/levelRuntime/features/zigzag/ZigzagComponent.ts) хранит центр траектории, амплитуду, длину волны и случайную начальную фазу.
- [`ZigzagSystem.ts`](src/game/levelRuntime/features/zigzag/ZigzagSystem.ts) запускается после обычного вертикального перемещения и рассчитывает горизонтальную позицию предмета.
- Амплитуда автоматически ограничивается шириной игровой области, поэтому предмет не выходит за края экрана.

## Таймер, счёт и очки

Эти классы относятся к уровню, но не являются ECS-компонентами. Их создаёт и связывает [`Level`](src/game/states/stateLevel/Level.ts).

| Часть               | Файл                                                                         | Ответственность                                                       |
| ------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Таймер раунда       | [`LevelTimer.ts`](src/game/components/levelComponents/LevelTimer.ts)         | Ведёт обратный отсчёт и отправляет событие завершения времени         |
| Отображение таймера | [`LevelTimerView.ts`](src/game/components/levelComponents/LevelTimerView.ts) | Показывает оставшееся время                                           |
| Подсчёт очков       | [`LevelScore.ts`](src/game/components/levelComponents/LevelScore.ts)         | Получает события пойманных предметов и рассчитывает текущий результат |
| Счётчик на экране   | [`LevelCounter.ts`](src/game/components/levelComponents/LevelCounter.ts)     | Отображает текущее количество очков                                   |

Поток обновления очков:

```text
DropCatchSystem
    → GAME_EVENTS.LEVEL.dropCaught
    → LevelScore
    → LevelCounter.setScore()
```

## Сложность уровней

Настройки находятся в [`levelDifficulty.ts`](src/game/config/levelDifficulty.ts). Сложность выбирается по номеру уровня и повторяется циклом:

```text
обычный → hard → veryHard → extreme → обычный → ...
```

| Сложность | Интервал появления | Скорость падения | Вес вредного предмета |
| --------- | -----------------: | ---------------: | --------------------: |
| Обычный   |            1000 мс |             ×1.0 |                    ×1 |
| Hard      |             900 мс |             ×1.1 |                    ×1 |
| Very Hard |             800 мс |             ×1.2 |                    ×2 |
| Extreme   |             700 мс |             ×1.3 |                    ×3 |

Один профиль одновременно определяет бейдж следующего уровня, частоту появления предметов, скорость падения и вероятность выбора гриба.
