import type {
  MerchantGoodsSkuNode,
  MerchantGoodsSkuPriceRow,
} from '#/api';

export interface GoodsSpecValue {
  id?: number;
  name: string;
  tempId: string;
}

export interface GoodsSpecGroup {
  id?: number;
  name: string;
  values: GoodsSpecValue[];
}

export interface GoodsSkuEditorRow {
  cost_price?: string;
  goods_sku_temp_ids: string[];
  goods_sku_text: string[];
  id?: number;
  image: string;
  original_price?: string;
  price: string;
  sn: string;
  status: string;
  stock: number;
  weight: string;
}

export interface GoodsSkuBatchFillForm {
  cost_price?: string;
  original_price?: string;
  price?: string;
  stock?: number;
}

function buildTempId(seed: number) {
  return `temp_${seed}`;
}

export function createEmptyGoodsSpecGroup(seed: number): GoodsSpecGroup {
  return {
    name: '',
    values: [
      {
        name: '',
        tempId: buildTempId(seed),
      },
    ],
  };
}

export function createEmptyGoodsSpecValue(seed: number): GoodsSpecValue {
  return {
    name: '',
    tempId: buildTempId(seed),
  };
}

export function normalizeGoodsSpecData(
  list: MerchantGoodsSkuNode[] = [],
  priceRows: MerchantGoodsSkuPriceRow[] = [],
) {
  let seed = 1;
  const realToTempMap = new Map<number, string>();

  const groups: GoodsSpecGroup[] = list.map((group) => {
    const values = (group.children || []).map((child) => {
      const tempId = buildTempId(seed++);
      realToTempMap.set(Number(child.id), tempId);
      return {
        id: child.id,
        name: child.name,
        tempId,
      };
    });

    return {
      id: group.id,
      name: group.name,
      values,
    };
  });

  const rows: GoodsSkuEditorRow[] = (priceRows || []).map((row) => ({
    cost_price: row.cost_price || '',
    goods_sku_temp_ids: (row.goods_sku_ids || []).map((id) => {
      return realToTempMap.get(Number(id)) || buildTempId(seed++);
    }),
    goods_sku_text: [...(row.goods_sku_text || [])],
    id: row.id,
    image: row.image || '',
    original_price: row.original_price || '',
    price: row.price || '',
    sn: row.sn || '',
    status: row.status || 'up',
    stock: Number(row.stock ?? 0),
    weight: row.weight || '',
  }));

  return {
    groups,
    nextSeed: seed,
    rows,
  };
}

function cartesianProduct(arrays: string[][]) {
  if (arrays.length === 0) {
    return [];
  }

  return arrays.reduce<string[][]>(
    (result, current) => {
      const next: string[][] = [];
      result.forEach((prefix) => {
        current.forEach((value) => {
          next.push([...prefix, value]);
        });
      });
      return next;
    },
    [[]],
  );
}

export function buildGoodsSkuCombinations(groups: GoodsSpecGroup[]) {
  const validGroups = groups.filter((group) => group.values.length > 0);
  if (validGroups.length === 0) {
    return [];
  }

  const combinations = cartesianProduct(
    validGroups.map((group) => group.values.map((value) => value.tempId)),
  );

  return combinations.map((combination) => {
    const texts = combination.map((tempId) => {
      for (const group of validGroups) {
        const matched = group.values.find((value) => value.tempId === tempId);
        if (matched) {
          return matched.name;
        }
      }
      return '';
    });

    return {
      goods_sku_temp_ids: combination,
      goods_sku_text: texts,
      key: combination.join(','),
    };
  });
}

