import  { AxiosInstance, AxiosRequestConfig } from 'axios';
import { APIResponse } from '../components/types';

/**
 * Creates an ApiClient adapter from an AxiosInstance
 * This adapter ensures that the AxiosInstance conforms to the ApiClient interface
 * expected by the components
 */
export function createApiClient(axiosInstance: AxiosInstance) {
  return {
    get: async (url: string, config?: AxiosRequestConfig): Promise<APIResponse> => {
      const response = await axiosInstance.get(url, config);
      return response.data;
    },
    post: async (url: string, data?: unknown, config?: AxiosRequestConfig): Promise<APIResponse> => {
      const response = await axiosInstance.post(url, data, config);
      return response.data;
    },
    patch: async (url: string, data?: unknown, config?: AxiosRequestConfig): Promise<APIResponse> => {
      const response = await axiosInstance.patch(url, data, config);
      return response.data;
    },
    delete: async (url: string, config?: AxiosRequestConfig): Promise<APIResponse> => {
      const response = await axiosInstance.delete(url, config);
      return response.data;
    }
  };
}