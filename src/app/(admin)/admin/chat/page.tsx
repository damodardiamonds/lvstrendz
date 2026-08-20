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
  createdAt?: string;
  time: string;
}

function formatISTTime(dateStr?: string, fallbackTime?: string): string {
  if (!dateStr) return fallbackTime || '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallbackTime || dateStr;
    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase();
  } catch {
    return fallbackTime || dateStr;
  }
}

function isPdfFile(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.toLowerCase();
  return clean.endsWith('.pdf') || clean.includes('.pdf') || clean.includes('/raw/upload') || clean.includes('application/pdf');
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

  // Attachment states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
    clearSelectedFile();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Selected file exceeds 25MB limit.');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const clearSelectedFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadAttachment = async (file: File): Promise<string | null> => {
    try {
      setUploadProgress(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      } else {
        alert(data.error || 'Failed to upload attachment.');
        return null;
      }
    } catch (err: any) {
      alert('Upload failed: ' + (err?.message || 'Network error'));
      return null;
    } finally {
      setUploadProgress(false);
    }
  };

  const handleSendReply = async () => {
    if (!currentSession || (!reply.trim() && !selectedFile) || sending || uploadProgress) return;
    setSending(true);
    sendAdminTyping(false);
    if (typingTimer) clearTimeout(typingTimer);

    try {
      let attachmentUrl: string | null = null;
      if (selectedFile) {
        attachmentUrl = await uploadAttachment(selectedFile);
        if (!attachmentUrl && !reply.trim()) {
          setSending(false);
          return;
        }
      }

      const res = await fetch('/api/admin/chat/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          message: reply.trim(),
          attachment: attachmentUrl,
        }),
      });

      if ((await res.json()).success) {
        setReply('');
        clearSelectedFile();
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
          Receive and reply to customer messages from the website chat widget. All times are displayed in IST.
        </p>
      </div>

      {/* Fullscreen Image Preview Modal */}
      {previewModalImg && (
        <div
          onClick={() => setPreviewModalImg(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1000000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={previewModalImg}
              alt="Full preview"
              style={{
                maxWidth: '100%', maxHeight: '90vh',
                borderRadius: 8, objectFit: 'contain',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              }}
            />
            <button
              onClick={() => setPreviewModalImg(null)}
              style={{
                position: 'absolute', top: -14, right: -14,
                width: 32, height: 32, borderRadius: '50%',
                background: '#fff', color: '#111', border: 'none',
                fontWeight: 'bold', fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

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
                {messages.map((m) => {
                  const hasPdf = isPdfFile(m.attachment);
                  const istTime = formatISTTime(m.createdAt, m.time);
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: m.sender === 'concierge' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{
                        maxWidth: '75%', padding: '11px 15px',
                        borderRadius: m.sender === 'concierge' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        background: m.sender === 'concierge' ? '#111' : '#fff',
                        color: m.sender === 'concierge' ? '#fff' : '#111',
                        border: m.sender === 'concierge' ? 'none' : '1px solid #e5e5e5',
                        fontSize: 13.5, lineHeight: 1.4,
                        wordBreak: 'break-word',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      }}>
                        {/* Attachment Rendering */}
                        {m.attachment && (
                          <div style={{ marginBottom: m.message ? 8 : 2 }}>
                            {hasPdf ? (
                              <a
                                href={m.attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '9px 12px',
                                  background: m.sender === 'concierge' ? '#222' : '#f8f9fa',
                                  border: `1px solid ${m.sender === 'concierge' ? '#444' : '#e2e8f0'}`,
                                  borderRadius: 8,
                                  textDecoration: 'none',
                                  color: 'inherit',
                                }}
                              >
                                <span style={{ fontSize: 24 }}>📄</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    fontWeight: 600,
                                    fontSize: 12,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    color: m.sender === 'concierge' ? '#d4af37' : '#1e293b',
                                  }}>
                                    {m.attachment.split('/').pop()?.split('?')[0] || 'Attachment (PDF)'}
                                  </div>
                                  <div style={{ fontSize: 10, opacity: 0.75 }}>
                                    View / Download PDF ↗
                                  </div>
                                </div>
                              </a>
                            ) : (
                              <div style={{ borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}>
                                <img
                                  src={m.attachment}
                                  alt="Attachment"
                                  onClick={() => setPreviewModalImg(m.attachment)}
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: 250,
                                    borderRadius: 6,
                                    display: 'block',
                                    objectFit: 'cover',
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Text Message */}
                        {m.message && <div>{m.message}</div>}

                        {/* Timestamp in IST */}
                        <span style={{
                          display: 'block', fontSize: 10,
                          opacity: .65, marginTop: 5,
                          textAlign: m.sender === 'concierge' ? 'right' : 'left',
                          color: m.sender === 'concierge' ? '#ccc' : '#888',
                        }}>
                          {istTime}
                          {m.sender === 'concierge' && (
                            <span style={{ marginLeft: 4 }}>
                              {m.status === 'read' ? '✓✓ Seen' : '✓ Delivered'}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}

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

              {/* Attachment Preview Chip for Admin */}
              {selectedFile && (
                <div style={{
                  padding: '6px 16px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 18 }}>📄</span>
                    )}
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 500,
                      color: '#334155',
                    }}>
                      {selectedFile.name}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>
                      ({(selectedFile.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: 16,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      padding: '0 4px',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Hidden File Input for Admin */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
              />

              {/* Reply Area */}
              <div style={{
                padding: '12px 16px', borderTop: '1px solid #e5e7eb',
                display: 'flex', gap: 10, background: '#fff', flexShrink: 0, alignItems: 'center',
              }}>
                {/* Paperclip Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach image or PDF"
                  style={{
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: selectedFile ? '#f1f5f9' : '#fafafa',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    cursor: 'pointer',
                    color: selectedFile ? '#111' : '#64748b',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>

                <textarea
                  value={reply}
                  onChange={(e) => handleReplyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder={selectedFile ? 'Add an optional response with your attachment... (Enter to send)' : 'Type a professional response... (Enter to send)'}
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
                  disabled={sending || uploadProgress || (!reply.trim() && !selectedFile)}
                  style={{
                    padding: '0 24px', height: 44, background: '#111',
                    color: '#fff', border: 'none', borderRadius: 8,
                    fontWeight: 600, cursor: 'pointer',
                    opacity: sending || uploadProgress || (!reply.trim() && !selectedFile) ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                >
                  {sending || uploadProgress ? 'Sending...' : 'Send'}
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
