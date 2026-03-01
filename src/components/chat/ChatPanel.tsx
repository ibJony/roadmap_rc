'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useOrgStore } from '@/lib/stores/org-store';
import { useToastStore } from '@/lib/stores/toast-store';

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert product strategy assistant embedded in RMLAB Roadmap — a stage-gated product management tool built on the RMLAB framework.

The RMLAB framework organises work into five stages:
1. Ideas – raw, unvalidated ideas captured for consideration.
2. Exploration – problem validation, user research, and value definition.
3. Prototyping – solution design, user testing, and success metrics baselining.
4. Production – engineering execution against documented requirements.
5. Compost – ideas that have been deliberately de-prioritised, with lessons captured.

Each stage has defined exit criteria. Teams use OKRs (Objectives and Key Results) to link initiatives to measurable outcomes.

Help the user think through product decisions, write problem statements, define success metrics, structure OKRs, plan stage transitions, and reason about prioritisation. Be concise, practical, and outcome-oriented.`;

// ── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'shrink-0 size-7 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground border border-border'
        )}
      >
        {isUser ? 'You' : 'AI'}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm border border-border'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            'text-[10px] mt-1',
            isUser ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'
          )}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 size-7 rounded-full flex items-center justify-center text-xs font-semibold bg-muted text-muted-foreground border border-border mt-0.5">
        AI
      </div>
      <div className="bg-muted border border-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Main component ───────────────────────────────────────────────────────────

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const anthropicKey = useOrgStore((s) => s.selectedOrg?.anthropicKey ?? '');
  const { showError } = useToastStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    if (!anthropicKey) {
      showError('No API key', 'Please add your Anthropic API key in Settings.');
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build the messages payload for the API
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          system: SYSTEM_PROMPT,
          apiKey: anthropicKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? `HTTP ${response.status}`);
      }

      const data = await response.json();
      const assistantContent: string =
        data.content?.[0]?.text ?? data.message ?? 'Sorry, I could not generate a response.';

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      showError('AI error', err instanceof Error ? err.message : 'Unknown error');
      // Remove the optimistic user message on failure
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setInput(text);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    setMessages([]);
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex flex-col p-0 w-full sm:max-w-md gap-0"
      >
        {/* Header */}
        <SheetHeader className="flex-row items-center justify-between px-4 py-3 border-b border-border gap-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-muted-foreground" />
            <SheetTitle className="text-sm font-semibold">AI Assistant</SheetTitle>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button size="sm" variant="ghost" onClick={handleClear} className="text-xs h-7">
                Clear
              </Button>
            )}
            <Button size="icon" variant="ghost" className="size-7" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
          <div className="py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <MessageSquare className="size-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">RMLAB AI Assistant</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-52 leading-relaxed">
                  Ask me anything about product strategy, OKRs, stage transitions, or how to use the
                  RMLAB framework.
                </p>
                {!anthropicKey && (
                  <p className="text-xs text-destructive mt-3 bg-destructive/10 rounded px-3 py-1.5">
                    Add your Anthropic API key in Settings to start chatting.
                  </p>
                )}
              </div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
            )}
            {isLoading && <TypingIndicator />}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Ask about your roadmap…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !anthropicKey}
              className="flex-1 text-sm"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !anthropicKey}
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Press Enter to send · Powered by Claude
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
