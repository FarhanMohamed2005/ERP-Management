import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Paper,
  Fab,
  Fade,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Send as SendIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import api from '../api/axios';

const INITIAL_BOT_MESSAGE = {
  role: 'bot',
  text: "Hello! I'm your AI business assistant. I can help you with:\n\n\u2022 Revenue & sales data\n\u2022 Product information\n\u2022 Customer insights\n\u2022 Invoice status\n\u2022 Expense tracking\n\u2022 Business overview\n\nWhat would you like to know?",
};

const TypingIndicator = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5 }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: '#94A3B8',
          animation: 'typingBounce 1.4s infinite ease-in-out',
          animationDelay: `${i * 0.2}s`,
          '@keyframes typingBounce': {
            '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
            '40%': { transform: 'scale(1)', opacity: 1 },
          },
        }}
      />
    ))}
  </Box>
);

const ChatMessage = ({ message }) => {
  const isBot = message.role === 'bot';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isBot ? 'flex-start' : 'flex-end',
        mb: 1.5,
        gap: 1,
        alignItems: 'flex-end',
      }}
    >
      {isBot && (
        <Avatar
          sx={{
            width: 28,
            height: 28,
            bgcolor: '#2563EB',
            flexShrink: 0,
          }}
        >
          <BotIcon sx={{ fontSize: 16 }} />
        </Avatar>
      )}
      <Box
        sx={{
          maxWidth: '78%',
          px: 1.75,
          py: 1.25,
          borderRadius: isBot
            ? '12px 12px 12px 4px'
            : '12px 12px 4px 12px',
          bgcolor: isBot ? '#F1F5F9' : '#2563EB',
          color: isBot ? '#1E293B' : '#FFFFFF',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <Typography variant="body2" sx={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
          {message.text}
        </Typography>
      </Box>
    </Box>
  );
};

const AIChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasInitialized = useRef(false);

  // Scroll to bottom whenever messages change or loading changes
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Add initial bot message on first open
  useEffect(() => {
    if (open && !hasInitialized.current) {
      hasInitialized.current = true;
      setMessages([INITIAL_BOT_MESSAGE]);
    }
  }, [open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: trimmed });
      const botReply = { role: 'bot', text: response.data.data?.reply || response.data.reply || 'No response received.' };
      setMessages((prev) => [...prev, botReply]);
    } catch (error) {
      const errorText =
        error.response?.data?.message ||
        'Sorry, I encountered an error processing your request. Please try again.';
      setMessages((prev) => [...prev, { role: 'bot', text: errorText }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Chat Panel */}
      <Fade in={open} timeout={250}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 90,
            right: 24,
            width: 380,
            height: 520,
            borderRadius: '16px',
            zIndex: 1300,
            display: open ? 'flex' : 'none',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            // Mobile responsive: full width/height on small screens
            '@media (max-width: 600px)': {
              width: '100%',
              height: '100%',
              bottom: 0,
              right: 0,
              borderRadius: 0,
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              px: 2,
              py: 1.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <BotIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    lineHeight: 1.3,
                  }}
                >
                  AI Assistant
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    fontSize: '0.75rem',
                    lineHeight: 1,
                  }}
                >
                  Ask about your business data
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  color: '#FFFFFF',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 2,
              py: 2,
              bgcolor: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              '&::-webkit-scrollbar': {
                width: 6,
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: '#CBD5E1',
                borderRadius: 3,
              },
            }}
          >
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}

            {/* Typing indicator during loading */}
            {loading && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: '#2563EB',
                    flexShrink: 0,
                  }}
                >
                  <BotIcon sx={{ fontSize: 16 }} />
                </Avatar>
                <Box
                  sx={{
                    px: 1.75,
                    py: 1.5,
                    borderRadius: '12px 12px 12px 4px',
                    bgcolor: '#F1F5F9',
                  }}
                >
                  <TypingIndicator />
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              px: 1.5,
              py: 1.25,
              borderTop: '1px solid #E2E8F0',
              bgcolor: '#FAFBFC',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
            }}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              size="small"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              multiline
              maxRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  bgcolor: '#FFFFFF',
                  fontSize: '0.875rem',
                  color: '#1E293B',
                  '& fieldset': {
                    borderColor: '#E2E8F0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#94A3B8',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2563EB',
                    borderWidth: 1.5,
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#1E293B',
                  '&::placeholder': {
                    color: '#94A3B8',
                    opacity: 1,
                  },
                },
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!input.trim() || loading}
              sx={{
                bgcolor: '#2563EB',
                color: '#FFFFFF',
                width: 38,
                height: 38,
                flexShrink: 0,
                '&:hover': {
                  bgcolor: '#1D4ED8',
                },
                '&.Mui-disabled': {
                  bgcolor: '#CBD5E1',
                  color: '#FFFFFF',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={18} sx={{ color: '#FFFFFF' }} />
              ) : (
                <SendIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Box>
        </Paper>
      </Fade>

      {/* Floating Action Button */}
      <Fab
        onClick={handleToggle}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
          bgcolor: '#2563EB',
          color: '#FFFFFF',
          width: 56,
          height: 56,
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            bgcolor: '#1D4ED8',
            transform: 'scale(1.05)',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.5)',
          },
        }}
      >
        {open ? <CloseIcon /> : <BotIcon sx={{ fontSize: 28 }} />}
      </Fab>
    </>
  );
};

export default AIChatbot;
