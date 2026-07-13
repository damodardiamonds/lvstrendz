'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Thread {
  id: string;
  email: string;
  productTitle: string | null;
  productUrl: string | null;
  adminNote: string | null;
  archived: boolean;
  latestMessage: string;
  latestSender: string;
  latestStatus: string;
  unread: boolean;
  timeAgo: string;
}

interface ChatMsg {
  id: string;
  sender: string;
  message: string;
  status: string;
  attachment: string | null;
  time: string;
}

export default function AdminChatPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentSession, setCurrentSession] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [typingTimer, setTypingTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const feedRef = useRef<HTMLDivElement>(null);
  const threadPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollFeed = useCallback(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, []);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/chat/threads?archived=${showArchived ? '1' : '0'}`);
      const data = await res.json();
      if (data.success) setThreads(data.data);
    } catch { /* silent */ }
  }, [showArchived]);

  const fetchMessages = useCallback(async () => {
    if (!currentSession) return;
    try {
      const res = await fetch(`/api/admin/chat/messages?sessionId=${currentSession.id}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages);
        setVisitorTyping(!!data.data.visitor_typing);
        scrollFeed();
      }
    } catch { /* silent */ }
  }, [currentSession, scrollFeed]);

  // Thread polling
  useEffect(() => {
    fetchThreads();
    threadPollRef.current = setInterval(fetchThreads, 4000);
    return () => { if (threadPollRef.current) clearInterval(threadPollRef.current); };
  }, [fetchThreads]);

  // Message polling
  useEffect(() => {
    if (msgPollRef.current) clearInterval(msgPollRef.current);
    if (!currentSession) return;
    fetchMessages();
    msgPollRef.current = setInterval(fetchMessages, 3000);
    return () => { if (msgPollRef.current) clearInterval(msgPollRef.current); };
  }, [currentSession, fetchMessages]);

  const selectThread = (thread: Thread) => {
    setCurrentSession(thread);
    setNote(thread.adminNote || '');
    setReply('');
  };

  const sendAdminTyping = async (isTyping: boolean) => {
    if (!currentSession) return;
    await fetch('/api/admin/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSession.id, typing: isTyping }),
    });
  };

  const handleReplyInput = (val: string) => {
    setReply(val);
    sendAdminTyping(true);
    if (typingTimer) clearTimeout(typingTimer);
    const t = setTimeout(() => sendAdminTyping(false), 2500);
    setTypingTimer(t);
  };

  const handleSendReply = async () => {
    if (!currentSession || !reply.trim() || sending) return;
    setSending(true);
    sendAdminTyping(false);
    if (typingTimer) clearTimeout(typingTimer);

    try {
      const res = await fetch('/api/admin/chat/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSession.id, message: reply.trim() }),
      });
      if ((await res.json()).success) {
        setReply('');
        await fetchMessages();
        await fetchThreads();
      }
    } finally {
      setSending(false);
    }
  };

  const handleSaveNote = async () => {
    if (!currentSession) return;
    setSavingNote(true);
    await fetch('/api/admin/chat/note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSession.id, note }),
    });
    setSavingNote(false);
    await fetchThreads();
  };

  const handleArchive = async () => {
    if (!currentSession) return;
    await fetch('/api/admin/chat/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSession.id, archived: !showArchived }),
    });
    setCurrentSession(null);
    await fetchThreads();
  };

  const handleDelete = async () => {
    if (!currentSession) return;
    if (!confirm('Permanently delete this conversation? This cannot be undone.')) return;
    await fetch('/api/admin/chat/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSession.id }),
    });
    setCurrentSession(null);
    setMessages([]);
    await fetchThreads();
  };

  return (
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          Concierge Chat Inbox
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Receive and reply to customer messages from the website chat widget.
        </p>
      </div>

      <div style={{
        flex: 1, display: 'flex', background: '#fff',
        border: '1px solid #e5e7eb', borderRadius: 12,
        overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
        minHeight: 0,
      }}>
        {/* Sidebar */}
        <div style={{
          width: 300, borderRight: '1px solid #e5e7eb',
          display: 'flex', flexDirection: 'column',
          background: '#fcfcfc', flexShrink: 0,
        }}>
          {/* Sidebar Header */}
          <div style={{
            padding: '12px 14px', borderBottom: '1px solid #e5e7eb',
            background: '#f9f9f9', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: .5 }}>
              Conversations
            </span>
            <button
              onClick={() => { setShowArchived((a) => !a); setCurrentSession(null); }}
              style={{
                border: `1px solid ${showArchived ? '#111' : '#ccc'}`,
                background: showArchived ? '#111' : '#fff',
                color: showArchived ? '#d4af37' : '#555',
                borderRadius: 4, padding: '3px 8px',
                cursor: 'pointer', fontSize: 11, fontWeight: 600,
              }}
            >
              {showArchived ? 'Active' : 'Archived'}
            </button>
          </div>

          {/* Thread List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {threads.length === 0 ? (
              <div style={{ padding: 20, color: '#9ca3af', textAlign: 'center', fontSize: 13 }}>
                {showArchived ? 'No archived conversations.' : 'No active conversations yet.'}
              </div>
            ) : threads.map((t) => (
              <div
                key={t.id}
                onClick={() => selectThread(t)}
                style={{
                  padding: '13px 14px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  background: currentSession?.id === t.id ? '#f0f4f8' : 'transparent',
                  borderLeft: currentSession?.id === t.id ? '3px solid #111' : '3px solid transparent',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#111', wordBreak: 'break-all' }}>
                    {t.email}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 4 }}>
                    {t.timeAgo}
                  </span>
                </div>
                <div style={{
                  fontSize: 12, color: '#6b7280',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', paddingRight: 16,
                }}>
                  {t.latestSender === 'concierge' ? '↩ ' : ''}{t.latestMessage}
                </div>
                {t.unread && (
                  <div style={{
                    position: 'absolute', right: 14, bottom: 14,
                    width: 8, height: 8, background: '#d4af37',
                    borderRadius: '50%',
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!currentSession ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#9ca3af',
              fontSize: 14, fontStyle: 'italic',
            }}>
              Select a conversation to begin assisting
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                  Assisting: {currentSession.email}
                </h3>
                {currentSession.productTitle && currentSession.productUrl && (
                  <span style={{ fontSize: 12, color: '#b69324', marginTop: 3, display: 'block' }}>
                    Page:{' '}
                    <a href={currentSession.productUrl} target="_blank" rel="noopener noreferrer"
                       style={{ color: '#b69324', textDecoration: 'underline' }}>
                      {currentSession.productTitle}
                    </a>
                  </span>
                )}
              </div>

              {/* Toolbar */}
              <div style={{
                display: 'flex', gap: 8, padding: '8px 16px',
                borderBottom: '1px solid #f0f0f0', flexShrink: 0,
              }}>
                <button
                  onClick={handleArchive}
                  style={{
                    border: '1px solid #111', background: '#111', color: '#d4af37',
                    borderRadius: 4, padding: '6px 12px', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                  }}
                >
                  {showArchived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    border: '1px solid #7a1111', background: '#7a1111', color: '#fff',
                    borderRadius: 4, padding: '6px 12px', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, marginLeft: 'auto',
                  }}
                >
                  Delete Permanently
                </button>
              </div>

              {/* Message Feed */}
              <div
                ref={feedRef}
                style={{
                  flex: 1, padding: 20, overflowY: 'auto',
                  background: '#fafafa', display: 'flex',
                  flexDirection: 'column', gap: 12, minHeight: 0,
                }}
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: m.sender === 'concierge' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      maxWidth: '72%', padding: '11px 15px',
                      borderRadius: m.sender === 'concierge' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: m.sender === 'concierge' ? '#111' : '#fff',
                      color: m.sender === 'concierge' ? '#fff' : '#111',
                      border: m.sender === 'concierge' ? 'none' : '1px solid #e5e5e5',
                      fontSize: 13.5, lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}>
                      {m.message}
                      <span style={{
                        display: 'block', fontSize: 10,
                        opacity: .65, marginTop: 5,
                        textAlign: m.sender === 'concierge' ? 'right' : 'left',
                        color: m.sender === 'concierge' ? '#ccc' : '#888',
                      }}>
                        {m.time}
                        {m.sender === 'concierge' && (
                          <span style={{ marginLeft: 4 }}>
                            {m.status === 'read' ? '✓✓ Seen' : '✓ Delivered'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Visitor typing */}
                {visitorTyping && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      background: '#f0f0f0', padding: '10px 16px',
                      borderRadius: '14px 14px 14px 2px',
                      display: 'flex', gap: 4,
                    }}>
                      {[0, 0.2, 0.4].map((d, i) => (
                        <span key={i} style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: '#888', display: 'inline-block',
                          animation: `lvsBlink 1.4s ${d}s infinite`,
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>visitor is typing</span>
                  </div>
                )}
              </div>

              {/* Customer Notes */}
              <div style={{
                padding: '10px 16px', borderTop: '1px solid #e5e7eb',
                background: '#fff', display: 'flex',
                alignItems: 'center', gap: 10, flexShrink: 0,
              }}>
                <label style={{ fontWeight: 600, fontSize: 12, flexShrink: 0 }}>Notes</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Size, occasion, follow-up details..."
                  style={{
                    flex: 1, height: 36, padding: '0 12px',
                    border: '1px solid #e5e7eb', borderRadius: 6,
                    fontSize: 12, fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  style={{
                    padding: '6px 14px', background: '#111',
                    color: '#d4af37', border: '1px solid #111',
                    borderRadius: 6, cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    opacity: savingNote ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                >
                  {savingNote ? 'Saving...' : 'Save'}
                </button>
              </div>

              {/* Reply Area */}
              <div style={{
                padding: '12px 16px', borderTop: '1px solid #e5e7eb',
                display: 'flex', gap: 10, background: '#fff', flexShrink: 0,
              }}>
                <textarea
                  value={reply}
                  onChange={(e) => handleReplyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Type a professional response... (Enter to send)"
                  rows={2}
                  style={{
                    flex: 1, padding: '10px 14px',
                    border: '1px solid #e5e7eb', borderRadius: 8,
                    resize: 'none', fontSize: 13,
                    fontFamily: 'inherit', lineHeight: 1.4,
                  }}
                />
                <button
                  onClick={handleSendReply}
                  disabled={sending || !reply.trim()}
                  style={{
                    padding: '0 24px', background: '#111',
                    color: '#fff', border: 'none', borderRadius: 8,
                    fontWeight: 600, cursor: 'pointer',
                    opacity: sending || !reply.trim() ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes lvsBlink {
          0% { opacity: .2; }
          20% { opacity: 1; }
          100% { opacity: .2; }
        }
      `}</style>
    </div>
  );
}
