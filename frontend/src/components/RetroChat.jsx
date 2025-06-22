import { useState, useRef, useEffect } from 'react';

function RetroChat({ onClose, recipient, socket }) {
  const [messages, setMessages] = useState([
    { sender: 'SYSTEM', text: `Connected to ${recipient}`, time: new Date().toLocaleTimeString() },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const currentUser = localStorage.getItem('username');

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat' && data.sender === recipient) {
        const newMessage = {
          sender: data.sender,
          text: data.message,
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        };
        
        setMessages(prev => [...prev, newMessage]);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, recipient]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket || !recipient) return;

    // Add to local chat
    const newMessage = {
      sender: currentUser,
      text: inputValue.toUpperCase(),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Send via WebSocket
    socket.send(
      JSON.stringify({
        type: 'chat',
        recipient,
        message: inputValue,
        sender: currentUser
      })
    );
    
    setInputValue('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="absolute top-4 left-4 z-50 w-full max-w-md border-4 border-green-500 bg-black font-mono shadow-[0_0_0_4px_rgba(0,255,0,0.3)]">
      <div className="bg-black p-2 border-b-2 border-green-600 flex justify-between items-center">
        <div className="text-green-500 text-sm">CHAT WITH {recipient}</div>
        <button onClick={onClose} className="text-green-400 text-xs hover:text-red-500">
          ✖
        </button>
      </div>

      <div className="bg-black h-64 overflow-y-auto p-2 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,255,0,0.1)_50%,transparent_100%)] bg-[length:100%_4px]">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 mb-2 border-2 ${
              msg.sender === currentUser
                ? 'border-green-500 text-green-400'
                : msg.sender === 'SYSTEM'
                ? 'border-yellow-500 text-yellow-400'
                : 'border-green-600 text-green-300'
            } bg-[rgba(0,20,0,0.3)] shadow-[0_0_5px_rgba(0,255,0,0.5)]`}
          >
            <div className={`text-xs ${
              msg.sender === currentUser 
                ? 'text-green-600' 
                : msg.sender === 'SYSTEM'
                ? 'text-yellow-600'
                : 'text-green-500'
            }`}>
              {msg.sender} [{msg.time}]
            </div>
            <div className="text-sm mt-1">{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-black p-2 border-t-2 border-green-600">
        <form onSubmit={handleSend} className="flex flex-col">
          <div className="flex">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-grow p-2 bg-black border-2 border-green-500 text-green-400 focus:outline-none focus:shadow-[0_0_5px_rgba(0,255,0,0.5)] text-sm"
              placeholder="TYPE MESSAGE..."
              maxLength={50}
            />
            <button
              type="submit"
              className="ml-2 px-4 bg-black border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-black transition-colors text-sm"
            >
              SEND
            </button>
          </div>
          <div className="text-xs text-green-600 mt-1">CHARS: {inputValue.length}/50</div>
        </form>
      </div>
    </div>
  );
}

export default RetroChat;