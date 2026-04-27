import type { MerchantLinePriceInfo } from '#/api';

import dayjs from 'dayjs';

export type LinePriceRoomTarget = 'adult' | 'child' | 'elder';
export type LinePriceEditorMode = 'batch' | 'single';
export type LinePriceDateType = 1 | 2 | 3;

export interface LinePriceConsumeItem {
  name: string;
  price?: number;
}

export interface EditableLinePriceItem {
  base_childprice?: number;
  base_elderprice?: number;
  base_price?: number;
  bxinfo: LinePriceConsumeItem[];
  childprice?: number;
  date: string;
  elderprice?: number;
  id?: number;
  lineid?: number;
  price?: number;
  roomblance?: number;
  roomcount: LinePriceRoomTarget[];
  stock?: number;
  suitid?: number;
}

export type EditableLinePriceMap = Record<string, EditableLinePriceItem>;

export interface LinePriceSummary {
  dateCount: number;
  endDate: string;
  maxPrice?: number;
  minPrice?: number;
  startDate: string;
  totalStock: number;
}

export interface LinePriceEditorForm {
  base_childprice?: number;
  base_elderprice?: number;
  base_price?: number;
  bxinfo: LinePriceConsumeItem[];
  childprice?: number;
  date: string;
  dateDays: number[];
  dateType: LinePriceDateType;
  elderprice?: number;
  mode: LinePriceEditorMode;
  price?: number;
  rangedate: [string, string] | [];
  roomblance?: number;
  roomcount: LinePriceRoomTarget[];
  stock?: number;
  weeks: number[];
}

const ROOM_TARGETS: LinePriceRoomTarget[] = ['adult', 'elder', 'child'];

function normalizeNumericValue(value: number | string | undefined) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function normalizeRoomTargets(value: unknown): LinePriceRoomTarget[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is LinePriceRoomTarget =>
    ROOM_TARGETS.includes(String(item) as LinePriceRoomTarget),
  );
}

function normalizeConsumeItems(value: unknown): LinePriceConsumeItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      return {
        name: String(item?.name || '').trim(),
        price: normalizeNumericValue(item?.price),
      };
    })
    .filter((item) => item.name || item.price !== undefined);
}

export function sortLinePriceInfo(priceInfo: MerchantLinePriceInfo[] = []) {
  return [...priceInfo].sort((current, next) =>
    String(current.date || '').localeCompare(String(next.date || '')),
  );
}

export function sortEditableLinePriceItems(
  priceInfo: EditableLinePriceItem[] = [],
) {
  return [...priceInfo].sort((current, next) =>
    String(current.date || '').localeCompare(String(next.date || '')),
  );
}

export function normalizeLinePriceInfoItem(
  item: MerchantLinePriceInfo,
): EditableLinePriceItem {
  return {
    base_childprice: normalizeNumericValue(item.base_childprice),
    base_elderprice: normalizeNumericValue(item.base_elderprice),
    base_price: normalizeNumericValue(item.base_price),
    bxinfo: normalizeConsumeItems(item.bxinfo),
    childprice: normalizeNumericValue(item.childprice),
    date: item.date || '',
    elderprice: normalizeNumericValue(item.elderprice),
    id: item.id,
    lineid: item.lineid,
    price: normalizeNumericValue(item.price),
    roomblance: normalizeNumericValue(item.roomblance),
    roomcount: normalizeRoomTargets(item.roomcount),
    stock: normalizeNumericValue(item.stock),
    suitid: item.suitid,
  };
}

export function buildLinePriceMap(
  priceInfo: MerchantLinePriceInfo[] = [],
): EditableLinePriceMap {
  return sortLinePriceInfo(priceInfo).reduce<EditableLinePriceMap>(
    (result, item) => {
      result[item.date] = normalizeLinePriceInfoItem(item);
      return result;
    },
    {},
  );
}

export function createEmptyConsumeItem(): LinePriceConsumeItem {
  return {
    name: '',
    price: undefined,
  };
}

export function createPriceEditorForm(
  mode: LinePriceEditorMode,
): LinePriceEditorForm {
  return {
    base_childprice: undefined,
    base_elderprice: undefined,
    base_price: undefined,
    bxinfo: [],
    childprice: undefined,
    date: '',
    dateDays: [],
    dateType: 1,
    elderprice: undefined,
    mode,
    price: undefined,
    rangedate: [],
    roomblance: undefined,
    roomcount: [],
    stock: undefined,
    weeks: [],
  };
}

