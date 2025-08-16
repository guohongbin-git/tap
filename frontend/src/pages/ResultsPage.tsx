import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  CircularProgress, 
  Alert, 
  Grid,
  Card, 
  CardContent, 
  CardMedia,
  Button,
  CardActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Avatar
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import { getExperimentResults, getVisualizations, getExportUrl, postLlmChat } from '../services/api';

interface Visualization {
    algorithm: string;
    file_path: string;
    type: string;
}

interface Message {
  id: number;
  sender: 'user' | 'bot' | 'system';
  text: string;
  onRetry?: () => void;
}

const ResultsPage: React.FC = () => {
  const { experimentId } = useParams<{ experimentId: string }>();
  const [results, setResults] = useState<any>(null);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (!experimentId) return;

    const fetchResultsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [resultsData, vizData] = await Promise.all([
            getExperimentResults(experimentId),
            getVisualizations(experimentId)
        ]);
        setResults(resultsData);
        setVisualizations(vizData);
        if (resultsData?.llm_analysis_result) {
            setMessages([
                { id: 1, sender: 'system', text: '你好！我是你的专属领土划分分析助手。这是对本次实验的初步分析报告：' }, 
                { id: 2, sender: 'bot', text: resultsData.llm_analysis_result }
            ]);
        } else {
            setMessages([{ id: 1, sender: 'system', text: '你好！我是你的专属领土划分分析助手。请问有什么可以帮您分析的吗？' }])
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || '获取实验结果失败。实验可能仍在运行或已失败。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResultsData();
  }, [experimentId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleExport = (algoName: string) => {
    if (!experimentId) return;
    const url = getExportUrl(experimentId, algoName);
    window.open(url, '_blank');
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !experimentId) return;

    const newUserMessage: Message = { id: Date.now(), sender: 'user', text: messageText };
    setMessages(prev => [...prev, newUserMessage]);
    setIsChatLoading(true);

    try {
      const response = await postLlmChat(experimentId, messageText);
      const botMessage: Message = { id: Date.now() + 1, sender: 'bot', text: response.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: Message = { 
        id: Date.now() + 1, 
        sender: 'system', 
        text: '抱歉，回复时遇到错误。' ,
        onRetry: () => {
            setMessages(prev => prev.filter(msg => msg.id !== errorMessage.id));
            handleSendMessage(messageText);
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(userInput);
    setUserInput('');
  }

  const renderVisualizations = () => {
    if (visualizations.length === 0) return null;

    const groupedByAlgo: { [key: string]: Visualization[] } = visualizations.reduce((acc, viz) => {
      acc[viz.algorithm] = acc[viz.algorithm] || [];
      acc[viz.algorithm].push(viz);
      return acc;
    }, {} as { [key: string]: Visualization[] });

    return Object.entries(groupedByAlgo).map(([algoName, vizList]) => (
      <Grid item xs={12} md={6} key={algoName}>
        <Card>
          <CardContent>
            <Typography variant="h6">{algoName.toUpperCase()}</Typography>
          </CardContent>
          {vizList.map(viz => (
            <CardMedia 
              key={viz.file_path}
              component="img" 
              image={`/${viz.file_path}`}
              alt={`${viz.type} for ${algoName}`}
              sx={{ borderTop: '1px solid #eee' }}
            />
          ))}
          <CardActions>
            <Button size="small" onClick={() => handleExport(algoName)}>导出GeoJSON</Button>
          </CardActions>
        </Card>
      </Grid>
    ));
  };

  const renderEvaluationReports = () => {
    if (!results?.evaluation_reports) return null;
    const reports = results.evaluation_reports;

    return (
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>评估指标详情</Typography>
        {Object.keys(reports).map(algoName => (
          <Accordion key={algoName} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{algoName.toUpperCase()}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>指标</TableCell>
                      <TableCell align="right">得分</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(reports[algoName]).map(([metric, value]) => (
                      <TableRow key={metric}>
                        <TableCell component="th" scope="row">{metric}</TableCell>
                        <TableCell align="right">{typeof value === 'number' ? value.toFixed(4) : String(value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Grid>
    );
  };

  const renderChatInterface = () => (
    <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>智能交互分析</Typography>
        <Paper variant="outlined" sx={{ height: '60vh', display: 'flex', flexDirection: 'column' }}>
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {messages.map((msg) => (
                    <ListItem key={msg.id}>
                        <Avatar sx={{ mr: 2, bgcolor: msg.sender === 'user' ? 'primary.main' : (msg.sender === 'system' ? '#f44336' : '#4caf50')}}>
                            {msg.sender === 'user' ? <AccountCircleIcon /> : <SmartToyIcon />}
                        </Avatar>
                        <ListItemText 
                            primary={msg.text}
                            sx={{ 
                                p: 1.5, 
                                borderRadius: 2, 
                                bgcolor: msg.sender === 'user' ? '#e3f2fd' : '#f5f5f5',
                                whiteSpace: 'pre-wrap'
                            }}
                        />
                        {msg.onRetry && (
                            <IconButton onClick={msg.onRetry} size="small" sx={{ml: 1}}><ReplayIcon /></IconButton>
                        )}
                    </ListItem>
                ))}
                {isChatLoading && <ListItem><CircularProgress size={24} sx={{mx: 'auto'}} /></ListItem>}
                <div ref={chatEndRef} />
            </List>
            <Box component="form" onSubmit={handleFormSubmit} sx={{ p: 2, display: 'flex', alignItems: 'center', borderTop: '1px solid #ddd' }}>
                <TextField 
                    fullWidth 
                    variant="outlined"
                    placeholder="输入您的问题..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={isChatLoading}
                />
                <IconButton type="submit" color="primary" disabled={isChatLoading || !userInput.trim()}>
                    {isChatLoading ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
            </Box>
        </Paper>
    </Grid>
  );

  const renderContent = () => {
    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    if (!results) return <Typography sx={{ mt: 2 }}>未找到结果。</Typography>;

    return (
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {renderChatInterface()}
        {renderVisualizations()}
        {renderEvaluationReports()}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            实验结果：<Typography component="span" variant="h4" color="primary">{experimentId}</Typography>
          </Typography>
          {renderContent()}
        </Box>
      </Paper>
    </Container>
  );
};

export default ResultsPage;
