import {
  AtlasAttachmentLoader,
  type Attachment,
  type Bone,
  MeshAttachment,
  Physics,
  RegionAttachment,
  SkeletonJson,
  type Slot,
  Spine,
  SpineTexture,
  TextureAtlas,
} from '@esotericsoftware/spine-pixi-v8'
import {gsap} from 'gsap'
import {Assets, Container, Matrix, Mesh, MeshGeometry, Point, type Texture} from 'pixi.js'
import {ASSETS_URL, WORLD} from '@/game/config/constants.ts'
import LocalStorage from '@/game/engine/storage/LocalStorage.ts'
import LoadUtils from '@/game/utils/gameUtils/LoadUtils.ts'

type SpineOptions = {
  spineName?: string
  scale?: number
  speed?: number
  duration?: number
  loop?: boolean
  skinName?: string
  animationName?: string
  autorun?: boolean
  freeze?: boolean
  forceFirstFrame?: boolean
}

type SpineAsset = {
  name: string
  atlas: string
  json: string | Record<string, unknown>
}

type SlotMesh = Mesh & {
  attachment: RegionAttachment | MeshAttachment
  slot: Slot
}

type SlotView = {
  container: Container
  sprite: SlotMesh
}

type SlotSearchConfig = {
  spineName: string
  hogItemsBone: string
}

type SpineAssetOptions = {
  spineName: string
  folderPath?: string
  exists?: string
  basePath?: string
}

type TestSpineOptions = Omit<SpineAssetOptions, 'basePath'> & {
  loop?: boolean
  animationName?: string
}

type SlotDisplayItem = {
  sprite: Container
  isMesh: boolean
}

type PositionLogTarget = Container & {
  sprite: Container
  isMesh: boolean
}

const slotViews = new WeakMap<Spine, Map<Slot, SlotView>>()

export default class SpineUtils {
  static getAttachment = (slot: Slot): Attachment | null => slot?.getAppliedPose().getAttachment() ?? null

  static getExistingSlotView = (spine: Spine, slot: Slot) => slotViews.get(spine)?.get(slot) ?? null

  static getSlotView = (spine: Spine, slot: Slot) => {
    let views = slotViews.get(spine)
    if (!views) {
      views = new Map()
      slotViews.set(spine, views)
    }

    const existing = views.get(slot)
    if (existing) return existing

    const attachment = SpineUtils.getAttachment(slot)
    if (!(attachment instanceof RegionAttachment || attachment instanceof MeshAttachment)) return null

    const pose = slot.getAppliedPose()
    const sequenceIndex = attachment.sequence.resolveIndex(pose)
    const texture = attachment.sequence.regions[sequenceIndex]?.texture?.texture
    if (!texture) return null

    const worldVertices = new Float32Array(attachment instanceof RegionAttachment ? 8 : attachment.worldVerticesLength)

    if (attachment instanceof RegionAttachment) {
      attachment.computeWorldVertices(slot, attachment.getOffsets(pose), worldVertices, 0, 2)
    } else {
      attachment.computeWorldVertices(spine.skeleton, slot, 0, attachment.worldVerticesLength, worldVertices, 0, 2)
    }

    const bone = slot.bone.getAppliedPose()
    const boneMatrix = new Matrix(bone.a, bone.c, -bone.b, -bone.d, bone.worldX, bone.worldY)
    const positions = new Float32Array(worldVertices.length)
    const point = new Point()

    for (let i = 0; i < worldVertices.length; i += 2) {
      point.set(worldVertices[i], worldVertices[i + 1])
      boneMatrix.applyInverse(point, point)
      positions[i] = point.x
      positions[i + 1] = point.y
    }

    const indices = attachment instanceof RegionAttachment ? new Uint32Array([0, 1, 2, 0, 2, 3]) : new Uint32Array(attachment.triangles)

    const geometry = new MeshGeometry({
      positions,
      uvs: new Float32Array(attachment.sequence.getUVs(sequenceIndex)),
      indices,
      topology: 'triangle-list',
    })

    const mesh = new Mesh({label: `slot-mesh:${slot.data.name}`, geometry, texture}) as SlotMesh
    const color = attachment.color
    mesh.tint = (Math.round(color.r * 255) << 16) | (Math.round(color.g * 255) << 8) | Math.round(color.b * 255)
    mesh.alpha = color.a
    mesh.attachment = attachment
    mesh.slot = slot

    const slotContainer = new Container({label: `slot:${slot.data.name}`})
    slotContainer.addChild(mesh)
    spine.addSlotObject(slot, slotContainer, {followSlotColor: true})

    /** Рантайм v8 сам рисует аттачменты, поэтому в слоте остаётся их прозрачная копия. */
    const hiddenAttachment = attachment.copy() as typeof attachment
    hiddenAttachment.color.a = 0
    slot.getPose().setAttachment(hiddenAttachment)
    slot.getAppliedPose().setAttachment(hiddenAttachment)

    const view = {container: slotContainer, sprite: mesh}
    views.set(slot, view)
    return view
  }

