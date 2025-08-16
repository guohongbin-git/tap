import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Button,
  Input,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  IconButton,
} from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDatasets, uploadDatasetForPrecheck, processDataset, getOsmCacheStatus, clearOsmCache, analyzeKFunction } from '../services/api';

interface CacheStatus {
  directory: string;
  file_count: number;
  total_size_mb: number;
}

interface MappingState {
  open: boolean;
  filename: string;
  headers: string[];
  latitude_col: string;
  longitude_col: string;
  id_col: string;
  weight_col: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

interface AnalysisState {
  open: boolean;
  datasetName: string | null;
  data: any | null;
  loading: boolean;
  error: string | null;
}

const DataManagementPage: React.FC = () => {
  const [datasets, setDatasets] = useState<string[]>([]);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // For initial load errors
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [mappingState, setMappingState] = useState<MappingState>({
    open: false,
    filename: '',
    headers: [],
    latitude_col: '',
    longitude_col: '',
    id_col: '',
    weight_col: '',
  });

  const [analysisState, setAnalysisState] = useState<AnalysisState>({ 
    open: false, 
    datasetName: null,
    data: null, 
    loading: false, 
    error: null 
  });

  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [datasetsData, cacheStatusData] = await Promise.all([
        getDatasets(),
        getOsmCacheStatus()
      ]);
      setDatasets(datasetsData);
      setCacheStatus(cacheStatusData);
    } catch (err) {
      setError('获取页面初始数据失败。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const { filename, headers } = await uploadDatasetForPrecheck(selectedFile);
      setMappingState({
        ...mappingState,
        open: true,
        filename,
        headers,
      });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || '文件预检失败，请确保是有效的CSV文件。', severity: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleMappingChange = (field: keyof MappingState, value: string) => {
    setMappingState(prevState => ({ ...prevState, [field]: value }));
  };

  const handleCloseMapping = () => {
    setMappingState({ ...mappingState, open: false });
    setSelectedFile(null); // Reset file input
  };

  const handleProcess = async () => {
    if (!mappingState.latitude_col || !mappingState.longitude_col) {
        setSnackbar({ open: true, message: '纬度和经度字段是必须的。', severity: 'warning' });
        return;
    }
    setUploading(true);
    try {
        const response = await processDataset({
            filename: mappingState.filename,
            latitude_col: mappingState.latitude_col,
            longitude_col: mappingState.longitude_col,
            id_col: mappingState.id_col || null,
            weight_col: mappingState.weight_col || null,
        });
        handleCloseMapping();
        fetchData(); // Refresh all data
        setSnackbar({ open: true, message: response.message || '数据集处理成功!', severity: 'success' });
    } catch (err: any) {
        setSnackbar({ open: true, message: err.response?.data?.detail || '数据处理失败。', severity: 'error' });
    } finally {
        setUploading(false);
    }
  };

  const handleClearCache = async () => {
    try {
        await clearOsmCache();
        fetchData(); // Refresh all data
        setSnackbar({ open: true, message: 'OSM缓存已成功清除。', severity: 'success' });
    } catch (err: any) {
        setSnackbar({ open: true, message: err.response?.data?.detail || '清除OSM缓存失败。', severity: 'error' });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAnalysisClick = async (datasetName: string) => {
    setAnalysisState({ open: true, datasetName, data: null, loading: true, error: null });
    try {
      const result = await analyzeKFunction(datasetName);
      const chartData = result.r.map((val: number, index: number) => ({
        r: val,
        k_values: result.k_values[index],
        k_expected: result.k_expected[index],
      }));
      setAnalysisState(prevState => ({ ...prevState, data: chartData, loading: false }));
    } catch (err) {
      setAnalysisState(prevState => ({ ...prevState, error: 'K函数分析失败。', loading: false }));
    }
  };

  const handleCloseAnalysisModal = () => {
    setAnalysisState({ open: false, datasetName: null, data: null, loading: false, error: null });
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>数据管理</Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">用户数据集 (已处理)</Typography>
          {isLoading ? <CircularProgress size={24} /> : (
            <List dense>
              {datasets.length > 0 ? datasets.map(name => (
                <ListItem 
                  key={name}
                  secondaryAction={
                    <IconButton edge="end" aria-label="analyze" onClick={() => handleAnalysisClick(name)}>
                      <AnalyticsIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary={name} />
                </ListItem>
              )) : <Typography variant="body2">暂无已处理的数据集。</Typography>}
            </List>
          )}
          <Box sx={{ mt: 2 }}>
            <Input type="file" onChange={handleFileChange} key={selectedFile ? 'file-selected' : 'file-empty'} />
            <Button variant="contained" onClick={handleUpload} disabled={!selectedFile || uploading} sx={{ ml: 2 }}>
              {uploading ? '正在上传...' : '上传并处理新数据'}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box>
          <Typography variant="h6">OSM数据缓存</Typography>
          {isLoading ? <CircularProgress size={24} /> : cacheStatus ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Chip label={`文件数：${cacheStatus.file_count}`} />
                <Chip label={`大小：${cacheStatus.total_size_mb.toFixed(2)} MB`} />
                <Button variant="outlined" color="warning" onClick={handleClearCache}>清除缓存</Button>
            </Box>
          ) : <Typography variant="body2">无法加载缓存状态。</Typography>}
        </Box>

      </Paper>

      {/* Mapping Dialog */}
      <Dialog open={mappingState.open} onClose={handleCloseMapping} maxWidth="sm" fullWidth>
        <DialogTitle>定义数据列</DialogTitle>
        <DialogContent>
            <Typography variant="body2" sx={{mb: 3}}>请为系统需要的核心字段，从您的文件（{mappingState.filename}）中选择对应的列。</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                        <InputLabel>纬度 (Latitude)</InputLabel>
                        <Select value={mappingState.latitude_col} onChange={e => handleMappingChange('latitude_col', e.target.value)}>
                            {mappingState.headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                        <InputLabel>经度 (Longitude)</InputLabel>
                        <Select value={mappingState.longitude_col} onChange={e => handleMappingChange('longitude_col', e.target.value)}>
                            {mappingState.headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>唯一ID (Optional)</InputLabel>
                        <Select value={mappingState.id_col} onChange={e => handleMappingChange('id_col', e.target.value)}>
                             <MenuItem value=""><em>None</em></MenuItem>
                            {mappingState.headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>权重 (Optional)</InputLabel>
                        <Select value={mappingState.weight_col} onChange={e => handleMappingChange('weight_col', e.target.value)}>
                            <MenuItem value=""><em>None</em></MenuItem>
                            {mappingState.headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMapping}>取消</Button>
          <Button onClick={handleProcess} variant="contained" disabled={uploading || !mappingState.latitude_col || !mappingState.longitude_col}>
            {uploading ? '正在处理...' : '确认并处理'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analysis Dialog */}
      <Dialog open={analysisState.open} onClose={handleCloseAnalysisModal} maxWidth="lg" fullWidth>
        <DialogTitle>K函数分析: {analysisState.datasetName}</DialogTitle>
        <DialogContent>
          {analysisState.loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
          {analysisState.error && <Alert severity="error">{analysisState.error}</Alert>}
          {analysisState.data && (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analysisState.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="r" label={{ value: '距离 (r)', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'K(r)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="k_values" stroke="#8884d8" name="观测值" />
                <Line type="monotone" dataKey="k_expected" stroke="#82ca9d" name="期望值" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAnalysisModal}>关闭</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Container>
  );
};

export default DataManagementPage;