import type { GardenState, Plant } from '../types'
import { DAY, dateKey } from './garden'

export function sampleGarden(base = Date.now()): GardenState {
  const plants: Plant[] = [
    {
      id: base + 1,
      title: '从零开始学 Blender 建模',
      link: 'https://www.bilibili.com/video/BV1sample001',
      bvid: 'BV1sample001',
      addedAt: base - 12 * DAY,
      watchedAt: null,
      progress: 35,
      plannedFor: base,
    },
    {
      id: base + 2,
      title: '《三体》动画解说合集（共 8 集）',
      link: 'https://www.bilibili.com/video/BV1sample002',
      bvid: 'BV1sample002',
      addedAt: base - 9 * DAY,
      watchedAt: null,
      progress: 60,
      plannedFor: base + DAY,
    },
    {
      id: base + 3,
      title: '30 分钟搞懂 Transformer 注意力机制',
      link: 'https://www.bilibili.com/video/BV1sample003',
      bvid: 'BV1sample003',
      addedAt: base - 5 * DAY,
      watchedAt: null,
      progress: 20,
      plannedFor: base + 2 * DAY,
    },
    {
      id: base + 4,
      title: '宿舍党也能做的 5 道快手菜',
      link: 'https://www.bilibili.com/video/BV1sample004',
      bvid: 'BV1sample004',
      addedAt: base - DAY,
      watchedAt: null,
    },
    {
      id: base + 5,
      title: '用 Figma 做一套产品原型',
      link: 'https://www.bilibili.com/video/BV1sample005',
      bvid: 'BV1sample005',
      addedAt: base - 6 * DAY,
      watchedAt: base - DAY,
      progress: 100,
    },
    {
      id: base + 6,
      title: 'React 动画交互小课',
      link: 'https://www.bilibili.com/video/BV1sample006',
      bvid: 'BV1sample006',
      addedAt: base - 4 * DAY,
      watchedAt: base - 2 * DAY,
      progress: 100,
    },
    {
      id: base + 7,
      title: '一小时整理收藏夹工作流',
      link: 'https://www.bilibili.com/video/BV1sample007',
      bvid: 'BV1sample007',
      addedAt: base - 2 * DAY,
      watchedAt: base,
      progress: 100,
    },
  ]

  return {
    plants,
    xp: 95,
    demoOffset: 0,
    reminders: { enabled: false, lastNotifiedOn: null },
    streak: { count: 3, lastDoneOn: dateKey(base) },
  }
}
