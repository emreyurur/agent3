// src/components/HistoryDetailModal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { AgentHistoryItem } from "../pages/MyAgents"; // Tipi MyAgents'ten import ediyoruz
// Artık JsonViewer veya OutputRenderer gibi complex bileşenlere gerek yok.

interface HistoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: AgentHistoryItem | null; // Gösterilecek olan, seçili geçmiş öğesi
}

// Tarihi daha okunabilir bir formata çevir
const formatTimestamp = (dateStr: string) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// Çıktıyı basit metin olarak formatlayan yardımcı fonksiyon
const formatOutputText = (output: any, agentCategory: string) => {
  if (typeof output === 'string') {
    return output; // Eğer zaten string ise direkt kullan
  }
  if (output && typeof output === 'object') {
    // Eğer tek bir anahtar içeren basit bir obje ise, o değeri kullan
    const keys = Object.keys(output);
    if (keys.length === 1 && typeof output[keys[0]] === 'string') {
      return output[keys[0]];
    }
    // Resim kategorisi ise URL'yi göster
    if (agentCategory === 'Image' && output.url && typeof output.url === 'string') {
      return `Image URL: ${output.url}`;
    }
    // Haber dizisi ise başlıkları ve özetleri birleştir
    if (Array.isArray(output) && output.length > 0 && output[0]?.summary) {
        return output.map((news: any) => `${news.title || "No Title"}: ${news.summary || "No summary"}`).join("\n\n");
    }
  }
  // Hiçbiri uymazsa veya fullOutput boşsa, bir placeholder metin döndür
  return "Detailed output not available in simple text format.";
};

export function HistoryDetailModal({ isOpen, run, onClose }: HistoryDetailModalProps) {
  if (!run) return null; // Eğer 'run' verisi yoksa, modal'ı render etme

  const outputText = formatOutputText(run.fullOutput, run.agentCategory);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[70vh] flex flex-col"> {/* Daha küçük bir modal */}
        <DialogHeader>
          <DialogTitle className="text-xl">Output for: {run.agentName}</DialogTitle>
          <DialogDescription>
            Run executed on: {formatTimestamp(run.timestamp)}
          </DialogDescription>
        </DialogHeader>
        
        {/* Scroll edilebilir içerik alanı */}
        <ScrollArea className="flex-grow py-4 pr-4">
          <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {outputText}
          </p>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}