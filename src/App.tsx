import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMOJI_CHOICES = ["🔥", "🌊", "🌱", "💎", "⚡", "🌙", "☀️", "🎵", "🍋", "🍩"];

const REMIX_RECIPES: Array<[string, string, string]> = [
  ["🔥", "🌊", "🌪️"],
  ["🔥", "🌱", "🌶️"],
  ["🔥", "🎵", "🥁"],
  ["🌊", "🌙", "🌫️"],
  ["🌊", "🍋", "🥤"],
  ["🌱", "💎", "🧪"],
  ["🌱", "☀️", "🌻"],
  ["💎", "⚡", "🔮"],
  ["⚡", "🎵", "🎧"],
  ["🌙", "☀️", "🌈"],
  ["🎵", "🍩", "🎂"],
  ["🍋", "🍩", "🍰"],
];

const SURPRISE_POOL = ["💫", "🌀", "🧬", "🎇", "🌠", "✨"];

const recipeLookup = new Map(REMIX_RECIPES.map(([left, right, result]) => [pairKey(left, right), result]));

function pairKey(a: string, b: string) {
  return [a, b].sort((first, second) => first.localeCompare(second)).join("+");
}

function remixEmojis(left: string, right: string) {
  const key = pairKey(left, right);
  const direct = recipeLookup.get(key);

  if (direct) {
    return direct;
  }

  const codes = [...left, ...right].map((char) => char.codePointAt(0) ?? 0);
  const total = codes.reduce((sum, code) => sum + code, 0);
  return SURPRISE_POOL[total % SURPRISE_POOL.length];
}

function App() {
  useEffect(() => {
    // important, never remove this sdk init
    sdk.actions.ready();
  }, []);

  const [leftEmoji, setLeftEmoji] = useState<string | null>(null);
  const [rightEmoji, setRightEmoji] = useState<string | null>(null);
  const [remixResult, setRemixResult] = useState<string | null>(null);
  const [isMixing, setIsMixing] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const canRemix = Boolean(leftEmoji && rightEmoji);

  const handleRemix = () => {
    if (!leftEmoji || !rightEmoji) {
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setIsMixing(true);
    timeoutRef.current = window.setTimeout(() => {
      setRemixResult(remixEmojis(leftEmoji, rightEmoji));
      setIsMixing(false);
    }, 350);
  };

  const headline = useMemo(() => {
    if (!canRemix) {
      return "Pick two vibes to blend";
    }

    if (isMixing) {
      return "Mixing up something new";
    }

    return "Tap remix to reveal";
  }, [canRemix, isMixing]);

  return (
    <main className="min-h-dvh bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-8 px-5 py-10">
        <header className="w-full space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-indigo-500">Emoji Mixer</p>
          <h1 className="text-balance text-3xl font-semibold leading-tight">Remix your favorite pairings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{headline}</p>
        </header>

        <section className="w-full space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <EmojiPicker
              label="First emoji"
              options={EMOJI_CHOICES}
              selected={leftEmoji}
              onSelect={setLeftEmoji}
              alignment="right"
            />

            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="h-14 w-px rounded-full bg-gradient-to-b from-indigo-500/20 via-indigo-500/60 to-indigo-500/20" />
              <Button
                type="button"
                size="lg"
                className="min-h-[82px] min-w-[82px] rounded-full text-lg font-semibold shadow-md"
                onClick={handleRemix}
                disabled={!canRemix || isMixing}
              >
                {isMixing ? "Remixing" : "Remix"}
              </Button>
              <div className="h-14 w-px rounded-full bg-gradient-to-b from-indigo-500/20 via-indigo-500/60 to-indigo-500/20" />
            </div>

            <EmojiPicker
              label="Second emoji"
              options={EMOJI_CHOICES}
              selected={rightEmoji}
              onSelect={setRightEmoji}
              alignment="left"
            />
          </div>

          <RemixOutput left={leftEmoji} right={rightEmoji} result={remixResult} isMixing={isMixing} />
        </section>
      </div>
    </main>
  );
}

interface EmojiPickerProps {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (emoji: string) => void;
  alignment: "left" | "right";
}

function EmojiPicker({ label, options, selected, onSelect, alignment }: EmojiPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className={alignment === "left" ? "text-left" : "text-right"}>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((emoji) => {
          const isActive = selected === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelect(emoji)}
              aria-pressed={isActive}
              className={cn(
                "flex h-16 items-center justify-center rounded-2xl border text-3xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
                isActive
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-200"
                  : "border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-400/60 dark:hover:bg-indigo-500/10",
              )}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface RemixOutputProps {
  left: string | null;
  right: string | null;
  result: string | null;
  isMixing: boolean;
}

function RemixOutput({ left, right, result, isMixing }: RemixOutputProps) {
  const showResult = Boolean(result && !isMixing);

  return (
    <div
      className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300"
      aria-live="polite"
    >
      {!left || !right ? (
        <span>Choose two emojis to get started.</span>
      ) : isMixing ? (
        <span>Remixing your combo...</span>
      ) : showResult ? (
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Your remix</div>
          <div className="flex items-center gap-3 text-4xl">
            <span>{left}</span>
            <span className="text-base text-slate-400">+</span>
            <span>{right}</span>
            <span className="text-base text-slate-400">→</span>
            <span>{result}</span>
          </div>
        </div>
      ) : (
        <span>Hit remix to see the magic.</span>
      )}
    </div>
  );
}

export default App;
