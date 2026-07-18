'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ChatMessage {
  id: string;
  sender: 'visitor' | 'concierge';
  message: string;
  status: string;
  attachment: string | null;
  createdAt: string;
  time: string;
}

const WHATSAPP_NUMBER = '918780389067';

function isBusinessOpen(): boolean {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = now.getDay(); // 0=Sun, 6=Sat
  const hour = now.getHours();
  return day >= 1 && day <= 6 && hour >= 10 && hour < 20;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [productTitle, setProductTitle] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [hasSentFirst, setHasSentFirst] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const businessOpen = isBusinessOpen();

  // Detect current page context
  useEffect(() => {
    setProductTitle(document.title.replace(' – LVS Trendz', '').replace(' - LVS Trendz', ''));
    setProductUrl(window.location.href);
  }, []);

  // Scroll feed to bottom
  const scrollToBottom = useCallback(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, []);

  // Poll for messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/messages');
      const data = await res.json();
      if (!data.success) return;

      const msgs: ChatMessage[] = data.data?.messages || [];
      setAdminTyping(!!data.data?.admin_typing);

      setMessages((prev) => {
        const prevCount = prev.filter((m) => m.sender === 'concierge').length;
        const newCount = msgs.filter((m) => m.sender === 'concierge').length;

        // Count new unread concierge messages if popup is closed
        if (!isOpen && newCount > prevCount) {
          setUnreadCount((c) => c + (newCount - prevCount));
        }

        return msgs;
      });
    } catch {
      // silent fail on poll errors
    }
  }, [isOpen]);

  // Start/stop polling
  useEffect(() => {
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  // Scroll on new messages or typing indicator
  useEffect(() => {
    scrollToBottom();
  }, [messages, adminTyping, scrollToBottom]);

  // Clear unread when opened
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  const sendTypingIndicator = async (isTyping: boolean) => {
    try {
      await fetch('/api/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typing: isTyping }),
      });
    } catch {
      // silent
    }
  };

  const handleMessageInput = (val: string) => {
    setMessageText(val);
    if (!hasSentFirst) return;

    sendTypingIndicator(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTypingIndicator(false), 2500);
  };

  const handleSend = async (text?: string) => {
    const msg = (text || messageText).trim();
    if (!msg || sending) return;

    setSending(true);
    sendTypingIndicator(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          email: email || null,
          productTitle,
          productUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (!emailSubmitted && email) setEmailSubmitted(true);
        setHasSentFirst(true);
        setMessageText('');
        await fetchMessages();
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hello LVS Trendz, I need assistance. Page: ${productUrl}`
  )}`;

  return (
    <>
      {/* Chat Launcher Button */}
      <div
        id="lvs-chat-btn"
        onClick={() => setIsOpen((o) => !o)}
        style={{
          position: 'fixed',
          left: 25,
          bottom: 25,
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: '#214542',
          border: '1px solid rgba(255,255,255,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 999999,
          boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
          transition: 'all .3s cubic-bezier(0.25,1,0.5,1)',
        }}
      >
        <svg width="30" height="30" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 17.5C12 13.9 14.9 11 18.5 11h11C33.1 11 36 13.9 36 17.5v8.2c0 3.6-2.9 6.5-6.5 6.5h-7.3l-7.7 5.1v-6.2A6.48 6.48 0 0 1 12 25.7v-8.2Z" stroke="white" strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M19 20h10M19 25h7" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            background: '#d4af37', color: '#fff',
            borderRadius: '50%', fontSize: 11, fontWeight: 700,
            width: 22, height: 22, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            {unreadCount}
          </div>
        )}
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,.3)',
            zIndex: 99998,
          }}
        />
      )}

      {/* Chat Popup */}
      <div
        id="lvs-chat-popup"
        style={{
          position: 'fixed',
          left: 25,
          bottom: 100,
          width: 390,
          maxWidth: 'calc(100vw - 30px)',
          background: '#fff',
          borderRadius: 20,
          overflow: 'hidden',
          zIndex: 99999,
          boxShadow: '0 20px 50px rgba(0,0,0,0.14)',
          transition: 'all .3s cubic-bezier(0.25,1,0.5,1)',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - 120px)',
        }}
      >
        {/* Header */}
        <div style={{
          background: '#111', color: '#fff',
          padding: '0 22px', height: 60,
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <path d="M12 17.5C12 13.9 14.9 11 18.5 11h11C33.1 11 36 13.9 36 17.5v8.2c0 3.6-2.9 6.5-6.5 6.5h-7.3l-7.7 5.1v-6.2A6.48 6.48 0 0 1 12 25.7v-8.2Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M19 20h10M19 25h7" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ color: '#d4af37', fontWeight: 700, fontSize: 15, letterSpacing: '.04em', textAlign: 'center' }}>
            LVS Trendz
          </span>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              justifySelf: 'end', background: 'none',
              border: 'none', color: '#fff', fontSize: 28,
              cursor: 'pointer', opacity: .6, lineHeight: 1,
              padding: 0, transition: 'all .2s',
            }}
          >
            ×
          </button>
        </div>

        {/* Message Feed */}
        <div
          ref={feedRef}
          style={{
            flex: 1, overflowY: 'auto', padding: 16,
            background: '#fafafa', display: 'flex',
            flexDirection: 'column', gap: 10,
            minHeight: 200,
          }}
        >
          {/* Welcome */}
          <div style={{
            background: '#fff', border: '1px solid #f0f0f0',
            borderRadius: 14, padding: '14px 16px',
            fontSize: 13.5, lineHeight: 1.5, color: '#333',
          }}>
            <strong>Welcome to LV&apos;s Trendz.</strong><br /><br />
            Our style team is available to assist with:
            <ul style={{ paddingLeft: 18, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Ethnic wear styling</li>
              <li>Size and fit guidance</li>
              <li>Occasion wear recommendations</li>
              <li>Order and delivery assistance</li>
            </ul>
          </div>

          {/* Hours */}
          <div style={{
            padding: '9px 12px', borderRadius: 12,
            fontSize: 12, textAlign: 'center',
            background: businessOpen ? '#f3fbf6' : '#fffcf3',
            border: `1px solid ${businessOpen ? '#d6efdf' : '#f3e9ca'}`,
            color: businessOpen ? '#24643a' : '#9a7620',
          }}>
            {businessOpen
              ? 'Style concierge available now: 10 AM – 8 PM IST, Mon–Sat'
              : 'Style concierge is currently away. Leave a message or WhatsApp us.'}
          </div>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 40, background: '#214542', color: '#fff',
              borderRadius: 999, textDecoration: 'none',
              fontSize: 13, fontWeight: 600, letterSpacing: '.02em',
            }}
          >
            Continue on WhatsApp
          </a>

          {/* Quick Replies */}
          {!hasSentFirst && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['I need help choosing ethnic wear for an occasion.', 'I need size and fit guidance.', 'I need help with an existing order.', 'I need styling recommendations.'].map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  style={{
                    background: '#fff', border: '1px solid #e3e3e3',
                    color: '#111', borderRadius: 999,
                    padding: '8px 10px', fontSize: 11.5,
                    cursor: 'pointer', lineHeight: 1.2,
                  }}
                >
                  {['Occasion Wear', 'Size Guidance', 'Order Help', 'Styling Help'][i]}
                </button>
              ))}
            </div>
          )}

          {/* Product Context */}
          {productTitle && productTitle !== document.title && (
            <div style={{
              background: '#fffcf3', border: '1px solid #f3e9ca',
              padding: '10px 14px', borderRadius: 12,
              fontSize: 12, color: '#b69324', textAlign: 'center',
            }}>
              Inquiring about: <strong>{productTitle}</strong>
            </div>
          )}

          {/* Conversation */}
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: m.sender === 'visitor' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '75%',
                padding: '11px 15px',
                borderRadius: m.sender === 'visitor' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: m.sender === 'visitor' ? '#111' : '#fff',
                color: m.sender === 'visitor' ? '#fff' : '#111',
                border: m.sender === 'visitor' ? '1px solid #111' : '1px solid #e5e5e5',
                fontSize: 13,
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}>
                {m.message}
                <span style={{
                  display: 'block', fontSize: 10,
                  marginTop: 5, opacity: .65,
                  textAlign: m.sender === 'visitor' ? 'right' : 'left',
                  color: m.sender === 'visitor' ? '#fff' : '#888',
                }}>
                  {m.time}
                  {m.sender === 'visitor' && (
                    <span style={{ marginLeft: 4 }}>
                      {m.status === 'read' ? ' ✓✓' : ' ✓'}
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}

          {/* Admin Typing Indicator */}
          {adminTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                background: '#f0f0f0', padding: '10px 16px',
                borderRadius: '14px 14px 14px 2px',
                display: 'flex', gap: 4, alignItems: 'center',
              }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span
                    key={i}
                    style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#888', display: 'inline-block',
                      animation: `lvsBlink 1.4s ${delay}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div style={{
          padding: '14px 16px', background: '#fff',
          borderTop: '1px solid #f2f2f2', flexShrink: 0,
        }}>
          {/* Email */}
          {!emailSubmitted && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address (optional)"
              style={{
                width: '100%', height: 40, padding: '0 14px',
                border: '1px solid #e5e5e5', borderRadius: 8,
                fontSize: 13, marginBottom: 10, boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          )}

          {/* Message Row */}
          <div style={{ display: 'flex', gap: 8, height: 46 }}>
            <input
              type="text"
              value={messageText}
              onChange={(e) => handleMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="How may we assist you today?"
              style={{
                flex: 1, height: '100%',
                padding: '0 14px',
                border: '1px solid #e5e5e5',
                borderRadius: 8, fontSize: 13,
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={sending || !messageText.trim()}
              style={{
                height: '100%', padding: '0 20px',
                background: '#111', color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer', flexShrink: 0,
                opacity: sending || !messageText.trim() ? 0.55 : 1,
                letterSpacing: '.05em',
              }}
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lvsBlink {
          0% { opacity: .2; }
          20% { opacity: 1; }
          100% { opacity: .2; }
        }
        #lvs-chat-btn:hover {
          transform: translateY(-3px);
          background: #173835 !important;
        }
        @media (max-width: 768px) {
          #lvs-chat-btn {
            bottom: 15px !important;
            left: 15px !important;
            z-index: 999999 !important;
          }
          #lvs-chat-popup {
            bottom: 80px !important;
            left: 15px !important;
            max-height: calc(100dvh - 95px) !important;
          }
        }
      `}</style>
    </>
  );
}
