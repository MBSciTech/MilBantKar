import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, X, Sparkles, Bot } from 'lucide-react';
import { getAuthSession } from '../utils/authSession';

const REMOTE_API_BASE = 'https://milbantkar-1.onrender.com';
const LOCAL_API_BASE = 'http://localhost:5000';
const REMOTE_CHATBOT_API_BASE = process.env.REACT_APP_CHATBOT_API_BASE_URL || 'https://milbantkar-chatbot.onrender.com';
const LOCAL_CHATBOT_API_BASE = 'http://localhost:8000';
const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE = process.env.REACT_APP_API_BASE_URL || (isLocalHost ? LOCAL_API_BASE : REMOTE_API_BASE);
const API_FALLBACK = API_BASE === LOCAL_API_BASE ? REMOTE_API_BASE : LOCAL_API_BASE;
const CHATBOT_API_BASE = isLocalHost ? LOCAL_CHATBOT_API_BASE : REMOTE_CHATBOT_API_BASE;
const CHATBOT_API_FALLBACK = CHATBOT_API_BASE === LOCAL_CHATBOT_API_BASE ? REMOTE_CHATBOT_API_BASE : LOCAL_CHATBOT_API_BASE;

const QUICK_TOPICS = [
  'How do I add an expense?',
  'How do I create an event?',
  'How do I mark settlement done?',
  'How do reminders work?',
];

const DEFAULT_GREETING = {
  role: 'assistant',
  text: 'I am the MilBantKar assistant. Ask me about events, expenses, settlements, reminders, or profile settings.',
};

const HELP_TEXT = {
  'create an event': 'Go to the Events page, click Create Event, enter the event name and description, then share the event code with your group.',
  'add an expense': 'Open the event, choose Add Expense, enter the amount, select participants, and submit.',
  'mark settlement': 'Open History or the event settlement panel, then use the confirm/settle button to mark your side complete.',
  'settlement done': 'A settlement is complete when both users confirm it. The status will change to Settled.',
  'reminder': 'In History, use the Remind button on a pending expense to notify the other person in-app.',
  'profile': 'Open your profile from the top-right menu to update username, phone, email, or profile picture.',
  'login': 'Your session stays signed in for 15 days unless you log out manually.',
  'history': 'History shows your expenses, settlement status, and reminders. You can filter and search from the top of the page.',
};

const PAGE_NAVIGATION = [
  {
    route: '/events',
    title: 'Events',
    matchers: ['event page', 'events page', 'events', 'event'],
    steps: ['Dashboard', 'Top menu', 'Events'],
  },
  {
    route: '/dashboard',
    title: 'Dashboard',
    matchers: ['dashboard'],
    steps: ['Top menu', 'Dashboard'],
  },
  {
    route: '/history',
    title: 'History',
    matchers: ['history page', 'history'],
    steps: ['Top menu', 'History'],
  },
  {
    route: '/budget',
    title: 'Budget',
    matchers: ['budget page', 'budget'],
    steps: ['Top menu', 'Budget'],
  },
  {
    route: '/profile',
    title: 'Profile',
    matchers: ['profile page', 'my profile', 'profile'],
    steps: ['Top-right avatar', 'My Profile'],
  },
  {
    route: '/settings',
    title: 'Settings',
    matchers: ['settings page', 'settings'],
    steps: ['Top-right avatar', 'Settings'],
  },
  {
    route: '/help',
    title: 'Help',
    matchers: ['help page', 'support page', 'help', 'support'],
    steps: ['Top-right avatar', 'Help & Support'],
  },
  {
    route: '/transaction',
    title: 'Transaction',
    matchers: ['transaction page', 'transactions', 'transaction'],
    steps: ['Top menu', 'Transaction'],
  },
  {
    route: '/visualise',
    title: 'Visualise',
    matchers: ['visualise page', 'visualize page', 'visualise', 'visualize'],
    steps: ['Top menu', 'Visualise'],
  },
  {
    route: '/scanner',
    title: 'QR Scanner',
    matchers: ['scanner page', 'qr scanner', 'scanner'],
    steps: ['Top-right avatar', 'Scanner'],
  },
  {
    route: '/calculate',
    title: 'Calculate',
    matchers: ['calculate page', 'calculator page', 'calculate', 'calculator'],
    steps: ['Top menu', 'Calculate'],
  },
  {
    route: '/admin',
    title: 'Admin Panel',
    matchers: ['admin page', 'admin panel', 'admin'],
    steps: ['Top-right avatar', 'Admin Panel'],
  },
];

const NAVIGATION_INTENT = [
  'go to',
  'go to the',
  'open',
  'navigate',
  'take me',
  'taken me',
  'took me',
  'redirect',
  'move to',
  'bring me',
  'show me',
  'direct me',
  'route me',
  'i want to',
  'i wanna',
  'let me',
  'goto',
];

const HISTORY_INTENT = [
  'history',
  'see how much',
  'how much transactions',
  'my transactions',
  'transactions i made',
  'what did i spend',
  'who did i pay',
  'to whom i paid',
  'search transactions',
  'find transaction',
];

const TRANSACTION_ADD_INTENT = [
  'add transaction',
  'create transaction',
  'new transaction',
  'make transaction',
  'add expense',
  'create expense',
  'quick transaction',
  'record transaction',
  'log transaction',
  'mujhe transaction karna hai',
  'transaction karna hai',
  'kharcha karna hai',
  'payment karni hai',
  'paise dene',
  'paise bhejne',
  'send money',
  'expense karna hai',
];

const TRANSACTION_PROMPTS = {
  paidBy: 'Who paid for this transaction? Type a username or say "me".',
  paidTo: 'Who received the money?',
  amount: 'How much was it?',
  description: 'What was it for? You can type skip if you want to leave it blank.',
  date: 'What date should I use? Type YYYY-MM-DD or say today.',
};

const normalizeTransactionDraft = (draft = {}) => ({
  paidById: draft.paidById || '',
  paidByUsername: draft.paidByUsername || '',
  paidToId: draft.paidToId || '',
  paidToUsername: draft.paidToUsername || '',
  amount: draft.amount || '',
  description: draft.description || '',
  date: draft.date || new Date().toISOString().split('T')[0],
});

const STOP_WORDS = new Set([
  'i', 'want', 'to', 'see', 'how', 'much', 'transactions', 'transaction', 'made', 'make', 'add', 'the', 'a', 'an',
  'for', 'of', 'my', 'me', 'is', 'was', 'did', 'didnt', 'didn', 'in', 'on', 'at', 'it', 'and', 'what', 'who', 'did',
  'paid', 'pay', 'spent', 'spend', 'for', 'soda', 'show', 'open', 'go', 'goes', 'go to', 'page', 'please', 'could',
]);

const normalizeText = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
}).format(Number(amount) || 0);

