// src/components/DynamicFormRenderer.tsx
"use client";

import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Upload } from "lucide-react";

// Alan (field) tanımı için bir arayüz
interface FormField {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  accept?: string;
}

// Şema tanımı için bir arayüz
interface FormSchema {
  type: 'form';
  fields: FormField[];
}

// Component'in alacağı props'lar
interface DynamicFormRendererProps {
  schema: FormSchema;
  formData: Record<string, any>;
  onFormChange: (name: string, value: any) => void;
}

export function DynamicFormRenderer({ schema, formData, onFormChange }: DynamicFormRendererProps) {
  // Alan tipi ne olursa olsun state'i güncelleyen genel bir fonksiyon
  const handleChange = (name: string, value: any) => {
    onFormChange(name, value);
  };

  return (
    <div className="space-y-4">
      {schema.fields.map((field) => {
        // Her bir alan için doğru input elemanını render et
        switch (field.type) {
          case 'text':
            return (
              <div key={field.name}>
                <Label htmlFor={field.name}>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
                <Input
                  id={field.name}
                  type="text"
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="mt-2"
                />
              </div>
            );
          
          case 'textarea':
            return (
              <div key={field.name}>
                <Label htmlFor={field.name}>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="mt-2 min-h-32"
                />
              </div>
            );

          case 'select':
            return (
              <div key={field.name}>
                <Label htmlFor={field.name}>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
                <select
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="mt-2 w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="" disabled>Select an option...</option>
                  {field.options?.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            );

          case 'file':
            return (
              <div key={field.name}>
                <Label htmlFor={field.name}>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-1">{field.accept}</p>
                    </div>
                    <input
                      id={field.name}
                      type="file"
                      accept={field.accept}
                      className="hidden"
                      onChange={(e) => handleChange(field.name, e.target.files?.[0])}
                    />
                  </label>
                  {formData[field.name] && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected file: {formData[field.name].name}
                    </p>
                  )}
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}