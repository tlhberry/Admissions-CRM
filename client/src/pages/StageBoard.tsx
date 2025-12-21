import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Phone,
  Clock,
  DollarSign,
  ClipboardCheck,
  Calendar,
  UserCheck,
  XCircle,
  UserX,
  MoreVertical,
  Trash2,
  ArrowRightLeft,
  Edit,
  Save,
  X,
} from "lucide-react";
import type { Inquiry, PipelineStage } from "@shared/schema";
import { stageDisplayNames, pipelineStages } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const stageIcons: Record<PipelineStage, typeof Phone> = {
  inquiry: Phone,
  vob_pending: Clock,
  quote_client: DollarSign,
  pre_assessment: ClipboardCheck,
  scheduled: Calendar,
  admitted: UserCheck,
  non_viable: XCircle,
  lost: UserX,
};

const stageColors: Record<PipelineStage, string> = {
  inquiry: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  vob_pending: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  quote_client: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
  pre_assessment: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
  scheduled: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  admitted: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  non_viable: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  lost: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300",
};

type SortField = "callerName" | "clientName" | "createdAt" | "insuranceProvider" | "phoneNumber";
type SortDirection = "asc" | "desc";

export default function StageBoard() {
  const params = useParams<{ stage: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const stage = params.stage as PipelineStage;

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Inquiry>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [targetStage, setTargetStage] = useState<PipelineStage | "">("");

  const { data: allInquiries, isLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
  });

  const inquiries = useMemo(() => {
    if (!allInquiries) return [];
    return allInquiries.filter((inq) => inq.stage === stage);
  }, [allInquiries, stage]);

  const sortedInquiries = useMemo(() => {
    return [...inquiries].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      
      if (sortField === "createdAt") {
        aVal = a[sortField] ? new Date(a[sortField] as string).getTime() : 0;
        bVal = b[sortField] ? new Date(b[sortField] as string).getTime() : 0;
      } else {
        aVal = (a[sortField] || "").toString().toLowerCase();
        bVal = (b[sortField] || "").toString().toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [inquiries, sortField, sortDirection]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Inquiry> }) => {
      const response = await apiRequest("PATCH", `/api/inquiries/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      setEditingId(null);
      setEditValues({});
      toast({ title: "Updated", description: "Inquiry updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update inquiry", variant: "destructive" });
    },
  });

  const bulkStageMutation = useMutation({
    mutationFn: async ({ ids, stage }: { ids: number[]; stage: string }) => {
      const response = await apiRequest("PATCH", "/api/inquiries/bulk-stage", {
        inquiryIds: ids,
        targetStage: stage,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      setSelectedIds(new Set());
      setShowMoveDialog(false);
      setTargetStage("");
      toast({ title: "Moved", description: `${data.count} inquiries moved successfully` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to move inquiries", variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiRequest("DELETE", "/api/inquiries/bulk", { inquiryIds: ids });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      setSelectedIds(new Set());
      setShowDeleteDialog(false);
      toast({ title: "Deleted", description: `${data.count} inquiries deleted` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete inquiries", variant: "destructive" });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedInquiries.map((inq) => inq.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const startEditing = (inquiry: Inquiry) => {
    setEditingId(inquiry.id);
    setEditValues({
      callerName: inquiry.callerName,
      clientName: inquiry.clientName,
      phoneNumber: inquiry.phoneNumber,
      insuranceProvider: inquiry.insuranceProvider,
    });
  };

  const saveEdit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: editValues });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    );
  };

  const StageIcon = stageIcons[stage] || Phone;

  if (!stage || !pipelineStages.includes(stage)) {
    return (
      <div className="min-h-screen bg-background p-4">
        <p className="text-muted-foreground">Invalid stage</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stageColors[stage]}`}>
              <StageIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{stageDisplayNames[stage]}</h1>
              <p className="text-sm text-muted-foreground">
                {inquiries.length} {inquiries.length === 1 ? "inquiry" : "inquiries"}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-muted rounded-md">
            <Badge variant="secondary">{selectedIds.size} selected</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMoveDialog(true)}
              data-testid="button-bulk-move"
            >
              <ArrowRightLeft className="w-4 h-4 mr-1" />
              Move
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              data-testid="button-bulk-delete"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}
      </header>

      <main className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : sortedInquiries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No inquiries in this stage</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/")}
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === sortedInquiries.length && sortedInquiries.length > 0}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("callerName")}
                  >
                    <div className="flex items-center">
                      Caller <SortIcon field="callerName" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("clientName")}
                  >
                    <div className="flex items-center">
                      Client <SortIcon field="clientName" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("phoneNumber")}
                  >
                    <div className="flex items-center">
                      Phone <SortIcon field="phoneNumber" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("insuranceProvider")}
                  >
                    <div className="flex items-center">
                      Insurance <SortIcon field="insuranceProvider" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
                      Created <SortIcon field="createdAt" />
                    </div>
                  </TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInquiries.map((inquiry) => (
                  <TableRow
                    key={inquiry.id}
                    className="cursor-pointer hover-elevate"
                    data-testid={`row-inquiry-${inquiry.id}`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(inquiry.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(inquiry.id, checked as boolean)
                        }
                        data-testid={`checkbox-inquiry-${inquiry.id}`}
                      />
                    </TableCell>
                    <TableCell onClick={() => editingId !== inquiry.id && navigate(`/inquiry/${inquiry.id}`)}>
                      {editingId === inquiry.id ? (
                        <Input
                          value={editValues.callerName || ""}
                          onChange={(e) =>
                            setEditValues({ ...editValues, callerName: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="h-8"
                          data-testid={`input-edit-caller-${inquiry.id}`}
                        />
                      ) : (
                        inquiry.callerName || "-"
                      )}
                    </TableCell>
                    <TableCell onClick={() => editingId !== inquiry.id && navigate(`/inquiry/${inquiry.id}`)}>
                      {editingId === inquiry.id ? (
                        <Input
                          value={editValues.clientName || ""}
                          onChange={(e) =>
                            setEditValues({ ...editValues, clientName: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="h-8"
                          data-testid={`input-edit-client-${inquiry.id}`}
                        />
                      ) : (
                        inquiry.clientName || "-"
                      )}
                    </TableCell>
                    <TableCell onClick={() => editingId !== inquiry.id && navigate(`/inquiry/${inquiry.id}`)}>
                      {editingId === inquiry.id ? (
                        <Input
                          value={editValues.phoneNumber || ""}
                          onChange={(e) =>
                            setEditValues({ ...editValues, phoneNumber: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="h-8"
                          data-testid={`input-edit-phone-${inquiry.id}`}
                        />
                      ) : (
                        inquiry.phoneNumber || "-"
                      )}
                    </TableCell>
                    <TableCell onClick={() => editingId !== inquiry.id && navigate(`/inquiry/${inquiry.id}`)}>
                      {editingId === inquiry.id ? (
                        <Input
                          value={editValues.insuranceProvider || ""}
                          onChange={(e) =>
                            setEditValues({ ...editValues, insuranceProvider: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="h-8"
                          data-testid={`input-edit-insurance-${inquiry.id}`}
                        />
                      ) : (
                        inquiry.insuranceProvider || "-"
                      )}
                    </TableCell>
                    <TableCell onClick={() => navigate(`/inquiry/${inquiry.id}`)}>
                      {inquiry.createdAt
                        ? format(new Date(inquiry.createdAt), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {editingId === inquiry.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={saveEdit}
                            disabled={updateMutation.isPending}
                            data-testid={`button-save-${inquiry.id}`}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cancelEdit}
                            data-testid={`button-cancel-${inquiry.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-actions-${inquiry.id}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/inquiry/${inquiry.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => startEditing(inquiry)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} inquiries?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. These inquiries will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move {selectedIds.size} inquiries</AlertDialogTitle>
            <AlertDialogDescription>
              Select the stage to move the selected inquiries to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={targetStage} onValueChange={(val) => setTargetStage(val as PipelineStage)}>
              <SelectTrigger data-testid="select-target-stage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {pipelineStages
                  .filter((s) => s !== stage)
                  .map((s) => (
                    <SelectItem key={s} value={s}>
                      {stageDisplayNames[s]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                targetStage && bulkStageMutation.mutate({ ids: Array.from(selectedIds), stage: targetStage })
              }
              disabled={!targetStage || bulkStageMutation.isPending}
              data-testid="button-confirm-move"
            >
              {bulkStageMutation.isPending ? "Moving..." : "Move"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
