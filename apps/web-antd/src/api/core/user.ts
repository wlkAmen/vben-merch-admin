import { getProfileApi } from './auth';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return getProfileApi();
}
