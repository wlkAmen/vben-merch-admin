import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { Recordable } from '@vben/types';

import { h } from 'vue';

import { IconifyIcon } from '@vben/icons';
import {
  setupVbenVxeTable,
  useVbenVxeGrid as useGrid,
} from '@vben/plugins/vxe-table';
import { get, isFunction, isString } from '@vben/utils';

import { ElButton, ElImage, ElPopconfirm, ElSwitch, ElTag } from 'element-plus';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        formConfig: {
          enabled: false,
        },
        minHeight: 180,
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: 'items',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    vxeUI.renderer.add('CellImage', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        const src = row[column.field];
        return h(ElImage, { src, previewSrcList: [src], ...props });
      },
    });

    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          ElButton,
          { size: 'small', link: true, type: 'primary' },
          { default: () => props?.text },
        );
      },
    });

    vxeUI.renderer.add('CellTag', {
      renderTableDefault({ options, props }, { column, row }) {
        const value = get(row, column.field);
        const tagOptions = options ?? [
          { effect: 'light', label: '启用', type: 'success', value: 1 },
          { effect: 'light', label: '禁用', type: 'danger', value: 0 },
        ];
        const tagItem = tagOptions.find((item) => item.value === value);

        return h(
          ElTag,
          {
            effect: 'light',
            round: true,
            type: 'info',
            ...props,
            ...tagItem,
          },
          {
            default: () => tagItem?.label ?? value,
          },
        );
      },
    });

    vxeUI.renderer.add('CellSwitch', {
      renderTableDefault({ attrs, props }, { column, row }) {
        const loadingKey = `__loading_${column.field}`;
        const switchProps = {
          activeText: '启用',
          activeValue: '1',
          inactiveText: '禁用',
          inactiveValue: '0',
          ...props,
          loading: row[loadingKey] ?? false,
          modelValue: row[column.field],
          inlinePrompt: true,
          'onUpdate:modelValue': onChange,
        };

        async function onChange(newValue: any) {
          row[loadingKey] = true;
          try {
            const result = await attrs?.beforeChange?.(newValue, row);
            if (result !== false) {
              row[column.field] = newValue;
            }
          } finally {
            row[loadingKey] = false;
          }
        }

        return h(ElSwitch, switchProps);
      },
    });

    vxeUI.renderer.add('CellOperation', {
      renderTableDefault({ attrs, options, props }, { column, row }) {
        const defaultProps = {
          link: true,
          size: 'small',
          type: 'primary',
          ...props,
        };

        const align =
          column.align === 'center'
            ? 'center'
            : (column.align === 'left'
              ? 'flex-start'
              : 'flex-end');

        const presets: Recordable<Recordable<any>> = {
          delete: {
            text: '删除',
            type: 'danger',
          },
          edit: {
            text: '编辑',
          },
        };

        const operations: Array<Recordable<any>> = (
          options || ['edit', 'delete']
        )
          .map((opt) => {
            if (isString(opt)) {
              return presets[opt]
                ? { code: opt, ...presets[opt], ...defaultProps }
                : { code: opt, text: opt, ...defaultProps };
            }
            return { ...defaultProps, ...presets[opt.code], ...opt };
          })
          .map((opt) => {
            const normalized: Recordable<any> = {};
            Object.keys(opt).forEach((key) => {
              normalized[key] = isFunction(opt[key]) ? opt[key](row) : opt[key];
            });
            return normalized;
          })
          .filter((opt) => opt.show !== false);

        function emitClick(code: string) {
          attrs?.onClick?.({
            code,
            row,
          });
        }

        function renderBtn(opt: Recordable<any>, listen = true) {
          const { code, icon, show: _show, text, ...buttonProps } = opt;

          return h(
            ElButton,
            {
              ...buttonProps,
              onClick: listen ? () => emitClick(code) : undefined,
            },
            {
              default: () => {
                const content = [];
                if (icon) {
                  content.push(h(IconifyIcon, { class: 'size-4', icon }));
                }
                content.push(text);
                return content;
              },
            },
          );
        }

        function renderConfirm(opt: Recordable<any>) {
          return h(
            ElPopconfirm,
            {
              cancelButtonText: '取消',
              confirmButtonText: '确定',
              title: `确定删除${attrs?.nameTitle || ''}“${row[attrs?.nameField || 'name']}”吗？`,
              onConfirm: () => emitClick(opt.code),
            },
            {
              reference: () => renderBtn(opt, false),
            },
          );
        }

        const btns = operations.map((opt) =>
          opt.code === 'delete' ? renderConfirm(opt) : renderBtn(opt),
        );

        return h(
          'div',
          {
            class: 'flex table-operations',
            style: { justifyContent: align },
          },
          btns,
        );
      },
    });
  },
  useVbenForm,
});

export const useVbenVxeGrid = <T extends Record<string, any>>(
  ...rest: Parameters<typeof useGrid<T>>
) => useGrid<T>(...rest);

export type OnActionClickParams<T = Recordable<any>> = {
  code: string;
  row: T;
};

export type OnActionClickFn<T = Recordable<any>> = (
  params: OnActionClickParams<T>,
) => void;

export type * from '@vben/plugins/vxe-table';
