"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Github, Send, Code2, Bot, User, FileText, Lightbulb, Bug, BarChart2, Layers, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AppState = "upload" | "processing" | "chat"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}
const BACKEND_URL =  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
export default function CodeChatbot() {
  const [appState, setAppState] = useState<AppState>("upload")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [githubUrl, setGithubUrl] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File []>([])
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (files && files.length > 0) {
    const fileArray = Array.from(files) as File[];
    setUploadedFiles(fileArray);
    processFile(fileArray);
  }
};

  const handleGithubSubmit = () => {
    if (githubUrl.trim()) {
      processFile()
    }
  }

  const processFile = async (files? : File[]) => {
    setAppState("processing");
    setErrorMessage("");

    let uploadSuccess = false;
    let errorMsg = "";

    if (files && files.length > 0) {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file); // key must match backend
      });
      try {
        const res = await fetch(`${BACKEND_URL}/upload-file`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          uploadSuccess = true;
        } else {
          const data = await res.json().catch(() => ({}));
          errorMsg = data.detail || data.message || "Failed to process uploaded files.";
        }
      } catch (err) {
        errorMsg = "Network error during file upload.";
      }
    } else if (githubUrl.trim()) {
      const formData = new FormData();
      formData.append("repo_url", githubUrl);
      try {
        const res = await fetch(`${BACKEND_URL}/upload-github`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          uploadSuccess = true;
        } else {
          const data = await res.json().catch(() => ({}));
          errorMsg = data.detail || data.message || "Failed to process GitHub repository.";
        }
      } catch (err) {
        errorMsg = "Network error during GitHub upload.";
      }
    }

    if (uploadSuccess) {
      setAppState("chat");
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: `I've successfully analyzed your ${files ? "code file" : "GitHub repository"}! I'm ready to answer any questions about the codebase.`,
          timestamp: new Date(),
        },
      ]);
    } else {
      setAppState("upload");
      setErrorMessage(errorMsg);
    }
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev: any) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    const res = await fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: inputMessage }),
  });

  const data = await res.json();
  const aiMessage: Message = {
    id: (Date.now() + 1).toString(),
    role: "assistant",
    content: data.response,
    timestamp: new Date(),
  };

  setMessages((prev: any) => [...prev, aiMessage]);
  setIsTyping(false);
};

  const FUNCTIONAL_BUTTONS = [
    { label: "Summarize", prompt: "Summarize the codebase.", icon: <Layers className="w-4 h-4 mr-2" />, gradient: "from-blue-500 to-cyan-500", shimmer: true },
    { label: "Tech Stack", prompt: "List and explain the tech stack used in this codebase.", icon: <Sparkles className="w-4 h-4 mr-2" />, gradient: "from-fuchsia-500 to-pink-500", shimmer: true },
    { label: "Find Bugs", prompt: "Find and explain any potential bugs or issues in this codebase.", icon: <Bug className="w-4 h-4 mr-2" />, gradient: "from-red-500 to-orange-500", shimmer: true, wiggle: true },
    { label: "Analysis", prompt: "Provide a high-level analysis of this codebase.", icon: <BarChart2 className="w-4 h-4 mr-2" />, gradient: "from-green-500 to-emerald-500", shimmer: true },
    { label: "Improvements", prompt: "Suggest improvements for this codebase.", icon: <Lightbulb className="w-4 h-4 mr-2" />, gradient: "from-yellow-500 to-orange-500", shimmer: true },
  ];

  const handleFunctionalButton = async (prompt: string) => {
    setIsTyping(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };
    setMessages((prev: any) => [...prev, userMessage]);
    setInputMessage("");
    const res = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: prompt }),
    });
    const data = await res.json();
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: data.response,
      timestamp: new Date(),
    };
    setMessages((prev: any) => [...prev, aiMessage]);
    setIsTyping(false);
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Add shimmer and wiggle keyframes
  const shimmerStyle = {
    backgroundSize: '200% 100%',
    backgroundPosition: 'left center',
    transition: 'background-position 0.5s',
  };

  const shimmerHoverStyle = {
    backgroundPosition: 'right center',
  };

  const wiggleKeyframes = `@keyframes wiggle { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <AnimatePresence mode="wait">
          {appState === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    <Code2 className="w-16 h-16 text-purple-400" />
                    <div className="absolute inset-0 bg-purple-400/20 blur-xl rounded-full"></div>
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
                >
                  CodeChat AI
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-gray-300 max-w-2xl mx-auto"
                >
                  Upload your code or paste a GitHub repository link to start an intelligent conversation about your
                  codebase
                </motion.p>
              </div>

              {/* Upload Section */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* File Upload */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Code File
                  </h3>

                  <div onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative border-2 border-dashed border-purple-500/50 rounded-xl p-8 text-center hover:border-purple-400/70 transition-all duration-300 bg-black/20 backdrop-blur-sm">
                      <FileText className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-gray-300 mb-2">
                        {uploadedFiles.length > 0 ? uploadedFiles.map(f => f.name).join(", ") : "Click to upload or drag & drop"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports .py, .js, .ts, .jsx, .tsx, .ipynb, .java, .cpp
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    accept=".py,.js,.ts,.jsx,.tsx,.ipynb,.java,.cpp,.c,.go,.rs,.php,.rb,.swift,.kt,.scala,.r,.m,.pl,.sh,.sql,.html,.css,.json,.xml,.yaml,.yml,.md,.txt"
                    className="hidden"
                  />

                  {uploadedFiles.length > 0 && (
                    <Button
                      onClick={() => processFile(uploadedFiles)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                    >
                      Analyze Code
                    </Button>
                  )}
                </motion.div>

                {/* GitHub URL */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    GitHub Repository
                  </h3>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative space-y-4 p-6 border border-blue-500/30 rounded-xl bg-black/20 backdrop-blur-sm">
                      <Input
                        type="url"
                        placeholder="https://github.com/username/repository"
                        value={githubUrl}
                        onChange={(e: { target: { value: any } }) => setGithubUrl(e.target.value)}
                        className="bg-black/40 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                      />

                      <Button
                        onClick={handleGithubSubmit}
                        disabled={!githubUrl.trim()}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                      >
                        Analyze Repository
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
              {errorMessage && (
                <div className="mb-4 text-red-400 bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-center">
                  {errorMessage}
                </div>
              )}
            </motion.div>
          )}

          {appState === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-400 rounded-full"
                />
                <div className="absolute inset-0 bg-purple-400/20 blur-xl rounded-full"></div>
              </div>

              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-purple-300">Analyzing Your Code</h2>
                <div className="space-y-2">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-400"
                  >
                    Reading and understanding your codebase...
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="text-gray-400"
                  >
                    Creating embeddings and building knowledge graph...
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                    className="text-gray-400"
                  >
                    Almost ready for your questions!
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}

          {appState === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-[80vh] flex flex-col"
            >
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-800/50 bg-black/20 backdrop-blur-sm rounded-t-xl">
                <div className="relative">
                  <Bot className="w-8 h-8 text-purple-400" />
                  <div className="absolute inset-0 bg-purple-400/20 blur-lg rounded-full"></div>
                </div>
                <div>
                  <h2 className="font-semibold text-purple-300">CodeChat AI</h2>
                  <p className="text-sm text-gray-400">Ready to discuss your code</p>
                </div>
                {/* Upload Again Button */}
                <div className="ml-auto">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setAppState("upload");
                      setMessages([]);
                      setInputMessage("");
                      setUploadedFiles([]);
                      setGithubUrl("");
                    }}
                    className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-gray-900 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                  >
                    Upload Again
                  </Button>
                </div>
              </div>
              {/* Functional Buttons */}
              <div className="flex flex-wrap gap-3 p-4 border-b border-gray-800/50 bg-black/10">
                <style>{`
                  .shimmer-btn {
                    background-size: 200% 100%;
                    transition: background-position 0.5s, transform 0.15s;
                  }
                  .shimmer-btn:hover {
                    background-position: right center;
                    filter: brightness(1.1);
                    transform: scale(1.07);
                  }
                  .wiggle-btn:hover {
                    animation: wiggle 0.4s;
                  }
                  ${wiggleKeyframes}
                `}</style>
                {FUNCTIONAL_BUTTONS.map(btn => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => handleFunctionalButton(btn.prompt)}
                    className={`shimmer-btn ${btn.wiggle ? 'wiggle-btn' : ''} flex items-center font-semibold px-5 py-2 rounded-lg shadow-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/40 transition-all duration-200 border-0 text-base`
                      + ` bg-gradient-to-r ${btn.gradient}`}
                    style={btn.shimmer ? shimmerStyle : {}}
                  >
                    {btn.icon}
                    {btn.label}
                  </button>
                ))}
              </div>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/10 backdrop-blur-sm">
                {messages.map((message: { id: any; role: string; content: any; timestamp: { toLocaleTimeString: () => any } }) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="relative">
                        <Bot className="w-8 h-8 text-purple-400 mt-1" />
                        <div className="absolute inset-0 bg-purple-400/20 blur-lg rounded-full"></div>
                      </div>
                    )}

                    <div
                      className={`max-w-[70%] p-4 rounded-2xl ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white ml-auto"
                          : "bg-gray-800/80 text-gray-100 backdrop-blur-sm border border-gray-700/50"
                      }`}
                    >
                      {/* Render markdown for assistant, plain for user */}
                      {message.role === "assistant" ? (
                        <ReactMarkdown
                          children={message.content}
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({node, inline, className, children, ...props}: {node: any, inline?: boolean, className?: string, children: React.ReactNode}) {
                              return !inline ? (
                                <pre className="bg-black/80 rounded-lg p-3 overflow-x-auto my-2 text-sm"><code {...props}>{children}</code></pre>
                              ) : (
                                <code className="bg-gray-900/60 px-1 rounded text-purple-300" {...props}>{children}</code>
                              );
                            }
                          }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      <p className="text-xs opacity-60 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                    </div>

                    {message.role === "user" && (
                      <div className="relative">
                        <User className="w-8 h-8 text-blue-400 mt-1" />
                        <div className="absolute inset-0 bg-blue-400/20 blur-lg rounded-full"></div>
                      </div>
                    )}
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="relative">
                      <Bot className="w-8 h-8 text-purple-400 mt-1" />
                      <div className="absolute inset-0 bg-purple-400/20 blur-lg rounded-full"></div>
                    </div>
                    <div className="bg-gray-800/80 text-gray-100 backdrop-blur-sm border border-gray-700/50 p-4 rounded-2xl">
                      <div className="flex space-x-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                          className="w-2 h-2 bg-purple-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                          className="w-2 h-2 bg-purple-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                          className="w-2 h-2 bg-purple-400 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              {/* Input */}
              <div className="p-4 border-t border-gray-800/50 bg-black/20 backdrop-blur-sm rounded-b-xl">
                <div className="flex gap-3">
                  <Textarea
                    value={inputMessage}
                    onChange={(e: { target: { value: any } }) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your code..."
                    className="flex-1 bg-black/40 border-gray-700/50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400/20 resize-none min-h-[50px] max-h-[120px]"
                    rows={1}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white p-3 rounded-lg transition-all duration-300"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
