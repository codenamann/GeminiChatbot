import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Loader2, Paperclip, X, Sparkles } from 'lucide-react';

const App = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      text: "Greetings. I am NovaMind AI. I can analyze text, images, and documents. How can I assist you?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isServerAwake, setIsServerAwake] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const ServerURI = 'http://localhost:5000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- WAKE UP CALL ---
  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        const res = await fetch(`${ServerURI}/ping`);
        if (res.ok) {
          setIsServerAwake(true);
          console.log("Server is awake and ready.");
        }
      } catch (err) {
        console.log("Server might be sleeping or offline:", err);
      }
    };
    wakeUpServer();
  }, []);

  // --- File Handling ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        setError("File size too large. Please keep it under 5MB.");
        return;
      }
      setAttachedFile(file);
      setError(null);
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(',')[1]; 
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // --- Send Logic ---
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    const currentMessage = input.trim();
    const currentFile = attachedFile;
    
    setInput('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError(null);

    setMessages((prev) => [
      ...prev, 
      { 
        role: 'user', 
        text: currentMessage, 
        fileName: currentFile ? currentFile.name : null 
      }
    ]);
    
    setIsLoading(true);

    try {
      let fileData = null;
      if (currentFile) {
        const base64 = await convertFileToBase64(currentFile);
        fileData = { data: base64, mimeType: currentFile.type };
      }

      const historyPayload = messages.map(m => ({ role: m.role, text: m.text }));

      const response = await fetch(`${ServerURI}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: currentMessage, 
          file: fileData,
          history: historyPayload
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply }]);
      setIsServerAwake(true);

    } catch (err) {
      console.error("Chat Error:", err);
      let errorMessage = "An unexpected error occurred.";
      
      if (err.message && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"))) {
        errorMessage = "Cannot connect to backend. Is 'node server.js' running?";
        setIsServerAwake(false);
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setMessages((prev) => [...prev, { role: 'bot', text: `⚠️ SYSTEM ERROR: ${errorMessage}` }]);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    // OUTER CONTAINER: 'h-screen' + 'p-4' ensures padding on ALL sides, preventing cut-off.
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 md:p-6 font-sans selection:bg-indigo-500/30">
      
      {/* --- Abstract Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-600/20 rounded-full blur-[100px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[100px] opacity-40 animate-pulse delay-700" />
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] contrast-150"></div>
      </div>

      {/* --- Chat Card --- */}
      {/* Uses 'h-[85vh]' to be tall but not full screen. 'flex-col' organizes Header -> Chat -> Input */}
      <div className="relative z-10 flex flex-col w-full max-w-5xl h-[85vh] min-h-[500px] bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        
        {/* Header: shrink-0 prevents it from being squashed */}
        <header className="shrink-0 bg-slate-900/80 backdrop-blur-md p-4 border-b border-white/10 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight leading-tight">NovaMind</h1>
              <div className="flex items-center gap-2">
                <span className={`flex w-1.5 h-1.5 rounded-full ${isServerAwake ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 animate-pulse'}`}></span>
                <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                  {isServerAwake ? 'Online' : 'Connecting...'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="hidden sm:flex px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-slate-400 font-medium">
            v2.5 Flash
          </div>
        </header>

        {/* Chat Area: flex-1 fills remaining space */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {messages.map((msg, index) => (
            <div key={index} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg mt-1 border border-white/5 ${
                  msg.role === 'user' ? 'bg-slate-800' : 'bg-indigo-600'
                }`}>
                  {msg.role === 'user' ? <User size={15} className="text-slate-300" /> : <Bot size={16} className="text-white" />}
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  {msg.fileName && (
                    <div className={`text-[10px] flex items-center gap-1 mb-1 px-2 py-0.5 rounded-md w-fit opacity-80 ${
                      msg.role === 'user' 
                        ? 'ml-auto bg-white/10 text-white' 
                        : 'bg-indigo-500/10 text-indigo-300'
                    }`}>
                      <Paperclip size={10} />
                      <span className="truncate max-w-[150px]">{msg.fileName}</span>
                    </div>
                  )}
                  
                  <div className={`p-3.5 md:p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-500/10'
                      : msg.text.startsWith('⚠️ SYSTEM ERROR') 
                        ? 'bg-red-900/30 border border-red-500/30 text-red-200 rounded-tl-sm' 
                        : 'bg-slate-800/60 border border-white/5 text-slate-200 rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start w-full pl-12">
              <div className="bg-slate-800/40 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-3 text-slate-400 shadow-sm">
                <Loader2 size={16} className="animate-spin text-indigo-400" />
                <span className="text-xs font-medium tracking-widest opacity-80">THINKING...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex justify-center w-full px-4 mt-4">
               <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm flex items-center gap-2 backdrop-blur-md shadow-lg">
                <AlertCircle size={16} className="shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area: shrink-0 ensures it stays at bottom */}
        <div className="shrink-0 p-4 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 z-20">
          
          {attachedFile && (
            <div className="mx-auto max-w-4xl mb-3 flex items-center gap-3 bg-slate-800/80 w-fit px-3 py-2 rounded-xl border border-white/10 shadow-lg animate-in slide-in-from-bottom-2">
              <div className="bg-indigo-500/20 p-1.5 rounded-lg">
                 <Paperclip size={14} className="text-indigo-400" />
              </div>
              <span className="text-xs text-slate-200 truncate max-w-[200px] font-medium">{attachedFile.name}</span>
              <button onClick={removeFile} className="text-slate-400 hover:text-red-400 hover:bg-white/5 p-1 rounded-full transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="relative flex items-end gap-2 max-w-4xl mx-auto bg-black/20 border border-white/10 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-transparent transition-all shadow-inner">
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,application/pdf,text/plain" 
            />

            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all shrink-0"
              title="Attach file"
            >
              <Paperclip size={20} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="w-full bg-transparent border-none text-white placeholder-slate-500 px-2 py-3 focus:outline-none text-[15px] h-full"
              disabled={isLoading}
              autoComplete="off"
            />

            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !attachedFile)}
              className={`p-3 rounded-xl transition-all shadow-lg shrink-0 flex items-center justify-center ${
                (!input.trim() && !attachedFile) || isLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
              }`}
            >
              <Send size={18} />
            </button>
          </form>
          
          <div className="text-center mt-2 text-[10px] text-slate-500 font-medium tracking-wide">
            NovaMind v2.5 • Session history clears on refresh
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;