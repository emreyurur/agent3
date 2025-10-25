"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { ExternalLink } from "lucide-react";

// Agent'tan gelen çıktıdaki her bir haber objesinin tipi
interface NewsArticle {
  title: string;
  summary: string;
  news: string; // Bu, tam metin veya kaynak snippet olabilir
  url?: string; // Şemanızda yoktu ama olursa diye ekliyorum
}

// Bileşenin alacağı props'lar
interface RendererProps {
  output: any; // Agent'tan gelen ham JSON çıktısı
  schema?: any; // Gelecekte kullanılabilir
}

// Bir haber makalesini gösteren tekil kart bileşeni
function NewsArticleCard({ item }: { item: NewsArticle }) {
  return (
    <Card className="overflow-hidden shadow-md transition-all hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Özet (Summary) */}
        <p className="text-sm text-muted-foreground">{item.summary}</p>
        
        {/* Haber (News) - Vurgulu bir alanda */}
        <div className="bg-secondary p-3 rounded-md">
          <p className="text-sm text-foreground italic">
            "{item.news}"
          </p>
        </div>
        
        {/* URL varsa, bir link göster */}
        {item.url && (
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
                Read more <ExternalLink className="w-3 h-3" />
            </a>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Agent'tan gelen 'output' verisini, 'schema'ya göre (veya verinin yapısına göre)
 * güzel bir arayüzde render eder.
 */
export function DynamicOutputRenderer({ output, schema }: RendererProps) {
  // Çıktı, istediğimiz haber dizisi formatında mı diye kontrol et
  if (Array.isArray(output) && output.length > 0 && output[0].hasOwnProperty('title') && output[0].hasOwnProperty('summary')) {
    return (
      <div className="space-y-4">
        {output.map((item, index) => (
          <NewsArticleCard key={index} item={item as NewsArticle} />
        ))}
      </div>
    );
  }

  // Eğer beklenen formatta değilse veya boşsa, ham JSON olarak göster (fallback)
  return (
    <pre className="whitespace-pre-wrap bg-secondary p-4 rounded-lg text-sm">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}