const formatShortDate = (dateValue) => {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return 'Unknown date';

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getCurrentUsername = () => {
  const session = getAuthSession();
  return session?.username || localStorage.getItem('username') || '';
};

const getCurrentUserId = () => {
  const session = getAuthSession();
  return session?.userId || localStorage.getItem('userId') || '';
};

const getUserLabel = (user) => {
  if (!user) return 'Unknown';
  return user.username || 'Unknown';
};

const getUserInitials = (user) => {
  if (!user || !user.username) return '??';
  return user.username.slice(0, 2).toUpperCase();
};

const getTransactionType = (expense, currentUsername) => {
  if (!expense) return 'pending';
  if (expense?.paidBy?.username === currentUsername) return 'paid';
  if (expense?.paidTo?.username === currentUsername) return 'received';
  return 'pending';
};

const parseDateInput = (value) => {
  const normalized = normalizeText(value);
  if (!normalized || normalized === 'today') {
    return new Date().toISOString().split('T')[0];
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
};

const extractSearchTerms = (query) => {
  return normalizeText(query)
    .split(' ')
    .filter((word) => word && !STOP_WORDS.has(word));
};

const expenseMatchesQuery = (expense, query, currentUsername) => {
  const normalizedQuery = normalizeText(query);
  const searchableText = normalizeText([
    expense.description,
    expense.paidBy?.username,
    expense.paidTo?.username,
    expense.amount,
    expense.date,
  ].join(' '));

  const searchTerms = extractSearchTerms(query);
  const wantsMyTransactions = /\b(my|i|me)\b.*\b(transaction|transactions|spent|spend|paid)\b/.test(normalizedQuery)
    || normalizedQuery.includes('transactions i made')
    || normalizedQuery.includes('how much transactions i made');

  if (wantsMyTransactions && currentUsername) {
    return expense.paidBy?.username === currentUsername || expense.paidTo?.username === currentUsername;
  }

  if (normalizedQuery.includes('to whom i paid') || normalizedQuery.includes('who did i pay')) {
    return expense.paidBy?.username === currentUsername;
  }

  if (searchTerms.length === 0) {
    return searchableText.includes(normalizedQuery);
  }

  return searchTerms.some((term) => searchableText.includes(term));
};

const summarizeSearchResults = (results, query, currentUsername) => {
  const normalizedQuery = normalizeText(query);
  const totalAmount = results.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const paidCount = results.filter((expense) => expense.paidBy?.username === currentUsername).length;
  const receivedCount = results.filter((expense) => expense.paidTo?.username === currentUsername).length;

  if (results.length === 0) {
    return 'I could not find any matching transactions. Try a different person, amount, or keyword.';
  }

  if (normalizedQuery.includes('how much') || normalizedQuery.includes('total')) {
    return `I found ${results.length} matching transactions worth ${formatCurrency(totalAmount)}.`;
  }

  if (normalizedQuery.includes('to whom i paid') || normalizedQuery.includes('who did i pay')) {
    return `I found ${results.length} payment${results.length === 1 ? '' : 's'} made by you.`;
  }

  if (normalizedQuery.includes('soda')) {
    return `I found ${results.length} transaction${results.length === 1 ? '' : 's'} related to soda.`;
  }

  return `I found ${results.length} matching transaction${results.length === 1 ? '' : 's'}. ${paidCount} sent, ${receivedCount} received.`;
};

const buildTransactionCardData = (draft, users) => {
  const paidBy = users.find((user) => user._id === draft.paidById) || null;
  const paidTo = users.find((user) => user._id === draft.paidToId) || null;

  return {
    ...draft,
    paidBy,
    paidTo,
    status: false,
    settlementConfirmation: {
      paidByConfirmed: false,
      paidToConfirmed: false,
    },
  };
};

const findBestUserMatch = (users, input, currentUsername) => {
  const normalizedInput = normalizeText(input);

  if (!normalizedInput) return null;

  if (['me', 'myself', 'i'].includes(normalizedInput) && currentUsername) {
    return users.find((user) => normalizeText(user.username) === normalizeText(currentUsername)) || null;
  }

  const exactMatch = users.find((user) => normalizeText(user.username) === normalizedInput);
  if (exactMatch) return exactMatch;

  return users.find((user) => normalizeText(user.username).includes(normalizedInput) || normalizedInput.includes(normalizeText(user.username))) || null;
};

const buildPathText = (steps) => `Path: ${steps.join(' → ')}`;

const createNavigationReply = (targetPage) => {
  const buttonLabel = `Open ${targetPage.title}`;
  return {
    text: `Sure. I can take you to the ${targetPage.title} page.\n${buildPathText(targetPage.steps)}\nTap the button below to continue.`,
    cta: {
      label: buttonLabel,
      href: targetPage.route,
    },
  };
};

const createReply = (message) => {
  const normalized = message.toLowerCase();

  const hasNavigationIntent = NAVIGATION_INTENT.some((intent) => normalized.includes(intent));
  const requestedPage = PAGE_NAVIGATION.find((page) => page.matchers.some((matcher) => normalized.includes(matcher)));

  const isLikelyNavigationRequest =
    requestedPage && (
      hasNavigationIntent ||
      normalized.includes('page') ||
      normalized.split(/\s+/).length <= 5
    );

  if (isLikelyNavigationRequest) {
    return createNavigationReply(requestedPage);
  }

  const isTransactionAddRequest = TRANSACTION_ADD_INTENT.some((intent) => normalized.includes(intent));
  if (isTransactionAddRequest) {
    return {
      type: 'start-transaction',
      text: 'Great! Let me help you add a transaction. I will guide you through it step by step.',
    };
  }

  const matchedTopic = Object.keys(HELP_TEXT).find((topic) => normalized.includes(topic));

  if (matchedTopic) {
    return {
      text: HELP_TEXT[matchedTopic],
    };
  }

  if (normalized.includes('hello') || normalized.includes('hi')) {
    return {
      text: 'Hello. Tell me what you want to do in MilBantKar and I will point you to the right step.',
    };
  }

  if (normalized.includes('help')) {
    return {
      text: 'I can help with events, expenses, settlements, reminders, history, profile, and login.',
    };
  }

  return {
    text: 'I do not have a direct answer for that yet, but I can help with events, expenses, settlements, reminders, history, profile, and login.',
  };
};

function AssistantBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([DEFAULT_GREETING]);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(getCurrentUserId());
  const [currentUsername, setCurrentUsername] = useState(getCurrentUsername());
  const [flowMode, setFlowMode] = useState('idle');
  const [transactionStep, setTransactionStep] = useState(null);
  const [transactionDraft, setTransactionDraft] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimersRef = useRef(new Map());
  const chatbotSessionIdRef = useRef(`mbk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const suggestedReplies = useMemo(() => QUICK_TOPICS, []);
  const quickTopics = useMemo(() => {
    if (flowMode === 'transaction') {
      return ['Me paid', 'Another user paid', 'Skip description', 'Today'];
    }

    if (flowMode === 'search') {
      return ['My transactions', 'Who did I pay for soda?', 'How much did I spend?', 'Reset search'];
    }

    return suggestedReplies;
  }, [flowMode, suggestedReplies]);
  const isAssistantTyping = useMemo(
    () => messages.some((message) => message.role === 'assistant' && message.typing),
    [messages]
  );
  const showQuickTopics = isAtBottom && !isAssistantTyping && inputValue.trim().length === 0 && flowMode === 'idle';

  const transactionIsComplete = Boolean(transactionDraft?.paidById && transactionDraft?.paidToId && transactionDraft?.amount);

  useEffect(() => {
    const syncCurrentUser = () => {
      setCurrentUserId(getCurrentUserId());
      setCurrentUsername(getCurrentUsername());
    };

    syncCurrentUser();

    const loadUsers = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/users`);
        if (!response.ok) throw new Error('Failed to load users');
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        try {
          const fallbackResponse = await fetch(`${API_FALLBACK}/api/users`);
          if (!fallbackResponse.ok) throw new Error('Fallback failed');
          const fallbackData = await fallbackResponse.json();
          setUsers(Array.isArray(fallbackData) ? fallbackData : []);
        } catch {
          setUsers([]);
        }
      }
    };

    loadUsers();
  }, []);

  const appendAssistantMessage = (payload) => {
    const messageId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const assistantMessage = {
      id: messageId,
      role: 'assistant',
      text: '',
      fullText: payload.text || '',
      cta: payload.cta || null,
      richType: payload.richType || null,
      richData: payload.richData || null,
      typing: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    startTypingReply(messageId, assistantMessage.fullText);
  };

  const appendUserMessage = (text) => {
    const trimmed = String(text || '').trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role: 'user',
        text: trimmed,
      },
    ]);
  };

  const resetTransactionFlow = () => {
    setFlowMode('idle');
    setTransactionStep(null);
    setTransactionDraft(null);
  };

  const startTransactionFlow = (initialPaidByInput = null) => {
    setFlowMode('transaction');
    const draftBase = {
      paidById: '',
      paidToId: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    };

    const initialPaidBy = initialPaidByInput ? findUserFromMessage(initialPaidByInput) : null;
    if (initialPaidBy) {
      draftBase.paidById = initialPaidBy._id;
      setTransactionDraft(draftBase);
      setTransactionStep('paidTo');
      appendAssistantMessage({ text: `Nice. ${getUserLabel(initialPaidBy)} paid. ${TRANSACTION_PROMPTS.paidTo}` });
      return;
    }

    setTransactionStep('paidBy');
    setTransactionDraft(draftBase);

    appendAssistantMessage({
      text: `Let's add a transaction. ${TRANSACTION_PROMPTS.paidBy}`,
    });
  };

  const findUserFromMessage = (messageText) => findBestUserMatch(users, messageText, currentUsername);

  const handleTransactionFlowInput = (messageText) => {
    const trimmed = messageText.trim();

    if (!transactionStep) {
      startTransactionFlow();
      return;
    }

    if (!transactionDraft) {
      return;
    }

    if (['cancel', 'stop', 'reset'].includes(normalizeText(trimmed))) {
      resetTransactionFlow();
      appendAssistantMessage({ text: 'Transaction draft cleared. You can start again whenever you want.' });
      return;
    }

    if (transactionStep === 'paidBy') {
      const matchedUser = findUserFromMessage(trimmed);
      if (!matchedUser) {
        appendAssistantMessage({ text: 'I could not match that person. Please type a username from your users list.' });
        return;
      }

      setTransactionDraft((prev) => ({ ...prev, paidById: matchedUser._id }));
      setTransactionStep('paidTo');
      appendAssistantMessage({ text: `Got it. ${getUserLabel(matchedUser)} paid. ${TRANSACTION_PROMPTS.paidTo}` });
      return;
    }

    if (transactionStep === 'paidTo') {
      const matchedUser = findUserFromMessage(trimmed);
      if (!matchedUser) {
        appendAssistantMessage({ text: 'I could not match the receiver. Try a username or type part of the name.' });
        return;
      }

      if (matchedUser._id === transactionDraft.paidById) {
        appendAssistantMessage({ text: 'Paid by and paid to cannot be the same person. Please choose another user.' });
        return;
      }

      setTransactionDraft((prev) => ({ ...prev, paidToId: matchedUser._id }));
      setTransactionStep('amount');
      appendAssistantMessage({ text: `Perfect. ${getUserLabel(matchedUser)} received. ${TRANSACTION_PROMPTS.amount}` });
      return;
    }

    if (transactionStep === 'amount') {
      const amountValue = Number(trimmed.replace(/[^0-9.]/g, ''));
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        appendAssistantMessage({ text: 'Please send a valid amount greater than 0.' });
        return;
      }

      setTransactionDraft((prev) => ({ ...prev, amount: String(amountValue) }));
      setTransactionStep('description');
      appendAssistantMessage({ text: `${formatCurrency(amountValue)} recorded. ${TRANSACTION_PROMPTS.description}` });
      return;
    }

    if (transactionStep === 'description') {
      const description = normalizeText(trimmed) === 'skip' ? '' : trimmed;
      setTransactionDraft((prev) => ({ ...prev, description }));
      setTransactionStep('date');
      appendAssistantMessage({ text: `${description ? `Description saved as "${description}".` : 'Description skipped.'} ${TRANSACTION_PROMPTS.date}` });
      return;
    }

    if (transactionStep === 'date') {
      const nextDate = parseDateInput(trimmed);
      const nextDraft = { ...transactionDraft, date: nextDate };
      setTransactionDraft(nextDraft);
      setTransactionStep('confirm');
      setFlowMode('transaction');
      appendAssistantMessage({
        text: 'Transaction draft is ready. Review it below, then click Confirm Transaction.',
        richType: 'transactionDraft',
        richData: { draft: buildTransactionCardData(nextDraft, users), currentUsername },
      });
    }
  };

  const runHistorySearch = async (queryText) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      appendAssistantMessage({ text: 'Please tell me what you want to search for, like soda, total spending, or who you paid.' });
      return;
    }

    setFlowMode('search');

    const normalizedQuery = normalizeText(trimmed);
    const searchTerms = extractSearchTerms(trimmed);
    const isVagueSearch = searchTerms.length === 0 || (searchTerms.length === 1 && STOP_WORDS.has(searchTerms[0]));

    if (isVagueSearch && !normalizedQuery.includes('my transactions') && !normalizedQuery.includes('all')) {
      appendAssistantMessage({
        text: 'I need more details to search your history. Are you looking for:\n- Transactions with a specific person (name)?\n- Transactions for a specific item (e.g., coffee, rent)?\n- Transactions in a certain amount range?\n\nTell me more and I will find them.',
      });
      return;
    }

    appendAssistantMessage({ text: 'Searching your history...' });

    const fetchExpenses = async () => {
      const primaryResponse = await fetch(`${API_BASE}/api/expense`);
      if (!primaryResponse.ok) throw new Error('Primary expense fetch failed');
      return primaryResponse.json();
    };

    let expenses = [];
    try {
      expenses = await fetchExpenses();
    } catch {
      try {
        const fallbackResponse = await fetch(`${API_FALLBACK}/api/expense`);
        if (!fallbackResponse.ok) throw new Error('Fallback expense fetch failed');
        expenses = await fallbackResponse.json();
      } catch {
        appendAssistantMessage({ text: 'I could not load your transaction history right now. Please try again shortly.' });
        return;
      }
    }

    const relevantExpenses = expenses.filter((expense) => expenseMatchesQuery(expense, trimmed, currentUsername));
    const summaryText = summarizeSearchResults(relevantExpenses, trimmed, currentUsername);

    appendAssistantMessage({
      text: summaryText,
      richType: 'searchResults',
      richData: {
        query: trimmed,
        results: relevantExpenses.slice(0, 5),
        totalCount: relevantExpenses.length,
        currentUsername,
      },
    });
  };

  const checkIsAtBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const threshold = 10;
    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
    setIsAtBottom(atBottom);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    checkIsAtBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    const timers = typingTimersRef.current;

    return () => {
      timers.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      timers.clear();
    };
  }, []);

  const startTypingReply = (messageId, fullText) => {
    const typeNext = (index) => {
      setMessages((prev) => prev.map((message) => {
        if (message.id !== messageId) {
          return message;
        }

        const nextText = fullText.slice(0, index);
        const isTyping = index < fullText.length;

        return {
          ...message,
          text: nextText,
          typing: isTyping,
        };
      }));

      if (index < fullText.length) {
        const timerId = window.setTimeout(() => typeNext(index + 1), index === 0 ? 320 : 24);
        typingTimersRef.current.set(messageId, timerId);
      } else {
        typingTimersRef.current.delete(messageId);
      }
    };

    typeNext(0);
  };

  const sendMessage = async (messageText, options = {}) => {
    const { preferLocal = false, skipUserMessage = false, transactionContext = null } = options;
    const trimmed = messageText.trim();
    if (!trimmed) return;
    const userMessageId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const assistantMessageId = `${userMessageId}-reply`;

    setInputValue('');

    if (!skipUserMessage) {
      const userMessage = { id: userMessageId, role: 'user', text: trimmed };
      setMessages((prev) => [...prev, userMessage]);
    }

    if (!preferLocal) {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          text: '',
          fullText: '',
          typing: true,
        },
      ]);
    }

    if (preferLocal) {
      const replyPayload = createReply(trimmed);

      if (replyPayload.type === 'start-transaction') {
        startTransactionFlow();
        return;
      }

      appendAssistantMessage(replyPayload);
      return;
    }

    try {
      const callChat = async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/chatbot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUserId || null,
            sessionId: chatbotSessionIdRef.current,
            message: trimmed,
            conversationType: transactionContext ? 'transaction' : 'chat',
            transactionStep: transactionContext?.step || null,
            transactionDraft: transactionContext?.draft || null,
          }),
        });

        let result = null;
        try {
          result = await response.json();
        } catch {
          result = null;
        }

        if (!response.ok) {
          throw new Error(result?.message || 'Failed to load assistant response');
        }

        return result;
      };

      let result = null;

      try {
        result = await callChat(CHATBOT_API_BASE);
      } catch {
        result = await callChat(CHATBOT_API_FALLBACK);
      }

      if (String(result?.actionType || '').toLowerCase() === 'start_transaction') {
        const flowData = result?.richData || {};

        if (flowData?.draft) {
          setTransactionDraft(normalizeTransactionDraft(flowData.draft));
          setTransactionStep(flowData.nextStep || 'paidBy');
          setFlowMode('transaction');
        } else {
          startTransactionFlow();
        }

        const isReadyForConfirm = String(result?.richType || '').toLowerCase() === 'transactiondraft';

        const assistantMessage = {
          id: assistantMessageId,
          role: 'assistant',
          text: '',
          fullText: result?.reply || 'I can help you add that transaction step by step.',
          cta: result?.cta || null,
          richType: isReadyForConfirm ? 'transactionDraft' : result?.richType || null,
          richData: isReadyForConfirm && flowData?.draft
            ? { draft: buildTransactionCardData(normalizeTransactionDraft(flowData.draft), users), currentUsername }
            : result?.richData || null,
          typing: true,
        };

        setMessages((prev) => prev.map((message) => (
          message.id === assistantMessageId
            ? { ...message, cta: assistantMessage.cta, richType: assistantMessage.richType, richData: assistantMessage.richData }
            : message
        )));
        startTypingReply(assistantMessageId, assistantMessage.fullText);
        return;
      }

      const assistantPayload = {
        text: result?.reply || 'I have a response for you.',
        cta: result?.cta || null,
        richType: result?.richType || null,
        richData: result?.richData || null,
      };

      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant',
        text: '',
        fullText: assistantPayload.text,
        cta: assistantPayload.cta,
        richType: assistantPayload.richType,
        richData: assistantPayload.richData,
        typing: true,
      };

      setMessages((prev) => prev.map((message) => (
        message.id === assistantMessageId
          ? { ...message, cta: assistantMessage.cta, richType: assistantMessage.richType, richData: assistantMessage.richData }
          : message
      )));
      startTypingReply(assistantMessageId, assistantPayload.text);
    } catch (error) {
      if (transactionContext) {
        if (!transactionContext.step) {
          startTransactionFlow();
          return;
        }

        handleTransactionFlowInput(trimmed);
        return;
      }

      const replyPayload = createReply(trimmed);

      if (replyPayload.type === 'start-transaction') {
        startTransactionFlow();
        return;
      }

      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant',
        text: '',
        fullText: replyPayload.text,
        cta: replyPayload.cta,
        richType: replyPayload.richType,
        richData: replyPayload.richData,
        typing: true,
      };

      setMessages((prev) => prev.map((message) => (
        message.id === assistantMessageId
          ? { ...message, cta: assistantMessage.cta, richType: assistantMessage.richType, richData: assistantMessage.richData }
          : message
      )));
      startTypingReply(assistantMessageId, replyPayload.text);
    }
  };

  const handleRouteRedirect = (href) => {
    if (!href) return;
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };

  const confirmTransaction = async () => {
    if (!transactionDraft || !transactionDraft.paidById || !transactionDraft.paidToId || !transactionDraft.amount) {
      appendAssistantMessage({ text: 'The transaction draft is incomplete. Please start again.' });
      return;
    }

    const payload = {
      paidBy: transactionDraft.paidById,
      paidTo: transactionDraft.paidToId,
      amount: transactionDraft.amount,
      description: transactionDraft.description,
      date: transactionDraft.date,
    };

    try {
      const postTransaction = async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/expense/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        let result = null;
        try {
          result = await response.json();
        } catch {
          result = null;
        }

        if (!response.ok) {
          throw new Error(result?.message || 'Failed to add transaction');
        }

        return result;
      };

      let result = null;
      try {
        result = await postTransaction(API_BASE);
      } catch {
        result = await postTransaction(API_FALLBACK);
      }

      const paidBy = users.find((user) => user._id === transactionDraft.paidById) || null;
      const paidTo = users.find((user) => user._id === transactionDraft.paidToId) || null;
      const newTransaction = {
        _id: result?.data?._id || `${Date.now()}`,
        paidBy,
        paidTo,
        amount: transactionDraft.amount,
        description: transactionDraft.description,
        date: transactionDraft.date,
        status: false,
        settlementConfirmation: {
          paidByConfirmed: false,
          paidToConfirmed: false,
        },
      };

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-success`,
          role: 'assistant',
          text: `Transaction added successfully. It will appear in History once the page refreshes.`,
          fullText: `Transaction added successfully. It will appear in History once the page refreshes.`,
          typing: false,
          richType: 'transactionResult',
          richData: { transaction: newTransaction, currentUsername },
        },
      ]);

      resetTransactionFlow();
    } catch (error) {
      appendAssistantMessage({ text: `I could not add the transaction: ${error.message}` });
    }
  };

  const handleAssistantAction = (action) => {
    if (!action) return;

    if (action.href) {
      handleRouteRedirect(action.href);
      return;
    }

    if (action.type === 'route') {
      handleRouteRedirect(action.href);
      return;
    }

    if (action.type === 'confirm-transaction') {
      confirmTransaction();
      return;
    }

    if (action.type === 'quick-input') {
      if (action.value === 'reset-search') {
        setFlowMode('idle');
        appendAssistantMessage({ text: 'Search cleared. You can ask me for another history lookup.' });
        return;
      }

      if (action.value === 'my-transactions') {
        runHistorySearch('how much transactions i made');
        return;
      }

      if (action.value === 'soda-search') {
        runHistorySearch('soda');
        return;
      }

      if (action.value === 'spent-summary') {
        runHistorySearch('how much did i spend');
        return;
      }

      if (action.value === 'me-paid') {
        startTransactionFlow('me');
        return;
      }

      if (action.value === 'another-user-paid') {
        startTransactionFlow();
      }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (flowMode === 'transaction' && transactionStep) {
      appendUserMessage(trimmed);
      sendMessage(trimmed, {
        skipUserMessage: true,
        transactionContext: {
          step: transactionStep,
          draft: transactionDraft,
        },
      });
      setInputValue('');
      return;
    }

    const isTransactionAddRequest = TRANSACTION_ADD_INTENT.some((intent) => normalizeText(trimmed).includes(intent));
    if (isTransactionAddRequest) {
      appendUserMessage(trimmed);
      setInputValue('');
      sendMessage(trimmed, {
        skipUserMessage: true,
        transactionContext: {
          step: transactionStep || null,
          draft: transactionDraft || null,
        },
      });
      return;
    }

    sendMessage(trimmed);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .assistant-launcher {
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 9998;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          padding-bottom: 68px;
          pointer-events: none;
          isolation: isolate;
        }

        .assistant-launcher.is-open .assistant-launch-label {
          display: none;
        }

        .assistant-card {
          width: min(420px, calc(100vw - 32px));
          max-height: min(650px, calc(100vh - 100px));
          background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
          color: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 18px;
          box-shadow: 0 24px 70px rgba(2, 6, 23, 0.42);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          pointer-events: auto;
          animation: assistantPop 0.2s ease-out;
          font-family: 'Poppins', sans-serif;
        }

        .assistant-card,
        .assistant-messages,
        .assistant-quick-actions {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.55) rgba(15, 23, 42, 0.6);
        }

        .assistant-card ::-webkit-scrollbar,
        .assistant-messages::-webkit-scrollbar,
        .assistant-quick-actions::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .assistant-card ::-webkit-scrollbar-track,
        .assistant-messages::-webkit-scrollbar-track,
        .assistant-quick-actions::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.96);
          border-radius: 999px;
        }

        .assistant-card ::-webkit-scrollbar-thumb,
        .assistant-messages::-webkit-scrollbar-thumb,
        .assistant-quick-actions::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.45);
          border-radius: 999px;
        }

        .assistant-card ::-webkit-scrollbar-thumb:hover,
        .assistant-messages::-webkit-scrollbar-thumb:hover,
        .assistant-quick-actions::-webkit-scrollbar-thumb:hover {
          background: rgba(226, 232, 240, 0.7);
        }

        @keyframes assistantPop {
          from { transform: translateY(10px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .assistant-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.92));
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
        }

        .assistant-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.3px;
        }

        .assistant-title-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .assistant-title-main {
          font-size: 14px;
          font-weight: 600;
          color: #f8fafc;
        }

        .assistant-title-sub {
          font-size: 11px;
          color: rgba(226, 232, 240, 0.7);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .assistant-online-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .assistant-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #5B4EE8, #14B8A6);
          color: #fff;
          box-shadow: 0 4px 12px rgba(91, 78, 232, 0.25);
          flex-shrink: 0;
        }

        .assistant-close {
          border: none;
          background: transparent;
          color: rgba(226, 232, 240, 0.75);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .assistant-close:hover {
          background: rgba(148, 163, 184, 0.14);
          color: #fff;
        }

        .assistant-body {
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding: 12px;
          gap: 10px;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.96));
        }

        .assistant-messages {
          flex: 1;
          min-height: 280px;
          max-height: 400px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 2px;
          overscroll-behavior: contain;
        }

        .assistant-message {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          width: 100%;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .assistant-message.user {
          align-items: flex-end;
        }

        .assistant-bubble {
          max-width: 85%;
          padding: 10px 12px;
          border-radius: 14px;
          line-height: 1.5;
          font-size: 13px;
          font-weight: 500;
          white-space: pre-wrap;
          word-break: break-word;
          background: rgba(15, 23, 42, 0.9);
          color: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-bottom-left-radius: 4px;
          box-shadow: 0 8px 20px rgba(2, 6, 23, 0.22);
        }

        .assistant-message.user .assistant-bubble {
          background: linear-gradient(135deg, #2563eb, #0f766e);
          color: #fff;
          border: none;
          border-bottom-right-radius: 4px;
          border-bottom-left-radius: 14px;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.34);
        }

        .assistant-message.assistant .assistant-bubble.with-cta {
          padding-bottom: 8px;
        }

        .assistant-cta-wrap {
          margin-top: 8px;
        }

        .assistant-cta-button {
          border: 1px solid rgba(96, 165, 250, 0.7);
          color: #dbeafe;
          background: rgba(37, 99, 235, 0.14);
          border-radius: 8px;
          padding: 7px 11px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.2px;
          min-height: 32px;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          transition: all 0.2s;
        }

        .assistant-cta-button:hover {
          background: rgba(37, 99, 235, 0.24);
          border-color: rgba(147, 197, 253, 0.95);
        }

        .assistant-message.assistant .assistant-bubble.typing {
          position: relative;
        }

        .assistant-message.assistant .assistant-bubble.typing::after {
          content: '';
          display: inline-block;
          width: 6px;
          height: 1em;
          margin-left: 3px;
          background: var(--color-text-secondary);
          vertical-align: -0.15em;
          animation: caretBlink 0.8s steps(2, start) infinite;
        }

        @keyframes caretBlink {
          0%, 45% { opacity: 1; }
          46%, 100% { opacity: 0; }
        }

        .assistant-typing-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          min-height: 1.2em;
        }

        .assistant-typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(226, 232, 240, 0.8);
          animation: dotBounce 1s infinite ease-in-out;
        }

        .assistant-typing-indicator span:nth-child(2) {
          animation-delay: 0.14s;
        }

        .assistant-typing-indicator span:nth-child(3) {
          animation-delay: 0.28s;
        }

        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-4px); opacity: 1; }
        }

        .assistant-quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-height: 76px;
          overflow-y: auto;
          padding-right: 2px;
          transition: opacity 0.2s ease, transform 0.2s ease, max-height 0.2s ease, margin 0.2s ease;
          transform-origin: bottom;
        }

        .assistant-quick-actions.hidden {
          opacity: 0;
          transform: translateY(8px);
          max-height: 0;
          margin: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .assistant-quick-actions.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .assistant-chip {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.84);
          color: rgba(248, 250, 252, 0.9);
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 12px;
          text-align: center;
          transition: all 0.15s ease;
          min-height: 32px;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
        }

        .assistant-chip:hover {
          transform: translateY(-1px);
          background: rgba(30, 41, 59, 0.96);
          border-color: rgba(96, 165, 250, 0.55);
          color: #fff;
        }

        .assistant-form {
          display: flex;
          gap: 8px;
          align-items: center;
          position: sticky;
          bottom: 0;
          padding-top: 2px;
        }

        .assistant-input {
          flex: 1;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(15, 23, 42, 0.88);
          color: #f8fafc;
          border-radius: 10px;
          padding: 10px 12px;
          outline: none;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          transition: all 0.2s;
        }

        .assistant-input:focus {
          border-color: rgba(96, 165, 250, 0.9);
          background: rgba(15, 23, 42, 0.98);
        }

        .assistant-input::placeholder {
          color: rgba(226, 232, 240, 0.5);
        }

        .assistant-rich-wrap {
          margin-top: 8px;
          width: 100%;
          align-self: stretch;
        }

        /* Search Results Styles */
        .assistant-search-summary {
          background: rgba(15, 23, 42, 0.88);
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
          border: 1px solid rgba(148, 163, 184, 0.14);
        }

        .assistant-search-summary-label {
          color: rgba(226, 232, 240, 0.7);
        }

        .assistant-search-summary-value {
          font-weight: 600;
          color: #f8fafc;
        }

        .assistant-search-results {
          display: grid;
          gap: 8px;
        }

        .assistant-result-card {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.88));
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 12px;
          padding: 11px 12px;
          font-size: 12px;
          transition: all 0.2s;
        }

        .assistant-result-card:hover {
          border-color: rgba(96, 165, 250, 0.4);
          box-shadow: 0 8px 24px rgba(2, 6, 23, 0.24);
        }

        .assistant-result-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }

        .assistant-result-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .badge-paid {
          background: rgba(245, 158, 11, 0.18);
          color: #fde68a;
        }

        .badge-received {
          background: rgba(16, 185, 129, 0.18);
          color: #a7f3d0;
        }

        .badge-settled {
          background: rgba(139, 92, 246, 0.18);
          color: #ddd6fe;
        }

        .assistant-result-date {
          font-size: 10px;
          color: rgba(226, 232, 240, 0.66);
        }

        .assistant-result-desc {
          font-size: 13px;
          font-weight: 500;
          color: #f8fafc;
          margin-bottom: 8px;
        }

        .assistant-result-people {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-size: 11px;
          color: rgba(226, 232, 240, 0.72);
        }

        .assistant-person-avatar {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 600;
          color: #fff;
          flex-shrink: 0;
        }

        .avatar-from {
          background: linear-gradient(135deg, #5B4EE8, #4F46E5);
        }

        .avatar-to {
          background: linear-gradient(135deg, #14B8A6, #0D9488);
        }

        .assistant-arrow-icon {
          color: rgba(226, 232, 240, 0.65);
          font-size: 11px;
          flex-shrink: 0;
        }

        .assistant-result-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(148, 163, 184, 0.14);
          padding-top: 8px;
        }

        .assistant-result-amount {
          font-size: 13px;
          font-weight: 600;
        }

        .amount-out {
          color: #dc2626;
        }

        .amount-in {
          color: #059669;
        }

        .assistant-result-status {
          font-size: 10px;
          color: rgba(226, 232, 240, 0.66);
        }

        /* Draft Card Styles */
        .assistant-transaction-card {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.9));
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 12px;
          padding: 12px;
          margin-top: 6px;
        }

        .assistant-transaction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .assistant-chip-label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(91, 78, 232, 0.2);
          color: #ddd6fe;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .assistant-chip-subtext {
          color: rgba(226, 232, 240, 0.72);
          font-size: 10px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .bg-warning {
          background: rgba(245, 158, 11, 0.18);
          color: #fde68a;
        }

        .bg-success {
          background: rgba(16, 185, 129, 0.18);
          color: #a7f3d0;
        }

        .text-white {
          color: #fff;
        }

        .text-dark {
          color: #111827;
        }

        .assistant-transaction-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 8px;
        }

        .assistant-transaction-field {
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 8px;
          padding: 8px 10px;
        }

        .assistant-transaction-label {
          font-size: 10px;
          color: rgba(226, 232, 240, 0.7);
          margin-bottom: 2px;
        }

        .assistant-transaction-value {
          font-weight: 600;
          font-size: 13px;
          color: #f8fafc;
          margin: 0;
        }

        .assistant-transaction-value.amount {
          color: #93c5fd;
        }

        .assistant-transaction-desc {
          margin-top: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.16);
          line-height: 1.4;
          font-size: 12px;
          color: #f8fafc;
        }

        .assistant-transaction-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .assistant-confirm-button,
        .assistant-secondary-button {
          border: none;
          border-radius: 8px;
          padding: 9px 12px;
          font-weight: 500;
          transition: all 0.2s ease;
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          cursor: pointer;
        }

        .assistant-confirm-button {
          background: linear-gradient(135deg, #5B4EE8, #14B8A6);
          color: #fff;
          flex: 1;
          min-height: 36px;
        }

        .assistant-confirm-button:disabled {
          background: linear-gradient(135deg, #2563eb, #0f766e);
          cursor: not-allowed;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.26);
        }

        .assistant-confirm-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(37, 99, 235, 0.32);
        }

        .assistant-secondary-button {
          background: rgba(15, 23, 42, 0.9);
          color: #e2e8f0;
          border: 1px solid rgba(148, 163, 184, 0.18);
        }

        .assistant-secondary-button:hover {
          background: rgba(30, 41, 59, 0.96);
          border-color: rgba(96, 165, 250, 0.55);
        }

        .assistant-transaction-hint {
          font-size: 10px;
          color: var(--color-text-secondary);
          color: rgba(226, 232, 240, 0.66);
          display: block;
        }

        .assistant-send {
          border: none;
          border-radius: 10px;
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #5B4EE8, #14B8A6);
          color: #fff;
          box-shadow: 0 4px 12px rgba(91, 78, 232, 0.25);
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .assistant-send:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(91, 78, 232, 0.3);
        }

        .assistant-launch-button {
          pointer-events: auto;
          border: none;
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 10002;
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #5B4EE8, #14B8A6);
          color: #fff;
          box-shadow: 0 8px 24px rgba(91, 78, 232, 0.3);
          cursor: pointer;
          transition: all 0.3s;
        }

        .assistant-launch-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(91, 78, 232, 0.4);
        }

        .assistant-launch-button::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 18px;
          border: 2px solid rgba(91, 78, 232, 0.2);
          animation: pulseRing 2.4s infinite;
        }

        @keyframes pulseRing {
          0% { transform: scale(0.95); opacity: 0.8; }
          70% { transform: scale(1.15); opacity: 0; }
          100% { opacity: 0; }
        }

        .assistant-launch-label {
          pointer-events: auto;
          background: var(--color-background-primary);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border-secondary);
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          font-weight: 500;
        }

        .assistant-launcher.is-open {
          padding-bottom: 0;
        }

        .assistant-launcher.is-open .assistant-launch-button {
          opacity: 0;
          pointer-events: none;
          transform: scale(0.85);
        }

        @media (max-width: 480px) {
          .assistant-launcher {
            right: 8px;
            bottom: max(10px, env(safe-area-inset-bottom));
            left: 8px;
            align-items: stretch;
            padding-bottom: 60px;
          }

          .assistant-card {
            width: 100%;
            max-height: min(74dvh, calc(100vh - 120px));
            border-radius: 16px;
            background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
          }

          .assistant-header {
            padding: 12px;
          }

          .assistant-body {
            padding: 10px;
            gap: 8px;
            background: linear-gradient(180deg, rgba(11, 18, 32, 0.98), rgba(17, 24, 39, 0.98));
          }

          .assistant-launch-button {
            right: 8px;
            bottom: max(10px, env(safe-area-inset-bottom));
            width: 48px;
            height: 48px;
            border-radius: 12px;
          }

          .assistant-messages {
            min-height: 200px;
            max-height: 45dvh;
          }

          .assistant-quick-actions {
            max-height: 80px;
            overflow-x: auto;
            overflow-y: hidden;
            flex-wrap: nowrap;
            padding-bottom: 2px;
          }

          .assistant-chip {
            white-space: nowrap;
            flex: 0 0 auto;
          }

          .assistant-input {
            padding: 9px 10px;
            background: rgba(15, 23, 42, 0.96);
            color: #f8fafc;
          }

          .assistant-send {
            width: 34px;
            height: 34px;
          }

          .assistant-launch-label {
            align-self: flex-end;
            max-width: 70vw;
          }

          .assistant-launcher.is-open {
            padding-bottom: 0;
          }

          .assistant-launcher.is-open .assistant-launch-button {
            opacity: 0;
            pointer-events: none;
          }

          .assistant-search-summary,
          .assistant-result-card {
            background: rgba(15, 23, 42, 0.96);
            color: #f8fafc;
            font-size: 11px;
          }

          .assistant-bubble {
            max-width: 90%;
            font-size: 12px;
            background: rgba(15, 23, 42, 0.96);
            color: #f8fafc;
          }

          .assistant-message.user .assistant-bubble {
            background: linear-gradient(135deg, #2563eb, #0f766e);
            color: #fff;
          }

          .assistant-chip,
          .assistant-cta-button,
          .assistant-confirm-button,
          .assistant-secondary-button {
            font-size: 11px;
          }
        }

        @media (max-height: 700px) {
          .assistant-card {
            max-height: calc(100vh - 74px);
          }

          .assistant-header {
            padding: 10px 12px;
          }

          .assistant-body {
            padding: 8px;
            gap: 6px;
          }

          .assistant-messages {
            min-height: 150px;
            max-height: 35vh;
          }

          .assistant-quick-actions {
            max-height: 50px;
          }
        }
      `}</style>

      <div className={`assistant-launcher ${isOpen ? 'is-open' : ''}`}>
        {isOpen ? (
          <div className="assistant-card" role="dialog" aria-label="MilBantKar assistant chat">
            <div className="assistant-header">
              <div className="assistant-title">
                <div className="assistant-badge">
                  <Bot size={18} />
                </div>
                <div className="assistant-title-text">
                  <div className="assistant-title-main">MilBantKar</div>
                  <div className="assistant-title-sub">
                    <span className="assistant-online-dot"></span>Online
                  </div>
                </div>
              </div>
              <button className="assistant-close" onClick={() => setIsOpen(false)} aria-label="Close assistant chat">
                <X size={16} />
              </button>
            </div>

            <div className="assistant-body">
              <div className="assistant-messages" ref={messagesContainerRef} onScroll={checkIsAtBottom}>
                {messages.map((message, index) => (
                  <div key={message.id || `${message.role}-${index}`} className={`assistant-message ${message.role}`}>
                    <div className={`assistant-bubble ${message.typing ? 'typing' : ''} ${message.cta ? 'with-cta' : ''}`}>
                      {message.typing && !message.text ? (
                        <span className="assistant-typing-indicator" aria-label="Assistant is typing">
                          <span></span>
                          <span></span>
                          <span></span>
                        </span>
                      ) : (
                        <>
                          {message.text}
                          {!message.typing && message.cta ? (
                            <div className="assistant-cta-wrap">
                              <button
                                type="button"
                                className="assistant-cta-button"
                                onClick={() => handleAssistantAction(message.cta)}
                              >
                                {message.cta.label}
                              </button>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>

                    {/* Transaction Draft Card */}
                    {!message.typing && message.richType === 'transactionDraft' ? (
                      <div className="assistant-rich-wrap">
                        <div className="assistant-transaction-card">
                          <div className="assistant-transaction-header">
                            <div>
                              <span className="assistant-chip-label">Draft</span>
                              <span className="assistant-chip-subtext" style={{ marginLeft: '6px' }}>Review before confirming</span>
                            </div>
                            <span className="status-badge bg-warning text-dark">Pending</span>
                          </div>
                          <div className="assistant-transaction-grid">
                            <div className="assistant-transaction-field">
                              <div className="assistant-transaction-label">Paid by</div>
                              <div className="assistant-transaction-value">{getUserLabel(message.richData?.draft?.paidBy)}</div>
                            </div>
                            <div className="assistant-transaction-field">
                              <div className="assistant-transaction-label">Paid to</div>
                              <div className="assistant-transaction-value">{getUserLabel(message.richData?.draft?.paidTo)}</div>
                            </div>
                            <div className="assistant-transaction-field">
                              <div className="assistant-transaction-label">Amount</div>
                              <div className="assistant-transaction-value amount">{formatCurrency(message.richData?.draft?.amount)}</div>
                            </div>
                            <div className="assistant-transaction-field">
                              <div className="assistant-transaction-label">Date</div>
                              <div className="assistant-transaction-value">{formatShortDate(message.richData?.draft?.date)}</div>
                            </div>
                          </div>
                          {message.richData?.draft?.description ? (
                            <div className="assistant-transaction-desc">{message.richData.draft.description}</div>
                          ) : null}
                          <div className="assistant-transaction-actions">
                            <button
                              type="button"
                              className="assistant-confirm-button"
                              onClick={() => handleAssistantAction({ type: 'confirm-transaction' })}
                              disabled={!transactionIsComplete}
                            >
                              Confirm Transaction
                            </button>
                            <button
                              type="button"
                              className="assistant-secondary-button"
                              onClick={() => resetTransactionFlow()}
                            >
                              Cancel
                            </button>
                          </div>
                          <small className="assistant-transaction-hint">Click Confirm when everything looks correct.</small>
                        </div>
                      </div>
                    ) : null}

                    {/* Search Results */}
                    {!message.typing && message.richType === 'searchResults' ? (
                      <div className="assistant-rich-wrap">
                        {message.richData?.results?.length ? (
                          <>
                            <div className="assistant-search-summary">
                              <span className="assistant-search-summary-label">Total found</span>
                              <span className="assistant-search-summary-value">
                                {message.richData.results.length} transaction{message.richData.results.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {(() => {
                              const showTotal = message.richData.results.length > 1;
                              const totalAmount = message.richData.results.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

                              return (
                                <>
                                  <div className="assistant-search-results">
                                    {message.richData.results.map((expense) => {
                                      const type = getTransactionType(expense, message.richData.currentUsername);

                                      return (
                                        <div key={expense._id} className="assistant-result-card">
                                          <div className="assistant-result-top">
                                            <span className={`assistant-result-badge ${
                                              expense.status ? 'badge-settled' : type === 'paid' ? 'badge-paid' : 'badge-received'
                                            }`}>
                                              {expense.status ? 'Settled' : type === 'paid' ? 'You paid' : 'You received'}
                                            </span>
                                            <span className="assistant-result-date">{formatShortDate(expense.date)}</span>
                                          </div>
                                          <div className="assistant-result-desc">{expense.description || 'No description'}</div>
                                          <div className="assistant-result-people">
                                            <div className="assistant-person-avatar avatar-from">{getUserInitials(expense.paidBy)}</div>
                                            <span>{expense.paidBy?.username || 'Unknown'}</span>
                                            <span className="assistant-arrow-icon">→</span>
                                            <div className="assistant-person-avatar avatar-to">{getUserInitials(expense.paidTo)}</div>
                                            <span>{expense.paidTo?.username || 'Unknown'}</span>
                                          </div>
                                          <div className="assistant-result-footer">
                                            <div className={`assistant-result-amount ${type === 'paid' ? 'amount-out' : 'amount-in'}`}>
                                              {type === 'paid' ? '−' : '+'}{formatCurrency(expense.amount)}
                                            </div>
                                            <span className="assistant-result-status">{expense.status ? 'Completed' : 'Pending'}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {showTotal && (
                                    <div className="assistant-search-summary" style={{ marginTop: '8px' }}>
                                      <span className="assistant-search-summary-label">Total amount</span>
                                      <span className="assistant-search-summary-value">
                                        {formatCurrency(totalAmount)}
                                      </span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '12px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                            No matching transactions found. Try a different search.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className={`assistant-quick-actions ${showQuickTopics ? 'visible' : 'hidden'}`}>
                {quickTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className="assistant-chip"
                    onClick={() => {
                      if (topic === 'Me paid') {
                        handleAssistantAction({ type: 'quick-input', value: 'me-paid' });
                        return;
                      }

                      if (topic === 'Another user paid') {
                        handleAssistantAction({ type: 'quick-input', value: 'another-user-paid' });
                        return;
                      }

                      if (topic === 'Skip description') {
                        if (flowMode === 'transaction' && transactionStep === 'description') {
                          handleTransactionFlowInput('skip');
                        }
                        return;
                      }

                      if (topic === 'Today') {
                        if (flowMode === 'transaction' && transactionStep === 'date') {
                          handleTransactionFlowInput('today');
                        }
                        return;
                      }

                      if (topic === 'My transactions') {
                        sendMessage(topic);
                        return;
                      }

                      if (topic === 'Who did I pay for soda?') {
                        sendMessage(topic);
                        return;
                      }

                      if (topic === 'How much did I spend?') {
                        sendMessage(topic);
                        return;
                      }

                      if (topic === 'Reset search') {
                        handleAssistantAction({ type: 'quick-input', value: 'reset-search' });
                        return;
                      }

                      if (QUICK_TOPICS.includes(topic)) {
                        sendMessage(topic, { preferLocal: true });
                        return;
                      }

                      sendMessage(topic);
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <form className="assistant-form" onSubmit={handleSubmit}>
                <input
                  className="assistant-input"
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Ask something…"
                />
                <button className="assistant-send" type="submit" aria-label="Send message">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="assistant-launch-label">
            <Sparkles size={14} />
            Ask assistant
          </div>
        )}

        <button
          type="button"
          className="assistant-launch-button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Close assistant chat' : 'Open assistant chat'}
        >
          <MessageCircle size={24} />
        </button>
      </div>
    </>
  );
}

export default AssistantBot;