  static getSlotsRecursively = (spine: Spine, boneName: string) => {
    // Проверка: Скелет должен быть доступен
    if (!spine?.skeleton) {
      console.error('[SpineUtils getSlotsRecursively]: skeleton is missing from spineLevelComponent')
      return []
    }

    const hogItemsBone = spine.skeleton.findBone(boneName)
    if (!hogItemsBone) {
      if (boneName === 'idle') return [] // не критично, что нет idle кости

      // console.warn(`[SpineUtils getSlotsRecursively] Кость с именем ${boneName} не найдена`)
      return []
    }

    const collectSlots = (bone: Bone | null): Slot[] => {
      if (!bone) {
        console.warn('[SpineUtils getSlotsRecursively] Пустая кость передана в рекурсию')
        return []
      }

      // Собираем все слоты, связанные с текущей костью
      const slots = spine.skeleton.slots.filter((slot) => slot.bone === bone)

      // Проверка: У кости могут отсутствовать дочерние кости
      const childBones = bone.children || []
      if (!Array.isArray(childBones)) {
        console.warn(`[SpineUtils collectSlots] У кости ${bone.data?.name} нет массива дочерних костей`)
      }

      // Рекурсивно обрабатываем детей
      childBones.forEach((childBone) => {
        slots.push(...collectSlots(childBone))
      })

      return slots
    }

    const allSlots = collectSlots(hogItemsBone)

    // Фильтруем слоты с валидными аттачментами
    return allSlots.filter((slot) => {
      if (slot.getAppliedPose().getAttachment() === null) {
        // console.log(slotName, 'empty')
        return false
      }
      return true
    })
  }

  static findSlots = (spine: Spine, config: SlotSearchConfig, currentSkinName = 'default') => {
    const {spineName} = config

    const hogItemsBone = spine.skeleton.findBone(config.hogItemsBone)
    if (!hogItemsBone) {
      console.error(`[SpineUtils findSlots]: bone ${config.hogItemsBone} not found
          spineName:${spineName}
          skin: ${currentSkinName}`)
      return
    }

    const slots = spine.skeleton.slots.filter((slot) => slot.bone === hogItemsBone)

    // доп.проверка на случай если в слоте нет картинки (по ошибке дизайнера)
    return slots.filter((slot) => {
      const attachment = slot.getAppliedPose().getAttachment()

      if (!attachment?.name) {
        // на 0 уровне игнорируем ошибки стандартного оформления, т.к там 5 слотов выключены
        if (spineName === 'level0' && currentSkinName === 'mode1/skin_mode1_v1') return

        console.error(`[SpineUtils findSlots]: no sprite found in slot ${slot?.data?.name}:
          spineName:${spineName}
          skin: ${currentSkinName}`)
        return
      }
      if (attachment.name) return slot
    })
  }

  static findBone = (spine: Spine, boneName: string) => {
    return spine.skeleton.findBone(boneName)
  }

  // todo - вынести в класс
  static createSpine = (props: SpineOptions = {}) => {
    const {
      spineName,
      scale = 1,
      speed = 1,
      duration = 1,
      loop = false,
      skinName = 'default',
      animationName = 'animation',
      autorun = false,
      freeze = false,
      forceFirstFrame = false, // Если нужно применить первый кадр анимации
    } = props

    const spineData = Assets.get(`${spineName}.spineData`)

    if (!spineData) {
      console.error(`Spine data for ${spineName} not found`)
      return
    }

    const spine = new Spine(spineData)
    spine.scale.set(scale)
    spine.state.timeScale = speed

    try {
      spine.skeleton.setSkin(skinName)
    } catch (e) {
      console.error('[createSpine]', e)

      // todo Временное поведение - применить дефолтный скин в случае ошибки.
      const skin = spine.skeleton.data.findSkin(skinName) ?? spine.skeleton.data.defaultSkin ?? spine.skeleton.data.skins[0]

      if (skin) {
        spine.skeleton.setSkin(skin)
        spine.skeleton.setupPoseSlots()
      }
    }

    const animation = spine.skeleton.data.findAnimation(animationName)
    let trackEntry

    if (autorun || forceFirstFrame) {
      if (animation) {
        trackEntry = spine.state.setAnimation(0, animationName, loop)
      } else {
        console.warn(`Animation "${animationName}" not found in spine "${spineName}"`)
      }
    }

    if (autorun && trackEntry) {
      trackEntry.animationEnd = trackEntry.animationEnd * duration
    }

    if (forceFirstFrame && animation) {
      spine.update(0)
      if (!autorun) spine.state.clearTrack(0)
    }

    // --- Отключаем всё лишнее для статики ---
    if (freeze) SpineUtils.freezeSpine(spine)

    return spine
  }

  static freezeSpine(spine: Spine) {
    if (LocalStorage.isDebug) return

    spine.state.clearTracks()
    spine.state.timeScale = 0
    spine.autoUpdate = false
  }