export function syncGoodsSkuRows(
  groups: GoodsSpecGroup[],
  previousRows: GoodsSkuEditorRow[] = [],
) {
  const combinationRows = buildGoodsSkuCombinations(groups);
  const previousMap = new Map(
    previousRows.map((row) => [row.goods_sku_temp_ids.join(','), row]),
  );

  return combinationRows.map((item) => {
    const previous = previousMap.get(item.key);
    return {
      cost_price: previous?.cost_price || '',
      goods_sku_temp_ids: item.goods_sku_temp_ids,
      goods_sku_text: item.goods_sku_text,
      id: previous?.id,
      image: previous?.image || '',
      original_price: previous?.original_price || '',
      price: previous?.price || '',
      sn: previous?.sn || '',
      status: previous?.status || 'up',
      stock: Number(previous?.stock ?? 0),
      weight: previous?.weight || '',
    };
  });
}

export function validateGoodsSpecGroups(groups: GoodsSpecGroup[]) {
  if (groups.length === 0) {
    throw new Error('请至少添加一组规格');
  }

  groups.forEach((group, groupIndex) => {
    if (!group.name.trim()) {
      throw new Error(`请填写第 ${groupIndex + 1} 组规格名称`);
    }

    const validValues = group.values.filter((value) => value.name.trim());
    if (validValues.length === 0) {
      throw new Error(`请至少填写一项“${group.name || `规格${groupIndex + 1}`}”的规格值`);
    }
  });
}

export function validateGoodsSkuRows(rows: GoodsSkuEditorRow[]) {
  if (rows.length === 0) {
    throw new Error('请先生成规格价格表');
  }

  rows.forEach((row) => {
    if (row.price === '' || row.price === undefined || Number(row.price) <= 0) {
      throw new Error(`请填写规格“${row.goods_sku_text.join(' / ')}”的销售价`);
    }
    if (row.stock === undefined || row.stock === null) {
      throw new Error(`请填写规格“${row.goods_sku_text.join(' / ')}”的库存`);
    }
  });
}

export function serializeGoodsSkuGroups(groups: GoodsSpecGroup[]) {
  return groups.map((group) => ({
    id: group.id,
    name: group.name.trim(),
    children: group.values
      .filter((value) => value.name.trim())
      .map((value) => ({
        id: value.id,
        name: value.name.trim(),
        temp_id: value.tempId,
      })),
  }));
}

export function serializeGoodsSkuRows(rows: GoodsSkuEditorRow[]) {
  return rows.map((row) => ({
    cost_price: row.cost_price || '',
    goods_sku_temp_ids: [...row.goods_sku_temp_ids],
    goods_sku_text: [...row.goods_sku_text],
    id: row.id,
    image: row.image || '',
    original_price: row.original_price || '',
    price: row.price,
    sn: row.sn || '',
    status: row.status || 'up',
    stock: Number(row.stock ?? 0),
    weight: row.weight || '',
  }));
}

export function createGoodsSkuBatchFillForm(): GoodsSkuBatchFillForm {
  return {
    cost_price: '',
    original_price: '',
    price: '',
    stock: undefined,
  };
}

export function applyGoodsSkuBatchFill(
  rows: GoodsSkuEditorRow[],
  form: GoodsSkuBatchFillForm,
) {
  const hasPrice = form.price !== undefined && form.price !== '';
  const hasCostPrice = form.cost_price !== undefined && form.cost_price !== '';
  const hasOriginalPrice =
    form.original_price !== undefined && form.original_price !== '';
  const hasStock = form.stock !== undefined && form.stock !== null;

  if (!hasPrice && !hasCostPrice && !hasOriginalPrice && !hasStock) {
    throw new Error('请至少填写一个要批量应用的字段');
  }

  if (rows.length === 0) {
    throw new Error('当前还没有规格组合，无法批量填充');
  }

  return rows.map((row) => ({
    ...row,
    cost_price: hasCostPrice ? String(form.cost_price) : row.cost_price,
    original_price: hasOriginalPrice ? String(form.original_price) : row.original_price,
    price: hasPrice ? String(form.price) : row.price,
    stock: hasStock ? Number(form.stock) : row.stock,
  }));
}
