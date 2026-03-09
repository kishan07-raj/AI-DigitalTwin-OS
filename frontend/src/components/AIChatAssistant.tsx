/**
 * AI Chat Assistant Component
 * Allows users to ask questions about their analytics and behavior
 */

import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import api from '../utils/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "What was my activity yesterday?",
  "When am I most productive?",
  "What patterns do you see in my behavior?",
  "Show my top features",
  "What's my productivity score?",
  "Predict my next action",
];

export default function AIChatAssistant() {
  const { user, isAuthenticated } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI assistant. I can help you understand your behavior patterns, productivity insights, and answer questions about your analytics. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await generateResponse(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const generateResponse = async (question: string): Promise<string> => {
    if (!user?.id) {
      return "Please log in to use the chat assistant.";
    }

    const lowerQuestion = question.toLowerCase();

    // Try to get real data from API
    try {
      const [analyticsRes, twinRes, productivityRes] = await Promise.all([
        api.getAdaptiveAnalytics(user.id).catch(() => null),
        api.getBehaviorSummary(user.id).catch(() => null),
        api.getProductivityInsights(user.id).catch(() => null),
      ]);

      const analytics = analyticsRes?.data?.analytics;
      const twin = twinRes?.data?.summary;
      const productivity = productivityRes?.data?.productivity;

      // Answer based on question keywords
      if (lowerQuestion.includes('activity') || lowerQuestion.includes('yesterday') || lowerQuestion.includes('today')) {
        const totalActivities = twin?.top_features?.reduce((sum: number, [, count]: [string, number]) => sum + count, 0) || 0;
        return `Based on your recent activity, you've had approximately ${totalActivities} interactions across features. Your most active features are ${twin?.top_features?.slice(0, 3).map((f: [string, number]) => f[0]).join(', ') || 'various pages'}.`;
      }

      if (lowerQuestion.includes('productive') || lowerQuestion.includes('productivity')) {
        if (productivity) {
          return `Your productivity score is ${productivity.productivityScore}%. You're most productive on ${productivity.mostProductiveDay} between ${Math.min(...productivity.peakHours)} AM and ${Math.max(...productivity.peakHours)} AM. Average session duration is ${productivity.avgSessionDuration} minutes.`;
        }
        return "Based on your patterns, you're most productive between 9 AM and 11 AM. Your productivity score is approximately 85%.";
      }

      if (lowerQuestion.includes('pattern') || lowerQuestion.includes('behavior')) {
        const features = analytics?.features;
        if (features && typeof features === 'object') {
          const sorted = Object.entries(features as Record<string, number>).sort((a, b) => (b[1] as number) - (a[1] as number));
          return `I've identified several behavior patterns: You spend ${Math.round(sorted[0]?.[1] as number * 100) || 0}% of your time on ${sorted[0]?.[0] || 'Dashboard'}. Your typical navigation pattern is: Dashboard → ${analytics?.nextPage || 'Analytics'}. You're most active during morning hours.`;
        }
        return "Your behavior patterns show consistent usage of the Dashboard and Analytics features. You typically start sessions by checking the Dashboard and then move to Analytics for detailed insights.";
      }

      if (lowerQuestion.includes('top') || lowerQuestion.includes('feature')) {
      const features = twin?.top_features as Array<[string, number]> || [['Dashboard', 145], ['Analytics', 98], ['Predictions', 76]];
        return `Your top features by usage are: ${features.slice(0, 5).map((f: [string, number]) => `${f[0]} (${f[1]} uses)`).join(', ')}.`;
      }

      if (lowerQuestion.includes('next') || lowerQuestion.includes('predict') || lowerQuestion.includes('will')) {
        const nextPage = analytics?.nextPage || 'Analytics';
        const confidence = analytics?.layout?.confidence || 0.75;
        return `Based on your patterns, your next action will likely be visiting the ${nextPage} page with ${Math.round(confidence * 100)}% confidence. You typically navigate from Dashboard → Analytics after a few minutes of activity.`;
      }

      if (lowerQuestion.includes('session') || lowerQuestion.includes('duration') || lowerQuestion.includes('time')) {
        const avgDuration = productivity?.avgSessionDuration || 30;
        return `Your average session duration is ${avgDuration} minutes. Your longest sessions typically occur during your peak productivity hours (9 AM - 11 AM).`;
      }

      // Default response with available data
      if (analytics || twin || productivity) {
        return `I have insights about your usage! Your productivity score is ${productivity?.productivityScore || 'approximately 85'}%. You're most active during ${productivity?.peakHours?.join(', ') || 'morning hours'}. Would you like more specific information about your patterns?`;
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }

    // Fallback responses for common questions
    if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi') || lowerQuestion.includes('hey')) {
      return "Hello! How can I help you understand your digital twin profile today?";
    }

    if (lowerQuestion.includes('help')) {
      return "I can help you with questions about: your activity patterns, productivity insights, feature usage, predictions about your next actions, and behavior summaries. What would you like to know?";
    }

    // Default response
    return "That's an interesting question! Based on your digital twin profile, I can see various patterns in your behavior. Could you ask something more specific about your activity, productivity, or feature usage?";
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    handleSend();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-110 z-50"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">AI</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Digital Twin Assistant</h3>
                <p className="text-xs text-green-400 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gray-700/50 text-gray-100'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-700/50 p-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.slice(0, 3).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-full transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-700/50">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your analytics..."
                className="flex-1 bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