  static spineParser = (spines: Iterable<SpineAsset>, exists = 'webp') => {
    try {
      Array.from(spines).forEach((spine) => {
        const {name, atlas, json} = spine

        // console.log(name, atlas, json)

        const spineAtlas = new TextureAtlas(atlas)

        spineAtlas.pages.forEach((page) => {
          const textureName = page.name.replace(`.${exists}`, '').trim()
          const texture = Assets.get(textureName) as Texture | undefined

          if (!texture?.source) {
            throw new Error(`Texture "${textureName}" for spine "${name}" not found`)
          }

          page.setTexture(SpineTexture.from(texture.source))
        })

        const spineAtlasLoader = new AtlasAttachmentLoader(spineAtlas)
        const spineJsonParser = new SkeletonJson(spineAtlasLoader)

        Assets.cache.set(`${name}.spineData`, spineJsonParser.readSkeletonData(json))
      })
    } catch (e) {
      console.error('[spineParser]', e)
    }
  }

  static getSlotSpritePosition = (hogItem: SlotDisplayItem) => {
    const {sprite} = hogItem

    if (!hogItem.isMesh) {
      return {
        x: sprite.x,
        y: Math.abs(sprite.y),
      }
    } else {
      const {x, y, width, height} = sprite.getLocalBounds()
      return {
        x: x + width / 2,
        y: y + height / 2,
      }
    }
  }

  static positionLog = (target: PositionLogTarget) => {
    const sprite = target.sprite
    const bounds = sprite.getLocalBounds()

    console.log('isMesh', target.isMesh)
    console.warn('target', target.width, '/', target.height, 'pos', target.position.x, '*', target.position.y)
    console.warn('sprite', sprite.width, '/', sprite.height, 'pos', sprite.position.x, '*', sprite.position.y)
    console.warn('bounds', bounds.width, '/', bounds.width, 'pos', bounds.x, '*', bounds.y)
  }

  // осторожно, нужно выгружать данные Assets.load!
  static loadAndParseSpineAsset = async ({
    spineName,
    folderPath = 'spines',
    exists = 'webp',
    basePath = ASSETS_URL.local,
  }: SpineAssetOptions) => {
    const jsonUrl = `${basePath}assets/${folderPath}/${spineName}.json`
    const atlasUrl = `${basePath}assets/${folderPath}/${spineName}.atlas`

    const json = await LoadUtils.loadJson(jsonUrl)
    const atlas = await LoadUtils.loadAtlas(atlasUrl)

    // Находит все упоминания текстур в атласе (level3, level3_2, level3_3)
    const atlasLines = atlas
      .split('\n')
      .filter((line) => line.includes(`.${exists}`))
      .map((line) => line.trim())

    // Загружает все текстуры, найденные в атласе
    await Promise.all(
      atlasLines.map((line) => {
        const spriteSheetUrl = LoadUtils.forceFreshCache(`${basePath}assets/${folderPath}/${line}`)
        const alias = line.replace(`.${exists}`, '').trim()

        return Assets.load({alias, src: spriteSheetUrl})
      }),
    )

    const assets = {
      name: `${spineName}`,
      json,
      atlas,
    }

    SpineUtils.spineParser([assets], exists)
  }

  // SpineUtils.ts
  static createTestSpine = async ({
    spineName,
    folderPath = 'spines',
    loop = true,
    exists = 'png',
    animationName = 'animation',
  }: TestSpineOptions) => {
    await SpineUtils.loadAndParseSpineAsset({spineName, folderPath, exists})

    const spine = SpineUtils.createSpine({spineName, animationName, autorun: true, loop})

    if (!spine) {
      throw new Error(`Failed to create spine "${spineName}"`)
    }

    spine.position.set(WORLD.HALF_W, WORLD.HALF_H)

    return spine
  }

  static checkoutSkin = (spine: Spine, skinName: string) => {
    if (!spine?.skeleton) {
      console.error('[SpineUtils checkoutSkin]: skeleton not found')
      return
    }

    const skeleton = spine.skeleton
    const skin = skeleton.data.findSkin(skinName)

    if (!skin) {
      console.error(`[SpineUtils checkoutSkin]: skin "${skinName}" not found in skeleton.data`)
      return
    }

    skeleton.setSkin(skin)
    skeleton.setupPoseSlots()
    skeleton.updateWorldTransform(Physics.update)
  }

  static destroySpine = (spine: Spine, spineName?: string) => {
    try {
      spine.state.setEmptyAnimations(0)
      spine.state.clearListeners()
      spine.state.clearTracks()
      spine.destroy()

      if (spineName) {
        Assets.cache.remove(`${spineName}.spineData`)
      }
    } catch (err) {
      console.error('destroySpine', err)
    }
  }

  static destroyLevelAssets = async (atlasLines: string[]) => {
    const promises: Promise<void>[] = []

    atlasLines.forEach((line) => {
      const alias = line.replace(`.webp`, '').trim()
      promises.push(Assets.unload(alias))
    })

    await Promise.all(promises)
  }

  static hideAndDestroySpine = async (spine: Spine) => {
    const destroy = () => {
      try {
        spine.destroy()
      } catch (err) {
        spine.visible = false
        console.log('[hideAndDestroySpine]', err)
      }
    }

    await gsap.to(spine, {alpha: 0})
    destroy()
  }
}