export function createPriceEditorFormByEntry(
  mode: LinePriceEditorMode,
  date = '',
  entry?: EditableLinePriceItem,
): LinePriceEditorForm {
  return {
    ...createPriceEditorForm(mode),
    base_childprice: entry?.base_childprice,
    base_elderprice: entry?.base_elderprice,
    base_price: entry?.base_price,
    bxinfo: entry?.bxinfo?.map((item) => ({ ...item })) || [],
    childprice: entry?.childprice,
    date,
    elderprice: entry?.elderprice,
    price: entry?.price,
    roomblance: entry?.roomblance,
    roomcount: [...(entry?.roomcount || [])],
    stock: entry?.stock,
  };
}

function buildMatchedDatesForRange(form: LinePriceEditorForm) {
  const [startDate, endDate] = form.rangedate;
  if (!startDate || !endDate) {
    throw new Error('请选择报价日期范围');
  }

  if (form.dateType === 2 && form.weeks.length === 0) {
    throw new Error('请选择要应用的星期');
  }
  if (form.dateType === 3 && form.dateDays.length === 0) {
    throw new Error('请选择要应用的日期号');
  }

  const dates: string[] = [];
  let cursor = dayjs(startDate);
  const end = dayjs(endDate);

  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    let matched = false;
    switch (form.dateType) {
      case 1: {
        matched = true;
        break;
      }
      case 2: {
        matched = form.weeks.includes(cursor.day());
        break;
      }
      case 3: {
        matched = form.dateDays.includes(cursor.date());
        break;
      }
    }

    if (matched) {
      dates.push(cursor.format('YYYY-MM-DD'));
    }
    cursor = cursor.add(1, 'day');
  }

  if (dates.length === 0) {
    throw new Error('当前筛选条件下没有匹配到任何日期');
  }

  return dates;
}

export function getMatchedDates(form: LinePriceEditorForm) {
  if (form.mode === 'single') {
    if (!form.date) {
      throw new Error('缺少报价日期');
    }
    return [form.date];
  }

  return buildMatchedDatesForRange(form);
}

function normalizeEditorConsumeItems(items: LinePriceConsumeItem[]) {
  return items
    .map((item) => ({
      name: item.name.trim(),
      price: normalizeNumericValue(item.price),
    }))
    .filter((item) => item.name || item.price !== undefined);
}

function validateEditorPayload(
  form: LinePriceEditorForm,
  matchedDates: string[],
) {
  if (matchedDates.length === 0) {
    throw new Error('没有可保存的日期');
  }
  if (form.stock === undefined || form.stock === null) {
    throw new Error('请填写库存');
  }
  if ((form.roomblance || 0) > 0 && form.roomcount.length === 0) {
    throw new Error('设置了单房差时，请选择参与计算的人群');
  }

  const consumeItems = normalizeEditorConsumeItems(form.bxinfo);
  const hasInvalidConsumeItem = form.bxinfo.some((item) => {
    const hasName = !!item.name.trim();
    const hasPrice = item.price !== undefined && item.price !== null;
    return hasName !== hasPrice;
  });

  if (hasInvalidConsumeItem) {
    throw new Error('必消项目请同时填写名称和价格');
  }

  return consumeItems;
}

function buildEditableLinePriceItem(
  date: string,
  form: LinePriceEditorForm,
): EditableLinePriceItem {
  return {
    base_childprice: normalizeNumericValue(form.base_childprice),
    base_elderprice: normalizeNumericValue(form.base_elderprice),
    base_price: normalizeNumericValue(form.base_price),
    bxinfo: normalizeEditorConsumeItems(form.bxinfo),
    childprice: normalizeNumericValue(form.childprice),
    date,
    elderprice: normalizeNumericValue(form.elderprice),
    price: normalizeNumericValue(form.price),
    roomblance: normalizeNumericValue(form.roomblance),
    roomcount: normalizeRoomTargets(form.roomcount),
    stock: normalizeNumericValue(form.stock),
  };
}

export function applyEditorFormToPriceMap(
  priceMap: EditableLinePriceMap,
  form: LinePriceEditorForm,
  action: 'remove' | 'upsert',
) {
  const matchedDates = getMatchedDates(form);

  if (action === 'upsert') {
    validateEditorPayload(form, matchedDates);
  }

  const nextMap: EditableLinePriceMap = Object.fromEntries(
    Object.entries(priceMap).map(([date, item]) => {
      return [
        date,
        {
          ...item,
          bxinfo: item.bxinfo.map((consumeItem) => ({ ...consumeItem })),
          roomcount: [...item.roomcount],
        },
      ];
    }),
  );

  matchedDates.forEach((date) => {
    if (action === 'remove') {
      delete nextMap[date];
      return;
    }

    const currentItem = nextMap[date];
    const nextItem = buildEditableLinePriceItem(date, form);
    nextMap[date] = {
      ...currentItem,
      ...nextItem,
      date,
      bxinfo: nextItem.bxinfo.map((item) => ({ ...item })),
      roomcount: [...nextItem.roomcount],
    };
  });

  return {
    matchedDates,
    nextMap,
  };
}

