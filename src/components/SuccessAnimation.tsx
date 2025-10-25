// src/components/SuccessAnimation.tsx
"use client";

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface SuccessAnimationProps {
  message: string;
}

export function SuccessAnimation({ message }: SuccessAnimationProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="max-w-sm w-full p-8 shadow-2xl animate-in fade-in-0 zoom-in-95">
        <CardContent className="p-0 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-24 h-24 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Success!</h2>
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}