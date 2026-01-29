import { useState } from "react";
import { ChevronLeft, ChevronDown, Upload, FileText, Download, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryOptions } from "@/data/tournamentData";

interface HostTournamentProps {
  onBack: () => void;
}

const HostTournament = ({ onBack }: HostTournamentProps) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categoryOptions[0]);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [fileName, setFileName] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="bg-card border-border hover:bg-muted rounded-full w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">Host Tournament</h1>
          <p className="text-xs sm:text-base text-muted-foreground">Organize competitive exams and academic tournaments</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Tournament Configuration */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <span className="text-lg sm:text-xl">✏️</span>
            <h2 className="text-base sm:text-lg font-semibold text-primary">Tournament Configuration</h2>
          </div>

          {/* Tournament Title */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">Tournament title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g Annual JAMB Mock 2026"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
            />
          </div>

          {/* Category & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">Category</label>
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-background border border-border rounded-lg text-foreground text-sm sm:text-base"
                >
                  {category}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10">
                    {categoryOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setCategory(opt);
                          setShowCategoryDropdown(false);
                        }}
                        className="w-full px-3 sm:px-4 py-2 text-left hover:bg-muted text-foreground first:rounded-t-lg last:rounded-b-lg text-sm sm:text-base"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">Visibility</label>
              <div className="flex gap-2">
                <Button
                  variant={visibility === "public" ? "default" : "outline"}
                  onClick={() => setVisibility("public")}
                  size="sm"
                  className={`flex-1 text-xs sm:text-sm ${visibility === "public" 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-background border-border"
                  }`}
                >
                  Public
                </Button>
                <Button
                  variant={visibility === "private" ? "default" : "outline"}
                  onClick={() => setVisibility("private")}
                  size="sm"
                  className={`flex-1 text-xs sm:text-sm ${visibility === "private" 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-background border-border"
                  }`}
                >
                  Private
                </Button>
              </div>
            </div>
          </div>

          {/* Review Process Info */}
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex gap-2 sm:gap-3">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-foreground font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">Review Process</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  To ensure question quality, all uploads are subject to human review. Verification 
                  takes up to 24 hours before the tournament goes live.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-sm sm:text-base">
            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
            Submit for Review
          </Button>
        </div>

        {/* Upload Questions */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <span className="text-lg sm:text-xl">🔄</span>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Upload Questions</h2>
          </div>

          {/* File Drop Zone */}
          <div className="border-2 border-dashed border-border rounded-xl p-6 sm:p-8 mb-4 sm:mb-6 text-center hover:border-accent/50 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-accent/10 flex items-center justify-center mb-3 sm:mb-4">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
                </div>
                <p className="text-foreground font-medium mb-1 text-sm sm:text-base">Drop your CSV here</p>
                <p className="text-xs sm:text-sm text-muted-foreground">or click to browse from your device</p>
              </div>
            </label>
          </div>

          {/* Format Template */}
          <div className="flex items-center justify-between bg-background rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">FORMAT TEMPLATE</p>
                <p className="text-xs sm:text-sm text-foreground truncate">Standard_questions_v2.pdf</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80 text-xs sm:text-sm flex-shrink-0">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">download</span>
            </Button>
          </div>

          {/* Submission Status */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm text-foreground">Submission Status</span>
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                No File Detected
              </span>
            </div>
          </div>

          {/* 24-Hour Verification */}
          <div className="bg-background rounded-lg p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
              <div>
                <h4 className="text-foreground font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">24-Hour Verification</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Our academic board will check for accuracy and formatting once submitted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostTournament;
