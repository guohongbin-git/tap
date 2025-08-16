import axios from 'axios';

// 在.env文件中定义后端API的基础URL，这里使用一个默认值
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * 创建一个配置了基础URL的axios实例。
 * 这使得我们不必在每个API调用中都重复写入URL。
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 定义一个函数来触发一个新的实验。
 * @param config - 实验配置对象，将作为请求体发送。
 * @returns 返回一个包含experiment_id的对象。
 */
export const runExperiment = async (config: any) => {
  try {
    const response = await apiClient.post('/experiments/run', config);
    return response.data;
  } catch (error) {
    console.error('Error running experiment:', error);
    throw error;
  }
};

/**
 * 定义一个函数来获取指定实验的结果。
 * @param experimentId - 要检索的实验的ID。
 * @returns 返回实验结果对象。
 */
export const getExperimentResults = async (experimentId: string) => {
  try {
    const response = await apiClient.get(`/experiments/results/${experimentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching results for experiment ${experimentId}:`, error);
    throw error;
  }
};

/**
 * 定义一个函数来获取所有实验的列表。
 * @returns 返回一个包含实验摘要信息的数组。
 */
export const getExperiments = async () => {
  try {
    const response = await apiClient.get('/experiments');
    return response.data;
  } catch (error) {
    console.error('Error fetching experiments:', error);
    throw error;
  }
};

/**
 * 上传一个数据集文件进行预检，返回其列头。
 * @param file - 要上传的文件对象。
 * @returns 返回一个包含文件名和列头数组的对象。
 */
export const uploadDatasetForPrecheck = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data; // { filename: string, headers: string[] }
  } catch (error) {
    console.error('Error uploading dataset for precheck:', error);
    throw error;
  }
};

/**
 * 定义列映射关系并触发后端处理数据集。
 * @param mapping - 包含文件名和列映射关系的对象。
 * @returns 返回处理结果。
 */
export const processDataset = async (mapping: object) => {
  try {
    const response = await apiClient.post('/datasets/process', mapping);
    return response.data;
  } catch (error) {
    console.error('Error processing dataset:', error);
    throw error;
  }
};

/**
 * 获取可用的数据集列表。
 * @returns 返回一个包含数据集文件名的字符串数组。
 */
export const getDatasets = async () => {
  try {
    const response = await apiClient.get('/datasets');
    return response.data;
  } catch (error) {
    console.error('Error fetching datasets:', error);
    throw error;
  }
};

/**
 * 构建用于导出分区数据的URL。
 * @param experimentId - 实验ID。
 * @param algorithmName - 算法名称。
 * @returns 返回可供下载的URL。
 */
export const getExportUrl = (experimentId: string, algorithmName: string) => {
  return `${API_BASE_URL}/experiments/results/${experimentId}/${algorithmName}/export`;
};

/**
 * 获取OSM缓存的状态。
 * @returns 返回一个包含缓存状态信息的对象。
 */
export const getOsmCacheStatus = async () => {
  try {
    const response = await apiClient.get('/osm/cache/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching OSM cache status:', error);
    throw error;
  }
};

/**
 * 清除OSM缓存。
 * @returns 返回操作结果。
 */
export const clearOsmCache = async () => {
  try {
    const response = await apiClient.post('/osm/cache/clear');
    return response.data;
  } catch (error) {
    console.error('Error clearing OSM cache:', error);
    throw error;
  }
};

/**
 * 对指定的数据集运行K函数空间统计分析。
 * @param datasetName - 要分析的数据集的名称。
 * @returns 返回K函数分析的结果。
 */
export const analyzeKFunction = async (datasetName: string) => {
  try {
    const response = await apiClient.get(`/datasets/${datasetName}/analysis/k_function`);
    return response.data;
  } catch (error) {
    console.error(`Error analyzing K-function for dataset ${datasetName}:`, error);
    throw error;
  }
};

/**
 * 获取指定实验的所有可视化图表信息。
 * @param experimentId - 要检索的实验的ID。
 * @returns 返回一个包含可视化信息的对象数组。
 */
export const getVisualizations = async (experimentId: string) => {
  try {
    const response = await apiClient.get(`/experiments/results/${experimentId}/visualizations`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching visualizations for experiment ${experimentId}:`, error);
    throw error;
  }
};

/**
 * 向LLM聊天端点发送消息并获取回复。
 * @param experimentId - 当前实验的ID。
 * @param userMessage - 用户发送的消息。
 * @returns 返回LLM的回复。
 */
export const postLlmChat = async (experimentId: string, userMessage: string) => {
  try {
    const response = await apiClient.post(`/experiments/results/${experimentId}/llm_chat`, {
      message: userMessage,
    });
    return response.data;
  } catch (error) {
    console.error(`Error posting to LLM chat for experiment ${experimentId}:`, error);
    throw error;
  }
};
