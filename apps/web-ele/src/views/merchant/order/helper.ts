export function formatOrderDateTime(timestamp: number) {
  if (!timestamp) {
    return '-';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000));
}

export function getOrderStatusTagType(status: string) {
  if (status === '3') {
    return 'success';
  }

  if (status === '-2' || status === '-1') {
    return 'danger';
  }

  return 'warning';
}

export function getVerifyStatusTagType(status?: string) {
  if (status === '1') {
    return 'success';
  }

  if (status === '0') {
    return 'warning';
  }

  return 'info';
}

export function getProcessStatusTagType(status?: string, text?: string) {
  const statusText = `${status || ''}${text || ''}`;

  if (/驳回|关闭|取消|失败|拒绝/.test(statusText)) {
    return 'danger';
  }

  if (/成功|完成|已发货|已签收|已处理|已退款|已售后/.test(statusText)) {
    return 'success';
  }

  if (/待|处理中|申请中|发货中|售后中|退款中/.test(statusText)) {
    return 'warning';
  }

  return 'info';
}
