import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Clock, 
  DollarSign, 
  ClipboardCheck, 
  Calendar, 
  UserCheck, 
  CheckCircle2,
  Circle,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PipelineStage, InquiryStageStatus } from "@shared/schema";
import { stageDisplayNames } from "@shared/schema";

const trackableStages: PipelineStage[] = [
  "inquiry",
  "vob_pending",
  "quote_client",
  "pre_assessment",
  "scheduled",
  "admitted",
];

const stageIcons: Record<string, typeof Phone> = {
  inquiry: Phone,
  vob_pending: Clock,
  quote_client: DollarSign,
  pre_assessment: ClipboardCheck,
  scheduled: Calendar,
  admitted: UserCheck,
};

interface StageNavigatorProps {
  inquiryId: number;
  currentStage: PipelineStage;
  onStageClick?: (stage: PipelineStage) => void;
  onDownloadDocs?: () => void;
  isDownloading?: boolean;
}

export function StageNavigator({
  inquiryId,
  currentStage,
  onStageClick,
  onDownloadDocs,
  isDownloading = false,
}: StageNavigatorProps) {
  // Default to expanded to show progress immediately
  const [isExpanded, setIsExpanded] = useState(true);
  
  const { data: stageStatuses } = useQuery<InquiryStageStatus[]>({
    queryKey: ["/api/inquiries", inquiryId, "stage-status"],
  });

  const getStageStatus = (stage: PipelineStage): "not_started" | "in_progress" | "completed" => {
    const status = stageStatuses?.find(s => s.stageName === stage);
    if (status?.status) return status.status as "not_started" | "in_progress" | "completed";
    
    const currentIndex = trackableStages.indexOf(currentStage);
    const stageIndex = trackableStages.indexOf(stage);
    
    if (stageIndex < currentIndex) return "completed";
    if (stageIndex === currentIndex) return "in_progress";
    return "not_started";
  };

  const isNonTrackable = currentStage === "non_viable" || currentStage === "lost";

  return (
    <div className="border rounded-md bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between gap-2 hover-elevate"
        data-testid="button-toggle-stage-nav"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Admission Progress</span>
          <Badge variant="outline" className="text-xs">
            {isNonTrackable 
              ? stageDisplayNames[currentStage]
              : `${trackableStages.indexOf(currentStage) + 1} of ${trackableStages.length}`
            }
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex flex-col gap-1">
            {trackableStages.map((stage, index) => {
              const Icon = stageIcons[stage];
              const status = getStageStatus(stage);
              const isCurrentOrPast = trackableStages.indexOf(currentStage) >= index || status === "completed";
              const isCurrent = stage === currentStage;

              return (
                <button
                  key={stage}
                  onClick={() => onStageClick?.(stage)}
                  disabled={!isCurrentOrPast && !isNonTrackable}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                    isCurrent && "bg-primary/10",
                    isCurrentOrPast && !isCurrent && "hover-elevate",
                    !isCurrentOrPast && !isNonTrackable && "opacity-50 cursor-not-allowed"
                  )}
                  data-testid={`button-stage-${stage}`}
                >
                  <div className="relative">
                    {status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : status === "in_progress" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center">
                        <Circle className="w-2 h-2 fill-primary text-primary" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                    {index < trackableStages.length - 1 && (
                      <div 
                        className={cn(
                          "absolute left-1/2 top-5 w-0.5 h-4 -translate-x-1/2",
                          status === "completed" ? "bg-green-500" : "bg-border"
                        )} 
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Icon className={cn(
                      "w-4 h-4",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm",
                      isCurrent ? "font-medium" : "text-muted-foreground"
                    )}>
                      {stageDisplayNames[stage]}
                    </span>
                  </div>
                  {status === "completed" && (
                    <Badge variant="secondary" className="text-xs">Done</Badge>
                  )}
                </button>
              );
            })}
          </div>

          {currentStage === "admitted" && onDownloadDocs && (
            <div className="pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onDownloadDocs}
                disabled={isDownloading}
                data-testid="button-download-docs"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download All Documents
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
