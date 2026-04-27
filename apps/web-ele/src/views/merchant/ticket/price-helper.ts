import type { MerchantTicketPriceInfo } from '#/api';

import dayjs from 'dayjs';

export type TicketPriceEditorMode = 'batch' | 'single';
export type TicketPriceDateType = 1 | 2 | 3;

export interface EditableTicketPriceItem {
  base_price?: number;
  date: string;
  id?: number;
  price?: number;
  stock?: number;
  suit_id?: number;
  ticket_id?: number;
}

export type EditableTicketPriceMap = Record<string, EditableTicketPriceItem>;

export interface TicketPriceSummary {
  dateCount: number;
  endDate: string;
  maxPrice?: number;
  minPrice?: number;
  startDate: string;
}

export interface TicketPriceEditorForm {
  base_price?: number;
  date: string;
  dateDays: number[];
  dateType: TicketPriceDateType;
  mode: TicketPriceEditorMode;
  price?: number;
  rangedate: [string, string] | [];
  stock?: number;
  weeks: number[];
}

function normalizeNumericValue(value: number | string | undefined) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

export function sortTicketPriceInfo(priceInfo: MerchantTicketPriceInfo[] = []) {
  return [...priceInfo].sort((current, next) =>
    String(current.date || '').localeCompare(String(next.date || '')),
  );
}

export function sortEditableTicketPriceItems(
  priceInfo: EditableTicketPriceItem[] = [],
) {
  return [...priceInfo].sort((current, next) =>
    String(current.date || '').localeCompare(String(next.date || '')),
  );
}

export function normalizeTicketPriceInfoItem(
  item: MerchantTicketPriceInfo,
): EditableTicketPriceItem {
  return {
    base_price: normalizeNumericValue(item.base_price),
    date: item.date || '',
    id: item.id,
    price: normalizeNumericValue(item.price),
    stock: normalizeNumericValue(item.stock),
    suit_id: item.suit_id,
    ticket_id: item.ticket_id,
  };
}

export function buildTicketPriceMap(
  priceInfo: MerchantTicketPriceInfo[] = [],
): EditableTicketPriceMap {
  return sortTicketPriceInfo(priceInfo).reduce<EditableTicketPriceMap>(
    (result, item) => {
      result[item.date] = normalizeTicketPriceInfoItem(item);
      return result;
    },
    {},
  );
}

export function createTicketPriceEditorForm(
  mode: TicketPriceEditorMode,
): TicketPriceEditorForm {
  return {
    base_price: undefined,
    date: '',
    dateDays: [],
    dateType: 1,
    mode,
    price: undefined,
    rangedate: [],
    stock: undefined,
    weeks: [],
  };
}

export function createTicketPriceEditorFormByEntry(
  mode: TicketPriceEditorMode,
  date = '',
  entry?: EditableTicketPriceItem,
): TicketPriceEditorForm {
  return {
    ...createTicketPriceEditorForm(mode),
    base_price: entry?.base_price,
    date,
    price: entry?.price,
    stock: entry?.stock,
  };
}

function buildMatchedDatesForRange(form: TicketPriceEditorForm) {
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

export function getMatchedTicketDates(form: TicketPriceEditorForm) {
  if (form.mode === 'single') {
    if (!form.date) {
      throw new Error('缺少报价日期');
    }
    return [form.date];
  }

  return buildMatchedDatesForRange(form);
}

function buildEditableTicketPriceItem(
  date: string,
  form: TicketPriceEditorForm,
): EditableTicketPriceItem {
  return {
    base_price: normalizeNumericValue(form.base_price),
    date,
    price: normalizeNumericValue(form.price),
    stock: normalizeNumericValue(form.stock),
  };
}

export function applyTicketEditorFormToPriceMap(
  priceMap: EditableTicketPriceMap,
  form: TicketPriceEditorForm,
  action: 'remove' | 'upsert',
) {
  const matchedDates = getMatchedTicketDates(form);
  const nextMap: EditableTicketPriceMap = Object.fromEntries(
    Object.entries(priceMap).map(([date, item]) => [date, { ...item }]),
  );

  matchedDates.forEach((date) => {
    if (action === 'remove') {
      delete nextMap[date];
      return;
    }

    const currentItem = nextMap[date];
    nextMap[date] = {
      ...currentItem,
      ...buildEditableTicketPriceItem(date, form),
      date,
    };
  });

  return {
    matchedDates,
    nextMap,
  };
}

export function serializeTicketPriceMap(priceMap: EditableTicketPriceMap) {
  const sortedItems = sortEditableTicketPriceItems(Object.values(priceMap));
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

    return {
      base_price: item.base_price === undefined ? '' : String(item.base_price),
      date: item.date,
      id: item.id,
      price: item.price === undefined ? '' : String(item.price),
      stock: String(item.stock),
      suit_id: item.suit_id,
      ticket_id: item.ticket_id,
    };
  });
}

export function buildTicketPriceSummary(
  priceInfo: EditableTicketPriceItem[] = [],
): TicketPriceSummary {
  const sortedPriceInfo = sortEditableTicketPriceItems(priceInfo);
  const prices = sortedPriceInfo
    .map((item) => normalizeNumericValue(item.price))
    .filter((item): item is number => item !== undefined);

  return {
    dateCount: sortedPriceInfo.length,
    endDate: sortedPriceInfo.at(-1)?.date || '',
    maxPrice: prices.length > 0 ? Math.max(...prices) : undefined,
    minPrice: prices.length > 0 ? Math.min(...prices) : undefined,
    startDate: sortedPriceInfo[0]?.date || '',
  };
}

export function buildTicketPriceSummaryFromMap(priceMap: EditableTicketPriceMap) {
  return buildTicketPriceSummary(Object.values(priceMap));
}

export function formatTicketPriceValue(value: number | string | undefined) {
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

export function formatTicketPriceRange(summary: TicketPriceSummary) {
  if (summary.minPrice === undefined || summary.maxPrice === undefined) {
    return '-';
  }

  if (summary.minPrice === summary.maxPrice) {
    return `￥${formatTicketPriceValue(summary.minPrice)}`;
  }

  return `￥${formatTicketPriceValue(summary.minPrice)} ~ ￥${formatTicketPriceValue(summary.maxPrice)}`;
}

export function formatTicketDateRange(summary: TicketPriceSummary) {
  if (!summary.startDate || !summary.endDate) {
    return '-';
  }

  if (summary.startDate === summary.endDate) {
    return summary.startDate;
  }

  return `${summary.startDate} ~ ${summary.endDate}`;
}

export const TICKET_PRICE_WEEK_OPTIONS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 },
];

export const TICKET_PRICE_MONTH_DAY_OPTIONS = Array.from(
  { length: 31 },
  (_, index) => index + 1,
);
