"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { toast } from "sonner";
import { useWallet } from '@suiet/wallet-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuccessAnimation } from '../components/SuccessAnimation';

const API_BASE_URL = 'https://batuhantekin.icu/agent3/';

interface NewAgentFormProps {
  onNavigate: (view: string) => void;
}

const agentCategories = ["AI", "Economy", "Social Media", "Blockchain"];

function ImageUpload({ onFileChange, currentFile, isUploading }: { onFileChange: (file: File | null) => void; currentFile: File | null; isUploading: boolean }) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let objectUrl: string | null = null;
        if (currentFile) {
            objectUrl = URL.createObjectURL(currentFile);
            setPreviewUrl(objectUrl);
        } else {
            setPreviewUrl(null);
        }
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [currentFile]);

    const handleInternalFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            onFileChange(null);
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size should not exceed 2MB.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            onFileChange(null);
            return;
        }
        onFileChange(file);
    };

    const handleRemoveImage = () => {
        onFileChange(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.info("Image removed.");
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-2">
            <Label>Agent Image <span className="text-destructive">*</span></Label>
            <input
                id="imageUpload"
                type="file"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleInternalFileChange}
                className="hidden"
                ref={fileInputRef}
                disabled={isUploading}
                required
            />
            <div className="flex items-center gap-2">
                 {!previewUrl ? (
                    <Button type="button" onClick={handleButtonClick} disabled={isUploading} className="w-fit" variant="outline">
                        <Upload className="mr-2 h-4 w-4" /> Select Image
                    </Button>
                ) : (
                    <div className="flex items-center gap-3 w-full">
                        <img src={previewUrl} alt="Agent Preview" className="w-24 h-24 object-cover rounded-lg border flex-shrink-0" />
                        <Button type="button" variant="destructive" size="icon" onClick={handleRemoveImage} className="w-8 h-8 flex-shrink-0" disabled={isUploading}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
            {!isUploading && !previewUrl && (
                <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Max 2MB. JPG, PNG, GIF.
                </p>
            )}
        </div>
    );
}

const exampleUISchema = {
  type: "form",
  fields: [ { name: "prompt", type: "textarea", label: "Your Prompt", required: true } ],
};
const exampleOutputSchema = {
  type: "object",
  properties: { result: { type: "string", description: "The agent's output." } },
};

export function NewAgentForm({ onNavigate }: NewAgentFormProps) {
  const wallet = useWallet();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    agentUrl: "",
    category: "",
    creditCost: "",
    uiSchema: JSON.stringify(exampleUISchema, null, 2),
    outputSchema: JSON.stringify(exampleOutputSchema, null, 2),
  });
  const [agentImageFile, setAgentImageFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected || !wallet.account?.address) {
      toast.error("Please connect your wallet to publish an agent.");
      return;
    }
    if (!wallet.signAndExecuteTransactionBlock) {
      toast.error("Your wallet doesn't support the required transaction method.");
      return;
    }
    if (!formData.name || !formData.description || !formData.agentUrl || !formData.category || !formData.creditCost || !agentImageFile) {
      toast.error("Please fill in all required fields, including the agent image.");
      return;
    }

    setIsPublishing(true);
    toast.loading("Preparing agent registration...", { id: 'publish-agent' });

    const data = new FormData();
    data.append('walletAddress', wallet.account.address);
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('endpoint', formData.agentUrl);
    data.append('categoryName', formData.category);
    data.append('credit', formData.creditCost);
    data.append('inputSchema', formData.uiSchema);
    data.append('outputSchema', formData.outputSchema);
    data.append('file', agentImageFile);

    try {
      const response = await fetch(`${API_BASE_URL}/builder/register-agent`, {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to prepare registration.");
      }

      const { txBytes } = await response.json();
      if (!txBytes) throw new Error("No transaction bytes received from backend.");
      
      toast.info("Please approve the transaction in your wallet to publish.", { id: 'publish-agent' });

      // Create a TransactionBlock from the received bytes
      const tx = TransactionBlock.from(txBytes);

      // Sign and execute the transaction
      const result = await wallet.signAndExecuteTransaction({
        transaction: txBytes,
      });

      // Success: Show animation
      toast.dismiss('publish-agent');
      setShowSuccess(true);

      // Birkaç saniye sonra dashboard'a yönlendir
      setTimeout(() => {
        setShowSuccess(false);
        onNavigate("dashboard");
      }, 2000);

    } catch (error: any) {
      toast.error(`Failed to publish: ${error.message}`, { id: 'publish-agent' });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      {showSuccess && (
        <SuccessAnimation message="Your agent has been published successfully!" />
      )}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => onNavigate("dashboard")}
          className="gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1>Publish New Agent</h1>
          <p className="text-muted-foreground mt-2">
            Share your AI tool with the community and start earning points
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form content remains the same */}
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
                <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div>
                <Label>Agent Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g., Content Generator Pro"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2"
                  required
                />
              </div>
              
              <ImageUpload
                onFileChange={setAgentImageFile}
                currentFile={agentImageFile}
                isUploading={isPublishing}
              />

              <div>
                <Label>Description <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="Describe what your agent does..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2 min-h-24"
                  required
                />
              </div>

              <div>
                <Label>Category <span className="text-destructive">*</span></Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border border-border rounded-lg bg-background"
                  required
                >
                  <option value="" disabled>Select a category...</option>
                  {agentCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
                <CardTitle>API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div>
                <Label>Agent URL (API Endpoint) <span className="text-destructive">*</span></Label>
                <Input
                  type="url"
                  placeholder="https://api.example.com/agent"
                  value={formData.agentUrl}
                  onChange={(e) => setFormData({ ...formData, agentUrl: e.target.value })}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label>Cost per Use (Credits) <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g., 5"
                  value={formData.creditCost}
                  onChange={(e) => setFormData({ ...formData, creditCost: e.target.value })}
                  className="mt-2"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
                <CardTitle>UI & Output Schemas</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div>
                <Label>UI Schema (Input) <span className="text-destructive">*</span></Label>
                <Textarea
                  value={formData.uiSchema}
                  onChange={(e) => setFormData({ ...formData, uiSchema: e.target.value })}
                  required
                  className="mt-2 min-h-48 font-mono text-sm"
                />
              </div>
              <div>
                <Label>Output Schema (Optional)</Label>
                <Textarea
                  value={formData.outputSchema}
                  onChange={(e) => setFormData({ ...formData, outputSchema: e.target.value })}
                  className="mt-2 min-h-48 font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" className="gap-2 flex-1" disabled={isPublishing}>
              {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Upload className="w-4 h-4" />
              Publish Agent
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigate("dashboard")}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}