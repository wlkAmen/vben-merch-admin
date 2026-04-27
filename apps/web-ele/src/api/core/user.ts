import type { UserInfo } from '@vben/types';

import { getAuthProfileApi, mapSessionToUserInfo } from './auth';

export async function getUserInfoApi() {
  const session = await getAuthProfileApi();
  return mapSessionToUserInfo(session) as UserInfo;
}