export function serializeLinePriceMap(priceMap: EditableLinePriceMap) {
  const sortedItems = sortEditableLinePriceItems(Object.values(priceMap));
  if (sortedItems.length === 0) {
    throw new Error('请至少保留一条价格日期');
  }

  return sortedItems.map((item) => {
    if (!item.date) {
      throw new Error('存在缺少日期的价格条目');
    }
    if (item.stock === undefined || item.stock === null) {
      throw new Error(`请填写 ${item.date} 的库存`);
    }
    if ((item.roomblance || 0) > 0 && item.roomcount.length === 0) {
      throw new Error(`请为 ${item.date} 选择参与单房差计算的人群`);
    }

    const hasInvalidConsumeItem = item.bxinfo.some((consumeItem) => {
      const hasName = !!consumeItem.name.trim();
      const hasPrice =
        consumeItem.price !== undefined && consumeItem.price !== null;
      return hasName !== hasPrice;
    });

    if (hasInvalidConsumeItem) {
      throw new Error(`请完整填写 ${item.date} 的必消项目`);
    }

    return {
      base_childprice:
        item.base_childprice === undefined ? '' : String(item.base_childprice),
      base_elderprice:
        item.base_elderprice === undefined ? '' : String(item.base_elderprice),
      base_price: item.base_price === undefined ? '' : String(item.base_price),
      bxinfo: item.bxinfo
        .filter((consumeItem) => consumeItem.name.trim())
        .map((consumeItem) => ({
          name: consumeItem.name.trim(),
          price:
            consumeItem.price === undefined ? '' : String(consumeItem.price),
        })),
      childprice:
        item.childprice === undefined ? '' : String(item.childprice),
      date: item.date,
      elderprice:
        item.elderprice === undefined ? '' : String(item.elderprice),
      id: item.id,
      lineid: item.lineid,
      price: item.price === undefined ? '' : String(item.price),
      roomblance:
        item.roomblance === undefined ? '' : String(item.roomblance),
      roomcount: [...item.roomcount],
      stock: String(item.stock),
      suitid: item.suitid,
    };
  });
}

export function buildLinePriceSummary(
  priceInfo: EditableLinePriceItem[] = [],
): LinePriceSummary {
  const sortedPriceInfo = sortEditableLinePriceItems(priceInfo);
  const prices = sortedPriceInfo
    .map((item) => normalizeNumericValue(item.price))
    .filter((item): item is number => item !== undefined);

  return {
    dateCount: sortedPriceInfo.length,
    endDate: sortedPriceInfo.at(-1)?.date || '',
    maxPrice: prices.length > 0 ? Math.max(...prices) : undefined,
    minPrice: prices.length > 0 ? Math.min(...prices) : undefined,
    startDate: sortedPriceInfo[0]?.date || '',
    totalStock: sortedPriceInfo.reduce(
      (total, item) => total + (normalizeNumericValue(item.stock) || 0),
      0,
    ),
  };
}

export function buildLinePriceSummaryFromMap(priceMap: EditableLinePriceMap) {
  return buildLinePriceSummary(Object.values(priceMap));
}

export function formatLinePriceValue(value: number | string | undefined) {
  if (value === '' || value === null || value === undefined) {
    return '-';
  }

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    return String(value);
  }

  if (Number.isInteger(parsedValue)) {
    return String(parsedValue);
  }

  return parsedValue.toFixed(2).replace(/\.?0+$/, '');
}

export function formatLinePriceRange(summary: LinePriceSummary) {
  if (summary.minPrice === undefined || summary.maxPrice === undefined) {
    return '-';
  }

  if (summary.minPrice === summary.maxPrice) {
    return `￥${formatLinePriceValue(summary.minPrice)}`;
  }

  return `￥${formatLinePriceValue(summary.minPrice)} ~ ￥${formatLinePriceValue(summary.maxPrice)}`;
}

export function formatLineDateRange(summary: LinePriceSummary) {
  if (!summary.startDate || !summary.endDate) {
    return '-';
  }

  if (summary.startDate === summary.endDate) {
    return summary.startDate;
  }

  return `${summary.startDate} ~ ${summary.endDate}`;
}

export function formatRuleCount(value: unknown[] | undefined) {
  if (!value || value.length === 0) {
    return '-';
  }

  return `${value.length} 项`;
}

export const LINE_PRICE_WEEK_OPTIONS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 },
];

export const LINE_PRICE_MONTH_DAY_OPTIONS = Array.from(
  { length: 31 },
  (_, index) => index + 1,
);

export const LINE_PRICE_ROOM_TARGET_OPTIONS = [
  { label: '成人', value: 'adult' },
  { label: '老人', value: 'elder' },
  { label: '儿童', value: 'child' },
] as const;
