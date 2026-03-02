import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  ChatBubbleOutline,
  Close,
  Send,
  AttachFile,
  Delete,
  Done,
  DoneAll,
  SmartToy,
  Person,
  Refresh,
} from "@mui/icons-material";

const ChatWidget = ({
  user,
  receiverId = "SUPPORT",
  receiverName = "Support Chat",
  isOpen: controlledIsOpen,
  onClose,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === "boolean";
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteIsTyping, setRemoteIsTyping] = useState(false);
  const [isAiMode, setIsAiMode] = useState(() => {
    return localStorage.getItem("isAiMode") === "true";
  });
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("isAiMode", isAiMode);
  }, [isAiMode]);

  // Connect to Socket.io
  useEffect(() => {
    if (user) {
      const newSocket = io("http://localhost:3002", {
        withCredentials: true,
      });
      setSocket(newSocket);

      newSocket.on("connect", () => setIsConnected(true));
      newSocket.on("disconnect", () => setIsConnected(false));

      newSocket.on("receive_message", (message) => {
        if (receiverId === "SUPPORT") {
          setMessages((prev) => {
            if (prev.some((m) => m._id === message._id)) return prev;
            return [...prev, message];
          });
        } else {
          // For specific user chat, only show messages involving that user
          if (
            message.senderId === receiverId ||
            message.receiverId === receiverId
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m._id === message._id)) return prev;
              return [...prev, message];
            });
          }
        }
      });

      newSocket.on("message_sent", (message) => {
        if (receiverId === "SUPPORT" || message.receiverId === receiverId) {
          setMessages((prev) => {
            const next = message.clientMsgId
              ? prev.filter((m) => m._id !== message.clientMsgId)
              : [...prev];
            if (next.some((m) => m._id === message._id)) return next;
            return [...next, message];
          });
        }
      });

      // Listen for typing events from support
      newSocket.on("typing", ({ senderId }) => {
        if (receiverId === "SUPPORT") {
          if (senderId !== user.id) setRemoteIsTyping(true);
        } else {
          if (senderId === receiverId) setRemoteIsTyping(true);
        }
      });

      newSocket.on("stop_typing", ({ senderId }) => {
        if (receiverId === "SUPPORT") {
          if (senderId !== user.id) setRemoteIsTyping(false);
        } else {
          if (senderId === receiverId) setRemoteIsTyping(false);
        }
      });

      newSocket.on("chat_read", ({ readerId, targetId }) => {
        if (
          (readerId === receiverId && targetId === user.id) ||
          (receiverId === "SUPPORT" && targetId === user.id) ||
          (readerId === receiverId && targetId === "SUPPORT")
        ) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.senderId === user.id ? { ...msg, isRead: true } : msg,
            ),
          );
        }
      });

      newSocket.on("message_deleted", ({ messageId }) => {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        const audio = new Audio(
          "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
        );
        audio.play().catch((e) => console.error("Audio play failed", e));
      });

      return () => newSocket.close();
    }
  }, [user, receiverId]);

  // Fetch History
  useEffect(() => {
    if (user && receiverId) {
      axios
        .get(`http://localhost:3002/chat/history/${receiverId}`, {
          withCredentials: true,
        })
        .then((res) => {
          if (res.data.success) {
            setMessages(res.data.messages);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [user, receiverId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, remoteIsTyping, isOpen]);

  const markAsRead = async () => {
    try {
      await axios.put(
        "http://localhost:3002/chat/read",
        { contactId: receiverId },
        { withCredentials: true },
      );
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const hasUnread = messages.some(
        (m) => m.senderId === receiverId && !m.isRead,
      );
      if (hasUnread) markAsRead();
    }
  }, [isOpen, messages, receiverId]);

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.delete(`http://localhost:3002/chat/message/${msgId}`, {
        withCredentials: true,
      });
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !fileInputRef.current?.files[0]) return;
    if (!isAiMode && !socket) return;

    let attachment = null;
    if (fileInputRef.current?.files[0]) {
      const formData = new FormData();
      formData.append("file", fileInputRef.current.files[0]);
      try {
        const uploadRes = await axios.post(
          "http://localhost:3002/chat/upload",
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        if (uploadRes.data.success) {
          attachment = uploadRes.data;
        }
      } catch (err) {
        console.error("Upload failed", err);
        return;
      }
    }

    const msgContent = newMessage;
    const messageData = {
      receiverId: receiverId,
      message: msgContent,
      attachment,
      isAi: isAiMode,
    };

    if (isAiMode) {
      const tempId = "temp_" + Date.now();
      const tempMessage = {
        ...messageData,
        _id: tempId,
        senderId: user.id,
        timestamp: new Date(),
        status: "sending",
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsAiTyping(true);
      if (socket) socket.emit("stop_typing", { receiverId });

      try {
        const res = await axios.post(
          "http://localhost:3002/chat/ai",
          { ...messageData, clientMsgId: tempId, isAi: true },
          {
            withCredentials: true,
          },
        );
        if (res.data.success) {
          const { userMsg, aiMsg } = res.data;
          setMessages((prev) => {
            // Remove the temporary message and add the real ones
            const next = prev.filter((m) => m._id !== tempId && m._id !== userMsg._id);
            if (userMsg && !next.some((m) => m._id === userMsg._id))
              next.push(userMsg);
            if (aiMsg) next.push(aiMsg);
            return next;
          });
        } else {
          throw new Error(res.data.message || "Failed to send message");
        }
      } catch (err) {
        console.error("Failed to send AI message", err);
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, status: "failed" } : m)),
        );
      } finally {
        setIsAiTyping(false);
      }
    } else {
      const tempId = "temp_" + Date.now();
      const tempMessage = {
        ...messageData,
        _id: tempId,
        senderId: user.id,
        timestamp: new Date(),
        status: "sending",
      };
      setMessages((prev) => [...prev, tempMessage]);

      if (socket && socket.connected) {
        socket.emit("send_message", { ...messageData, clientMsgId: tempId });
        // Timeout to mark as failed if no ack received
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === tempId && m.status === "sending"
                ? { ...m, status: "failed" }
                : m,
            ),
          );
        }, 5000);
      } else {
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === tempId ? { ...m, status: "failed" } : m,
            ),
          );
        }, 100);
      }

      setNewMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsTyping(false);
      if (socket) socket.emit("stop_typing", { receiverId });
    }
  };

  const handleRetry = async (msg) => {
    setMessages((prev) =>
      prev.map((m) => (m._id === msg._id ? { ...m, status: "sending" } : m)),
    );

    if (msg.isAi) {
      setIsAiTyping(true);
      try {
        const res = await axios.post(
          "http://localhost:3002/chat/ai",
          {
            receiverId: msg.receiverId,
            message: msg.message,
            attachment: msg.attachment,
            isAi: true,
            clientMsgId: msg._id,
          },
          { withCredentials: true },
        );

        if (res.data.success) {
          const { userMsg, aiMsg } = res.data;
          setMessages((prev) => {
            const next = prev.filter((m) => m._id !== msg._id && m._id !== userMsg._id);
            if (userMsg) next.push(userMsg);
            if (aiMsg) next.push(aiMsg);
            return next;
          });
        }
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? { ...m, status: "failed" } : m)),
        );
      } finally {
        setIsAiTyping(false);
      }
    } else {
      if (socket && socket.connected) {
        socket.emit("send_message", {
          receiverId: msg.receiverId,
          message: msg.message,
          attachment: msg.attachment,
          clientMsgId: msg._id,
        });
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === msg._id && m.status === "sending"
                ? { ...m, status: "failed" }
                : m,
            ),
          );
        }, 5000);
      } else {
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === msg._id ? { ...m, status: "failed" } : m,
            ),
          );
        }, 100);
      }
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { receiverId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("stop_typing", { receiverId });
    }, 2000);
  };

  const handleClearChat = async () => {
    if (!window.confirm("Clear chat history?")) return;
    try {
      const res = await axios.delete(
        `http://localhost:3002/chat/history/${receiverId}`,
        { withCredentials: true },
      );
      if (res.data.success) {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to clear chat", err);
    }
  };

  const parseMessageContent = (content) => {
    if (!content) return { text: "", order: null };
    const jsonMatch = content.match(/\|\|\|JSON([\s\S]*?)\|\|\|/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const cleanText = content.replace(jsonMatch[0], "").trim();
        return { text: cleanText, order: data.order };
      } catch (e) {
        return { text: content, order: null };
      }
    }
    return { text: content, order: null };
  };

  const handleConfirmOrder = async (order) => {
    try {
      const res = await axios.post(
        "http://localhost:3002/newOrder",
        { ...order, price: 0 }, // Market order usually 0
        { withCredentials: true },
      );
      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            senderId: "SUPPORT",
            message: `✅ Order placed successfully! Order ID: ${res.data.order._id}`,
            timestamp: new Date(),
            isRead: true,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      alert(
        "Failed to place order: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  if (!user) return null;

  return (
    <div className={`chat-widget ${isControlled ? "controlled" : ""}`}>
      {!isControlled && !isOpen && (
        <button className="chat-toggle" onClick={() => setInternalIsOpen(true)}>
          <ChatBubbleOutline /> Support
          {!isConnected && (
            <span className="offline-badge" title="Disconnected" />
          )}
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h4>{receiverName}</h4>
              {!isConnected && (
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#f44336",
                    border: "1px solid white",
                  }}
                  title="Disconnected"
                />
              )}
              {receiverId === "SUPPORT" && (
                <div
                  className={`ai-toggle ${isAiMode ? "active" : ""}`}
                  onClick={() => setIsAiMode(!isAiMode)}
                  title={isAiMode ? "AI Support" : "Manual Support"}
                >
                  <div className="toggle-handle">
                    {isAiMode ? (
                      <SmartToy style={{ fontSize: 14 }} />
                    ) : (
                      <Person style={{ fontSize: 14 }} />
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleClearChat} title="Clear Chat">
                <Delete />
              </button>
              <button
                onClick={() =>
                  isControlled ? onClose && onClose() : setInternalIsOpen(false)
                }
              >
                <Close />
              </button>
            </div>
          </div>
          <div className="chat-body">
            {messages.map((msg, index) => {
              const { text, order } = parseMessageContent(msg.message);
              return (
                <div
                  key={msg._id || index}
                  className={`message ${msg.senderId === user.id ? "sent" : "received"}`}
                  onMouseEnter={() => setHoveredMessage(msg._id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  {msg.senderId !== user.id && (
                    <span className="sender-name">
                      {msg.senderName ||
                        (msg.senderId === "SUPPORT" ? "Support Bot" : "User")}
                    </span>
                  )}
                  {msg.attachment && (
                    <div className="attachment">
                      {msg.attachment.mimetype.startsWith("image/") ? (
                        <img
                          src={`http://localhost:3002${msg.attachment.url}`}
                          alt="attachment"
                          style={{ maxWidth: "100%", borderRadius: "4px" }}
                        />
                      ) : (
                        <a
                          href={`http://localhost:3002${msg.attachment.url}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {msg.attachment.filename}
                        </a>
                      )}
                    </div>
                  )}
                  {text && <p>{text}</p>}
                  {order && msg.senderId !== user.id && (
                    <div
                      className="order-confirmation"
                      style={{
                        marginTop: "10px",
                        padding: "10px",
                        background: "rgba(0,0,0,0.05)",
                        borderRadius: "5px",
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                        Confirm Order?
                      </div>
                      <div style={{ fontSize: "0.9em", marginBottom: "8px" }}>
                        {order.mode} {order.qty} {order.name} @ {order.type}
                      </div>
                      <button
                        onClick={() => handleConfirmOrder(order)}
                        style={{
                          background: "#4caf50",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          borderRadius: "3px",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        Place Order
                      </button>
                    </div>
                  )}
                  <div className="message-meta">
                    <span className="timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {msg.senderId === user.id && (
                      <span className="read-receipt">
                        {msg.isRead ? (
                          <DoneAll fontSize="inherit" htmlColor="#4caf50" />
                        ) : (
                          <Done fontSize="inherit" htmlColor="#ccc" />
                        )}
                      </span>
                    )}
                    {msg.status === "failed" && (
                      <div className="retry-container">
                        <span className="error-text">Failed</span>
                        <button
                          onClick={() => handleRetry(msg)}
                          className="btn-retry"
                          title="Retry"
                        >
                          <Refresh style={{ fontSize: 14 }} />
                        </button>
                      </div>
                    )}
                  </div>
                  {hoveredMessage === msg._id && msg.senderId === user.id && (
                    <button
                      className="btn-msg-delete"
                      onClick={() => handleDeleteMessage(msg._id)}
                    >
                      <Delete style={{ fontSize: 14 }} />
                    </button>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className="typing-indicator-container">
            {(remoteIsTyping || isAiTyping) && (
              <div className="typing-indicator">
                {isAiTyping ? "AI Support" : receiverName} is typing...
              </div>
            )}
          </div>
          <form className="chat-footer" onSubmit={handleSendMessage}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={() =>
                fileInputRef.current?.files[0] &&
                handleSendMessage({ preventDefault: () => {} })
              }
            />
            <button
              type="button"
              className="btn-icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <AttachFile />
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
            />
            <button type="submit" className="btn-icon send">
              <Send />
            </button>
          </form>
        </div>
      )}
      <style>{`
        .chat-widget { position: fixed; bottom: 20px; right: 20px; z-index: 1000; }
        .chat-widget.controlled { z-index: 2000; right: 80px; }
        .chat-toggle { background: #387ed1; color: white; border: none; padding: 12px 20px; border-radius: 30px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-weight: 600; position: relative; }
        .offline-badge { position: absolute; top: 0; right: 0; width: 12px; height: 12px; background-color: #f44336; border: 2px solid white; border-radius: 50%; }
        .chat-window { width: 350px; height: 500px; background: white; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; }
        .chat-header { background: #387ed1; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; }
        .chat-header h4 { margin: 0; }
        .chat-header button { background: none; border: none; color: white; cursor: pointer; }
        .chat-body { flex: 1; padding: 15px; overflow-y: auto; background: #f5f5f5; display: flex; flex-direction: column; gap: 10px; }
        .message { max-width: 80%; padding: 10px; border-radius: 8px; font-size: 0.9rem; position: relative; min-width: 100px; }
        .sender-name { font-size: 0.7rem; font-weight: 600; color: #666; margin-bottom: 2px; display: block; }
        .message.sent { align-self: flex-end; background: #387ed1; color: white; border-bottom-right-radius: 0; }
        .message.received { align-self: flex-start; background: white; color: #333; border-bottom-left-radius: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        .message p { margin: 0; }
        .message-meta { display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 4px; }
        .timestamp { font-size: 0.65rem; opacity: 0.7; }
        .read-receipt { font-size: 0.8rem; display: flex; align-items: center; }
        .retry-container { display: flex; align-items: center; gap: 4px; margin-left: 5px; }
        .error-text { color: #d32f2f; font-size: 0.7rem; }
        .btn-retry { background: none; border: none; color: #d32f2f; cursor: pointer; padding: 0; display: flex; align-items: center; }
        .btn-msg-delete { position: absolute; top: -8px; right: -8px; background: #fff; border: 1px solid #ddd; border-radius: 50%; cursor: pointer; padding: 4px; color: #d32f2f; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .typing-indicator-container { height: 20px; padding: 0 15px; background: #f5f5f5;}
        .typing-indicator { color: #999; font-style: italic; font-size: 0.8rem; }
        .chat-footer { padding: 10px; background: white; border-top: 1px solid #eee; display: flex; align-items: center; gap: 10px; }
        .chat-footer input[type="text"] { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 20px; outline: none; }
        .btn-icon { background: none; border: none; cursor: pointer; color: #666; padding: 5px; }
        .btn-icon.send { color: #387ed1; }
        .ai-toggle { width: 40px; height: 20px; background: rgba(255,255,255,0.3); border-radius: 10px; position: relative; cursor: pointer; transition: background 0.3s; }
        .ai-toggle.active { background: rgba(255,255,255,0.6); }
        .toggle-handle { width: 18px; height: 18px; background: white; border-radius: 50%; position: absolute; top: 1px; left: 1px; transition: left 0.3s; display: flex; align-items: center; justify-content: center; color: #387ed1; }
        .ai-toggle.active .toggle-handle { left: 21px; color: #4caf50; }
        
        body.dark-mode .chat-window { background: #1e1e1e; }
        body.dark-mode .chat-body { background: #121212; }
        body.dark-mode .message.received { background: #2d2d2d; color: #e0e0e0; }
        body.dark-mode .sender-name { color: #aaa; }
        body.dark-mode .btn-msg-delete { background: #2d2d2d; border-color: #444; }
        body.dark-mode .typing-indicator-container { background: #121212; }
        body.dark-mode .chat-footer { background: #1e1e1e; border-top-color: #333; }
        body.dark-mode .chat-footer input { background: #2d2d2d; border-color: #444; color: white; }
      `}</style>
    </div>
  );
};

export default ChatWidget;
