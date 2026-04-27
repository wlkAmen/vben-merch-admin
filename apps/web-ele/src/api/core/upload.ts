import { requestClient } from '#/api/request';

export interface MerchantUploadResult {
  filesize?: number;
  fullurl?: string;
  id?: number;
  mimetype?: string;
  storage?: string;
  url: string;
}

interface UploadFileParams {
  file: File;
  onError?: (error: Error) => void;
  onProgress?: (progress: { percent: number }) => void;
  onSuccess?: (data: MerchantUploadResult, file: File) => void;
}

async function uploadMerchantFile(
  path: string,
  { file, onError, onProgress, onSuccess }: UploadFileParams,
) {
  try {
    onProgress?.({ percent: 0 });

    const data = await requestClient.upload<MerchantUploadResult>(path, {
      file,
    });

    onProgress?.({ percent: 100 });
    onSuccess?.(data, file);
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function uploadMerchantImage(params: UploadFileParams) {
  return uploadMerchantFile('/upload/image', params);
}

export async function uploadMerchantFileAttachment(params: UploadFileParams) {
  return uploadMerchantFile('/upload/file', params);
}
