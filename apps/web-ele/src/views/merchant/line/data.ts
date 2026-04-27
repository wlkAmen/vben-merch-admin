import type { VbenFormSchema } from '#/adapter/form';
import type {
  OnActionClickFn,
  VxeTableGridColumns,
} from '#/adapter/vxe-table';
import type { MerchantLineItem } from '#/api';

export interface MerchantLineTableRow extends MerchantLineItem {
  createtime_text: string;
  first_image: string;
  itinerary_text: string;
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '关键词',
      componentProps: {
        placeholder: '请输入线路标题关键词',
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '上下架',
      componentProps: {
        allowClear: true,
        options: [],
      },
    },
    {
      component: 'Select',
      fieldName: 'audit_status',
      label: '审核状态',
      componentProps: {
        allowClear: true,
        options: [],
      },
    },
    {
      component: 'Select',
      fieldName: 'type',
      label: '线路类型',
      componentProps: {
        allowClear: true,
        options: [],
      },
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<MerchantLineTableRow>,
  onStatusChange?: (
    newStatus: string,
    row: MerchantLineTableRow,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridColumns {
  return [
    {
      align: 'left',
      field: 'title',
      fixed: 'left',
      minWidth: 320,
      slots: { default: 'title' },
      title: '线路信息',
    },
    {
      field: 'type',
      title: '线路类型',
      width: 120,
      slots: { default: 'type' },
    },
    {
      field: 'itinerary_text',
      title: '行程',
      width: 120,
    },
    {
      field: 'suit_count',
      title: '套餐数',
      width: 100,
    },
    {
      field: 'config_status',
      title: '配置状态',
      slots: { default: 'config' },
      width: 120,
    },
    {
      field: 'audit_status',
      slots: { default: 'auditStatus' },
      title: '审核状态',
      width: 120,
    },
    {
      field: 'sales',
      title: '销量',
      width: 100,
    },
    {
      field: 'mobile',
      minWidth: 140,
      title: '联系电话',
    },
    {
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
        props: {
          activeText: '上架',
          inactiveText: '下架',
        },
      },
      field: 'status',
      title: '上下架',
      width: 100,
    },
    {
      field: 'createtime_text',
      title: '创建时间',
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'title',
          nameTitle: '线路',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            text: '详情',
          },
          {
            code: 'edit',
            text: '编辑',
          },
          {
            code: 'suit',
            text: '套餐',
          },
          {
            code: 'price',
            text: '价格库存',
          },
          {
            code: 'delete',
            text: '删除',
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: '操作',
      width: 260,
    },
  ];
}
