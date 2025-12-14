import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, Circle, Loader2, FileText, Stethoscope, ClipboardList } from "lucide-react";
import type { PreCertForm, NursingAssessmentForm, PreScreeningForm } from "@shared/schema";

interface FormsStatus {
  preCert: boolean;
  nursing: boolean;
  preScreening: boolean;
}

interface PreAssessmentFormsProps {
  inquiryId: number;
  onAllFormsComplete?: () => void;
}

// Debounce hook for autosave
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function PreAssessmentForms({ inquiryId, onAllFormsComplete }: PreAssessmentFormsProps) {
  const { toast } = useToast();

  // Fetch forms status
  const { data: formsStatus } = useQuery<FormsStatus>({
    queryKey: ["/api/inquiries", inquiryId, "forms-status"],
    queryFn: async () => {
      const res = await fetch(`/api/inquiries/${inquiryId}/forms-status`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch forms status");
      return res.json();
    },
  });

  const allComplete = formsStatus?.preCert && formsStatus?.nursing && formsStatus?.preScreening;

  useEffect(() => {
    if (allComplete && onAllFormsComplete) {
      onAllFormsComplete();
    }
  }, [allComplete, onAllFormsComplete]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={formsStatus?.preCert ? "default" : "secondary"} className="gap-1">
          {formsStatus?.preCert ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
          Pre-Cert
        </Badge>
        <Badge variant={formsStatus?.nursing ? "default" : "secondary"} className="gap-1">
          {formsStatus?.nursing ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
          Nursing
        </Badge>
        <Badge variant={formsStatus?.preScreening ? "default" : "secondary"} className="gap-1">
          {formsStatus?.preScreening ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
          Pre-Screening
        </Badge>
        {allComplete && (
          <Badge variant="outline" className="gap-1 border-green-500 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            All Forms Complete
          </Badge>
        )}
      </div>

      <Tabs defaultValue="precert" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="precert" className="gap-1" data-testid="tab-precert">
            <FileText className="w-4 h-4 hidden sm:block" />
            <span className="truncate">Pre-Cert</span>
          </TabsTrigger>
          <TabsTrigger value="nursing" className="gap-1" data-testid="tab-nursing">
            <Stethoscope className="w-4 h-4 hidden sm:block" />
            <span className="truncate">Nursing</span>
          </TabsTrigger>
          <TabsTrigger value="prescreening" className="gap-1" data-testid="tab-prescreening">
            <ClipboardList className="w-4 h-4 hidden sm:block" />
            <span className="truncate">Pre-Screen</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="precert" className="mt-4">
          <PreCertFormTab inquiryId={inquiryId} />
        </TabsContent>

        <TabsContent value="nursing" className="mt-4">
          <NursingAssessmentFormTab inquiryId={inquiryId} />
        </TabsContent>

        <TabsContent value="prescreening" className="mt-4">
          <PreScreeningFormTab inquiryId={inquiryId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Form 1: RB Pre-Cert / Clinical Pre-Assessment
// ============================================================
interface SubstanceEntry {
  substance: string;
  lastUsed: string;
  firstUsed: string;
  frequency: string;
  amount: string;
  route: string;
  method: string;
}

const defaultSubstanceEntry: SubstanceEntry = {
  substance: "",
  lastUsed: "",
  firstUsed: "",
  frequency: "",
  amount: "",
  route: "",
  method: "",
};

const withdrawalSymptoms = [
  "Tremors",
  "Sweating",
  "Nausea/Vomiting",
  "Anxiety",
  "Insomnia",
  "Agitation",
  "Hallucinations",
  "Seizure History",
  "Elevated HR",
  "Elevated BP",
];

function PreCertFormTab({ inquiryId }: { inquiryId: number }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({
    substanceHistory: [{ ...defaultSubstanceEntry }],
    treatmentHistory: "",
    severityOfIllness: "",
    withdrawalSymptoms: [] as string[],
    withdrawalNotes: "",
    psychosocialNotes: "",
    medicalConditions: "",
    medications: "",
    allergies: "",
    mentalHealthHistory: "",
    suicidalIdeation: "",
    homicidalIdeation: "",
    legalIssues: "",
    familyHistory: "",
    additionalNotes: "",
  });
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasUserEdited = useRef(false);

  const { data: existingForm, isLoading } = useQuery<PreCertForm>({
    queryKey: ["/api/inquiries", inquiryId, "pre-cert-form"],
    queryFn: async () => {
      const res = await fetch(`/api/inquiries/${inquiryId}/pre-cert-form`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch form");
      return res.json();
    },
  });

  useEffect(() => {
    if (existingForm?.formData) {
      setFormData(existingForm.formData as Record<string, any>);
      setIsComplete(existingForm.isComplete === "yes");
    }
  }, [existingForm]);

  const debouncedFormData = useDebounce(formData, 1000);

  const saveMutation = useMutation({
    mutationFn: async (data: { formData: Record<string, any>; isComplete: string }) => {
      const res = await apiRequest("PUT", `/api/inquiries/${inquiryId}/pre-cert-form`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries", inquiryId, "forms-status"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save form", variant: "destructive" });
    },
  });

  // Autosave effect - only save after user has made edits
  useEffect(() => {
    if (!isLoading && existingForm !== undefined && hasUserEdited.current) {
      setIsSaving(true);
      saveMutation.mutate(
        { formData: debouncedFormData, isComplete: isComplete ? "yes" : "no" },
        { onSettled: () => setIsSaving(false) }
      );
    }
  }, [debouncedFormData]);

  const updateField = (field: string, value: any) => {
    hasUserEdited.current = true;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSubstance = (index: number, field: keyof SubstanceEntry, value: string) => {
    hasUserEdited.current = true;
    setFormData((prev) => {
      const substances = [...(prev.substanceHistory || [])];
      substances[index] = { ...substances[index], [field]: value };
      return { ...prev, substanceHistory: substances };
    });
  };

  const addSubstance = () => {
    hasUserEdited.current = true;
    setFormData((prev) => ({
      ...prev,
      substanceHistory: [...(prev.substanceHistory || []), { ...defaultSubstanceEntry }],
    }));
  };

  const toggleWithdrawal = (symptom: string) => {
    hasUserEdited.current = true;
    setFormData((prev) => {
      const symptoms = prev.withdrawalSymptoms || [];
      if (symptoms.includes(symptom)) {
        return { ...prev, withdrawalSymptoms: symptoms.filter((s: string) => s !== symptom) };
      }
      return { ...prev, withdrawalSymptoms: [...symptoms, symptom] };
    });
  };

  const handleMarkComplete = () => {
    const newComplete = !isComplete;
    setIsComplete(newComplete);
    saveMutation.mutate(
      { formData, isComplete: newComplete ? "yes" : "no" },
      {
        onSuccess: () => {
          toast({
            title: newComplete ? "Form marked complete" : "Form marked incomplete",
            description: newComplete ? "Pre-Cert form has been completed" : "Form status updated",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-lg">RB Pre-Cert / Clinical Pre-Assessment</CardTitle>
            <CardDescription>Substance use history, treatment history, and clinical assessment</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
            <Button
              variant={isComplete ? "default" : "outline"}
              size="sm"
              onClick={handleMarkComplete}
              data-testid="button-complete-precert"
            >
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Complete
                </>
              ) : (
                "Mark Complete"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Substance Use History Table */}
        <div>
          <Label className="text-base font-semibold">Substance Use History</Label>
          <div className="mt-2 space-y-3">
            {(formData.substanceHistory || []).map((entry: SubstanceEntry, index: number) => (
              <div key={index} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border rounded-md">
                <Input
                  placeholder="Substance"
                  value={entry.substance}
                  onChange={(e) => updateSubstance(index, "substance", e.target.value)}
                  data-testid={`input-substance-${index}`}
                />
                <Input
                  placeholder="Last Used"
                  value={entry.lastUsed}
                  onChange={(e) => updateSubstance(index, "lastUsed", e.target.value)}
                  data-testid={`input-lastused-${index}`}
                />
                <Input
                  placeholder="First Used"
                  value={entry.firstUsed}
                  onChange={(e) => updateSubstance(index, "firstUsed", e.target.value)}
                  data-testid={`input-firstused-${index}`}
                />
                <Input
                  placeholder="Frequency"
                  value={entry.frequency}
                  onChange={(e) => updateSubstance(index, "frequency", e.target.value)}
                  data-testid={`input-frequency-${index}`}
                />
                <Input
                  placeholder="Amount"
                  value={entry.amount}
                  onChange={(e) => updateSubstance(index, "amount", e.target.value)}
                  data-testid={`input-amount-${index}`}
                />
                <Input
                  placeholder="Route"
                  value={entry.route}
                  onChange={(e) => updateSubstance(index, "route", e.target.value)}
                  data-testid={`input-route-${index}`}
                />
                <Input
                  placeholder="Method"
                  value={entry.method}
                  onChange={(e) => updateSubstance(index, "method", e.target.value)}
                  className="col-span-2"
                  data-testid={`input-method-${index}`}
                />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addSubstance} data-testid="button-add-substance">
              Add Substance
            </Button>
          </div>
        </div>

        <Separator />

        {/* Treatment History */}
        <div>
          <Label className="text-base font-semibold">Treatment History</Label>
          <Textarea
            className="mt-2"
            placeholder="Previous treatment episodes, dates, facilities, outcomes..."
            value={formData.treatmentHistory || ""}
            onChange={(e) => updateField("treatmentHistory", e.target.value)}
            data-testid="input-treatment-history"
          />
        </div>

        {/* Severity of Illness */}
        <div>
          <Label className="text-base font-semibold">Severity of Illness</Label>
          <Select
            value={formData.severityOfIllness || ""}
            onValueChange={(v) => updateField("severityOfIllness", v)}
          >
            <SelectTrigger className="mt-2" data-testid="select-severity">
              <SelectValue placeholder="Select severity..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mild">Mild</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="severe">Severe</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Withdrawal Symptoms */}
        <div>
          <Label className="text-base font-semibold">Withdrawal Symptoms</Label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {withdrawalSymptoms.map((symptom) => (
              <div key={symptom} className="flex items-center gap-2">
                <Checkbox
                  id={`withdrawal-${symptom}`}
                  checked={(formData.withdrawalSymptoms || []).includes(symptom)}
                  onCheckedChange={() => toggleWithdrawal(symptom)}
                  data-testid={`checkbox-withdrawal-${symptom.toLowerCase().replace(/\//g, "-")}`}
                />
                <Label htmlFor={`withdrawal-${symptom}`} className="text-sm font-normal cursor-pointer">
                  {symptom}
                </Label>
              </div>
            ))}
          </div>
          <Textarea
            className="mt-3"
            placeholder="Additional withdrawal notes..."
            value={formData.withdrawalNotes || ""}
            onChange={(e) => updateField("withdrawalNotes", e.target.value)}
            data-testid="input-withdrawal-notes"
          />
        </div>

        <Separator />

        {/* Psychosocial */}
        <div>
          <Label className="text-base font-semibold">Psychosocial Information</Label>
          <Textarea
            className="mt-2"
            placeholder="Living situation, employment, support system, stressors..."
            value={formData.psychosocialNotes || ""}
            onChange={(e) => updateField("psychosocialNotes", e.target.value)}
            data-testid="input-psychosocial"
          />
        </div>

        {/* Medical Section */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Medical Conditions</Label>
            <Textarea
              className="mt-1"
              placeholder="Current medical conditions..."
              value={formData.medicalConditions || ""}
              onChange={(e) => updateField("medicalConditions", e.target.value)}
              data-testid="input-medical-conditions"
            />
          </div>
          <div>
            <Label>Current Medications</Label>
            <Textarea
              className="mt-1"
              placeholder="List current medications..."
              value={formData.medications || ""}
              onChange={(e) => updateField("medications", e.target.value)}
              data-testid="input-medications"
            />
          </div>
          <div>
            <Label>Allergies</Label>
            <Input
              className="mt-1"
              placeholder="Known allergies..."
              value={formData.allergies || ""}
              onChange={(e) => updateField("allergies", e.target.value)}
              data-testid="input-allergies"
            />
          </div>
          <div>
            <Label>Mental Health History</Label>
            <Textarea
              className="mt-1"
              placeholder="Prior diagnoses, hospitalizations..."
              value={formData.mentalHealthHistory || ""}
              onChange={(e) => updateField("mentalHealthHistory", e.target.value)}
              data-testid="input-mh-history"
            />
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Suicidal Ideation</Label>
            <Select
              value={formData.suicidalIdeation || ""}
              onValueChange={(v) => updateField("suicidalIdeation", v)}
            >
              <SelectTrigger className="mt-1" data-testid="select-si">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="passive">Passive</SelectItem>
                <SelectItem value="active_no_plan">Active - No Plan</SelectItem>
                <SelectItem value="active_with_plan">Active - With Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Homicidal Ideation</Label>
            <Select
              value={formData.homicidalIdeation || ""}
              onValueChange={(v) => updateField("homicidalIdeation", v)}
            >
              <SelectTrigger className="mt-1" data-testid="select-hi">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="passive">Passive</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Legal Issues */}
        <div>
          <Label>Legal Issues</Label>
          <Textarea
            className="mt-1"
            placeholder="Pending charges, probation, court dates..."
            value={formData.legalIssues || ""}
            onChange={(e) => updateField("legalIssues", e.target.value)}
            data-testid="input-legal-issues"
          />
        </div>

        {/* Family History */}
        <div>
          <Label>Family History</Label>
          <Textarea
            className="mt-1"
            placeholder="Family history of substance use, mental health..."
            value={formData.familyHistory || ""}
            onChange={(e) => updateField("familyHistory", e.target.value)}
            data-testid="input-family-history"
          />
        </div>

        {/* Additional Notes */}
        <div>
          <Label>Additional Notes</Label>
          <Textarea
            className="mt-1"
            placeholder="Any other relevant information..."
            value={formData.additionalNotes || ""}
            onChange={(e) => updateField("additionalNotes", e.target.value)}
            data-testid="input-additional-notes"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Form 2: Nursing Admission Assessment
// ============================================================
const reviewOfSystemsItems = [
  "HEENT Normal",
  "Cardiovascular Normal",
  "Respiratory Normal",
  "Gastrointestinal Normal",
  "Genitourinary Normal",
  "Musculoskeletal Normal",
  "Neurological Normal",
  "Skin/Integumentary Normal",
  "Psychiatric Normal",
  "Endocrine Normal",
];

function NursingAssessmentFormTab({ inquiryId }: { inquiryId: number }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({
    bloodPressure: "",
    pulse: "",
    temperature: "",
    respirations: "",
    oxygenSaturation: "",
    weight: "",
    height: "",
    allergies: "",
    reviewOfSystems: [] as string[],
    rosNotes: "",
    painLevel: "",
    painLocation: "",
    suicideRiskLevel: "",
    suicideRiskNotes: "",
    nutritionalScreen: "",
    dietaryRestrictions: "",
    generalAppearance: "",
    orientationLevel: "",
    nursingNotes: "",
  });
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasUserEdited = useRef(false);

  const { data: existingForm, isLoading } = useQuery<NursingAssessmentForm>({
    queryKey: ["/api/inquiries", inquiryId, "nursing-assessment"],
    queryFn: async () => {
      const res = await fetch(`/api/inquiries/${inquiryId}/nursing-assessment`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch form");
      return res.json();
    },
  });

  useEffect(() => {
    if (existingForm?.formData) {
      setFormData(existingForm.formData as Record<string, any>);
      setIsComplete(existingForm.isComplete === "yes");
    }
  }, [existingForm]);

  const debouncedFormData = useDebounce(formData, 1000);

  const saveMutation = useMutation({
    mutationFn: async (data: { formData: Record<string, any>; isComplete: string }) => {
      const res = await apiRequest("PUT", `/api/inquiries/${inquiryId}/nursing-assessment`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries", inquiryId, "forms-status"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save form", variant: "destructive" });
    },
  });

  // Autosave effect - only save after user has made edits
  useEffect(() => {
    if (!isLoading && existingForm !== undefined && hasUserEdited.current) {
      setIsSaving(true);
      saveMutation.mutate(
        { formData: debouncedFormData, isComplete: isComplete ? "yes" : "no" },
        { onSettled: () => setIsSaving(false) }
      );
    }
  }, [debouncedFormData]);

  const updateField = (field: string, value: any) => {
    hasUserEdited.current = true;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleROS = (item: string) => {
    hasUserEdited.current = true;
    setFormData((prev) => {
      const ros = prev.reviewOfSystems || [];
      if (ros.includes(item)) {
        return { ...prev, reviewOfSystems: ros.filter((s: string) => s !== item) };
      }
      return { ...prev, reviewOfSystems: [...ros, item] };
    });
  };

  const handleMarkComplete = () => {
    const newComplete = !isComplete;
    setIsComplete(newComplete);
    saveMutation.mutate(
      { formData, isComplete: newComplete ? "yes" : "no" },
      {
        onSuccess: () => {
          toast({
            title: newComplete ? "Form marked complete" : "Form marked incomplete",
            description: newComplete ? "Nursing assessment has been completed" : "Form status updated",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-lg">Nursing Admission Assessment</CardTitle>
            <CardDescription>Vitals, review of systems, and nursing evaluation</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
            <Button
              variant={isComplete ? "default" : "outline"}
              size="sm"
              onClick={handleMarkComplete}
              data-testid="button-complete-nursing"
            >
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Complete
                </>
              ) : (
                "Mark Complete"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vital Signs */}
        <div>
          <Label className="text-base font-semibold">Vital Signs</Label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Blood Pressure</Label>
              <Input
                placeholder="120/80"
                value={formData.bloodPressure || ""}
                onChange={(e) => updateField("bloodPressure", e.target.value)}
                data-testid="input-bp"
              />
            </div>
            <div>
              <Label className="text-xs">Pulse</Label>
              <Input
                placeholder="72 bpm"
                value={formData.pulse || ""}
                onChange={(e) => updateField("pulse", e.target.value)}
                data-testid="input-pulse"
              />
            </div>
            <div>
              <Label className="text-xs">Temperature</Label>
              <Input
                placeholder="98.6°F"
                value={formData.temperature || ""}
                onChange={(e) => updateField("temperature", e.target.value)}
                data-testid="input-temp"
              />
            </div>
            <div>
              <Label className="text-xs">Respirations</Label>
              <Input
                placeholder="16/min"
                value={formData.respirations || ""}
                onChange={(e) => updateField("respirations", e.target.value)}
                data-testid="input-resp"
              />
            </div>
            <div>
              <Label className="text-xs">O2 Saturation</Label>
              <Input
                placeholder="98%"
                value={formData.oxygenSaturation || ""}
                onChange={(e) => updateField("oxygenSaturation", e.target.value)}
                data-testid="input-o2"
              />
            </div>
            <div>
              <Label className="text-xs">Weight</Label>
              <Input
                placeholder="165 lbs"
                value={formData.weight || ""}
                onChange={(e) => updateField("weight", e.target.value)}
                data-testid="input-weight"
              />
            </div>
            <div>
              <Label className="text-xs">Height</Label>
              <Input
                placeholder="5ft 10in"
                value={formData.height || ""}
                onChange={(e) => updateField("height", e.target.value)}
                data-testid="input-height"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Allergies */}
        <div>
          <Label className="text-base font-semibold">Allergies</Label>
          <Textarea
            className="mt-2"
            placeholder="List all known allergies and reactions..."
            value={formData.allergies || ""}
            onChange={(e) => updateField("allergies", e.target.value)}
            data-testid="input-nursing-allergies"
          />
        </div>

        <Separator />

        {/* Review of Systems */}
        <div>
          <Label className="text-base font-semibold">Review of Systems</Label>
          <p className="text-xs text-muted-foreground mt-1">Check systems that are within normal limits</p>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {reviewOfSystemsItems.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Checkbox
                  id={`ros-${item}`}
                  checked={(formData.reviewOfSystems || []).includes(item)}
                  onCheckedChange={() => toggleROS(item)}
                  data-testid={`checkbox-ros-${item.toLowerCase().replace(/\//g, "-").replace(/ /g, "-")}`}
                />
                <Label htmlFor={`ros-${item}`} className="text-sm font-normal cursor-pointer">
                  {item}
                </Label>
              </div>
            ))}
          </div>
          <Textarea
            className="mt-3"
            placeholder="Notes on any abnormal findings..."
            value={formData.rosNotes || ""}
            onChange={(e) => updateField("rosNotes", e.target.value)}
            data-testid="input-ros-notes"
          />
        </div>

        <Separator />

        {/* Pain Screen */}
        <div>
          <Label className="text-base font-semibold">Pain Screen</Label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Pain Level (0-10)</Label>
              <Select
                value={formData.painLevel || ""}
                onValueChange={(v) => updateField("painLevel", v)}
              >
                <SelectTrigger data-testid="select-pain-level">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Pain Location</Label>
              <Input
                placeholder="Location..."
                value={formData.painLocation || ""}
                onChange={(e) => updateField("painLocation", e.target.value)}
                data-testid="input-pain-location"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Suicide Risk */}
        <div>
          <Label className="text-base font-semibold">Suicide Risk Questionnaire</Label>
          <div className="mt-2">
            <Label className="text-xs">Risk Level</Label>
            <Select
              value={formData.suicideRiskLevel || ""}
              onValueChange={(v) => updateField("suicideRiskLevel", v)}
            >
              <SelectTrigger data-testid="select-suicide-risk">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="moderate">Moderate Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            className="mt-2"
            placeholder="Risk assessment notes, safety plan..."
            value={formData.suicideRiskNotes || ""}
            onChange={(e) => updateField("suicideRiskNotes", e.target.value)}
            data-testid="input-suicide-risk-notes"
          />
        </div>

        <Separator />

        {/* Nutritional Screen */}
        <div>
          <Label className="text-base font-semibold">Nutritional Screen</Label>
          <Textarea
            className="mt-2"
            placeholder="Nutritional status, eating patterns, concerns..."
            value={formData.nutritionalScreen || ""}
            onChange={(e) => updateField("nutritionalScreen", e.target.value)}
            data-testid="input-nutritional-screen"
          />
          <Input
            className="mt-2"
            placeholder="Dietary restrictions..."
            value={formData.dietaryRestrictions || ""}
            onChange={(e) => updateField("dietaryRestrictions", e.target.value)}
            data-testid="input-dietary-restrictions"
          />
        </div>

        <Separator />

        {/* General Assessment */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>General Appearance</Label>
            <Textarea
              className="mt-1"
              placeholder="Hygiene, grooming, affect..."
              value={formData.generalAppearance || ""}
              onChange={(e) => updateField("generalAppearance", e.target.value)}
              data-testid="input-general-appearance"
            />
          </div>
          <div>
            <Label>Orientation Level</Label>
            <Select
              value={formData.orientationLevel || ""}
              onValueChange={(v) => updateField("orientationLevel", v)}
            >
              <SelectTrigger className="mt-1" data-testid="select-orientation">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oriented_x4">Oriented x4</SelectItem>
                <SelectItem value="oriented_x3">Oriented x3</SelectItem>
                <SelectItem value="oriented_x2">Oriented x2</SelectItem>
                <SelectItem value="oriented_x1">Oriented x1</SelectItem>
                <SelectItem value="disoriented">Disoriented</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Nursing Notes */}
        <div>
          <Label>Nursing Notes</Label>
          <Textarea
            className="mt-1"
            placeholder="Additional nursing observations and notes..."
            value={formData.nursingNotes || ""}
            onChange={(e) => updateField("nursingNotes", e.target.value)}
            data-testid="input-nursing-notes"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Form 3: Pre-Screening Form
// ============================================================
const referralSources = [
  "Self",
  "Family/Friend",
  "Physician",
  "Hospital",
  "Insurance",
  "Court/Legal",
  "Other Treatment Center",
  "EAP",
  "Online Search",
  "Other",
];

const levelsOfCareOptions = [
  "Detox",
  "Residential",
  "PHP",
  "IOP",
  "Outpatient",
  "MAT",
  "Sober Living",
];

function PreScreeningFormTab({ inquiryId }: { inquiryId: number }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({
    referralSource: [] as string[],
    referralOther: "",
    levelOfCareInterest: [] as string[],
    hasLegalIssues: "",
    legalDetails: "",
    hasPendingCharges: "",
    isProbationParole: "",
    hasRegisteredOffenses: "",
    mentalHealthDiagnoses: "",
    psychiatricHospitalizations: "",
    currentMedications: "",
    substanceUseHistory: "",
    primarySubstance: "",
    lastUseDate: "",
    previousTreatment: "",
    motivationLevel: "",
    barriers: "",
    programRecommendation: "",
    recommendationNotes: "",
    screeningNotes: "",
  });
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasUserEdited = useRef(false);

  const { data: existingForm, isLoading } = useQuery<PreScreeningForm>({
    queryKey: ["/api/inquiries", inquiryId, "pre-screening"],
    queryFn: async () => {
      const res = await fetch(`/api/inquiries/${inquiryId}/pre-screening`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch form");
      return res.json();
    },
  });

  useEffect(() => {
    if (existingForm?.formData) {
      setFormData(existingForm.formData as Record<string, any>);
      setIsComplete(existingForm.isComplete === "yes");
    }
  }, [existingForm]);

  const debouncedFormData = useDebounce(formData, 1000);

  const saveMutation = useMutation({
    mutationFn: async (data: { formData: Record<string, any>; isComplete: string }) => {
      const res = await apiRequest("PUT", `/api/inquiries/${inquiryId}/pre-screening`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries", inquiryId, "forms-status"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save form", variant: "destructive" });
    },
  });

  // Autosave effect - only save after user has made edits
  useEffect(() => {
    if (!isLoading && existingForm !== undefined && hasUserEdited.current) {
      setIsSaving(true);
      saveMutation.mutate(
        { formData: debouncedFormData, isComplete: isComplete ? "yes" : "no" },
        { onSettled: () => setIsSaving(false) }
      );
    }
  }, [debouncedFormData]);

  const updateField = (field: string, value: any) => {
    hasUserEdited.current = true;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, item: string) => {
    hasUserEdited.current = true;
    setFormData((prev) => {
      const arr = prev[field] || [];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter((s: string) => s !== item) };
      }
      return { ...prev, [field]: [...arr, item] };
    });
  };

  const handleMarkComplete = () => {
    const newComplete = !isComplete;
    setIsComplete(newComplete);
    saveMutation.mutate(
      { formData, isComplete: newComplete ? "yes" : "no" },
      {
        onSuccess: () => {
          toast({
            title: newComplete ? "Form marked complete" : "Form marked incomplete",
            description: newComplete ? "Pre-screening form has been completed" : "Form status updated",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-lg">Pre-Screening Form</CardTitle>
            <CardDescription>Referral information, legal status, and program recommendation</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
            <Button
              variant={isComplete ? "default" : "outline"}
              size="sm"
              onClick={handleMarkComplete}
              data-testid="button-complete-prescreening"
            >
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Complete
                </>
              ) : (
                "Mark Complete"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Source */}
        <div>
          <Label className="text-base font-semibold">Referral Source</Label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {referralSources.map((source) => (
              <div key={source} className="flex items-center gap-2">
                <Checkbox
                  id={`ref-${source}`}
                  checked={(formData.referralSource || []).includes(source)}
                  onCheckedChange={() => toggleArrayItem("referralSource", source)}
                  data-testid={`checkbox-ref-${source.toLowerCase().replace(/\//g, "-").replace(/ /g, "-")}`}
                />
                <Label htmlFor={`ref-${source}`} className="text-sm font-normal cursor-pointer">
                  {source}
                </Label>
              </div>
            ))}
          </div>
          {(formData.referralSource || []).includes("Other") && (
            <Input
              className="mt-2"
              placeholder="Specify other referral source..."
              value={formData.referralOther || ""}
              onChange={(e) => updateField("referralOther", e.target.value)}
              data-testid="input-referral-other"
            />
          )}
        </div>

        <Separator />

        {/* Level of Care Interest */}
        <div>
          <Label className="text-base font-semibold">Level of Care Interest</Label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {levelsOfCareOptions.map((loc) => (
              <div key={loc} className="flex items-center gap-2">
                <Checkbox
                  id={`loc-${loc}`}
                  checked={(formData.levelOfCareInterest || []).includes(loc)}
                  onCheckedChange={() => toggleArrayItem("levelOfCareInterest", loc)}
                  data-testid={`checkbox-loc-${loc.toLowerCase().replace(/ /g, "-")}`}
                />
                <Label htmlFor={`loc-${loc}`} className="text-sm font-normal cursor-pointer">
                  {loc}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Legal Questions */}
        <div>
          <Label className="text-base font-semibold">Legal Status</Label>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Any Legal Issues?</Label>
              <Select
                value={formData.hasLegalIssues || ""}
                onValueChange={(v) => updateField("hasLegalIssues", v)}
              >
                <SelectTrigger data-testid="select-legal-issues">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Pending Charges?</Label>
              <Select
                value={formData.hasPendingCharges || ""}
                onValueChange={(v) => updateField("hasPendingCharges", v)}
              >
                <SelectTrigger data-testid="select-pending-charges">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">On Probation/Parole?</Label>
              <Select
                value={formData.isProbationParole || ""}
                onValueChange={(v) => updateField("isProbationParole", v)}
              >
                <SelectTrigger data-testid="select-probation">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Registered Offenses?</Label>
              <Select
                value={formData.hasRegisteredOffenses || ""}
                onValueChange={(v) => updateField("hasRegisteredOffenses", v)}
              >
                <SelectTrigger data-testid="select-registered-offenses">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {formData.hasLegalIssues === "yes" && (
            <Textarea
              className="mt-2"
              placeholder="Legal issue details..."
              value={formData.legalDetails || ""}
              onChange={(e) => updateField("legalDetails", e.target.value)}
              data-testid="input-legal-details"
            />
          )}
        </div>

        <Separator />

        {/* Mental Health */}
        <div>
          <Label className="text-base font-semibold">Mental Health History</Label>
          <div className="mt-2 grid gap-3">
            <div>
              <Label className="text-xs">Mental Health Diagnoses</Label>
              <Textarea
                placeholder="Current or past diagnoses..."
                value={formData.mentalHealthDiagnoses || ""}
                onChange={(e) => updateField("mentalHealthDiagnoses", e.target.value)}
                data-testid="input-mh-diagnoses"
              />
            </div>
            <div>
              <Label className="text-xs">Psychiatric Hospitalizations</Label>
              <Textarea
                placeholder="Dates, facilities, reasons..."
                value={formData.psychiatricHospitalizations || ""}
                onChange={(e) => updateField("psychiatricHospitalizations", e.target.value)}
                data-testid="input-psych-hosp"
              />
            </div>
            <div>
              <Label className="text-xs">Current Psychiatric Medications</Label>
              <Textarea
                placeholder="List medications..."
                value={formData.currentMedications || ""}
                onChange={(e) => updateField("currentMedications", e.target.value)}
                data-testid="input-psych-meds"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Substance Use */}
        <div>
          <Label className="text-base font-semibold">Substance Use Summary</Label>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Primary Substance</Label>
              <Input
                placeholder="Primary substance..."
                value={formData.primarySubstance || ""}
                onChange={(e) => updateField("primarySubstance", e.target.value)}
                data-testid="input-primary-substance"
              />
            </div>
            <div>
              <Label className="text-xs">Last Use Date</Label>
              <Input
                type="date"
                value={formData.lastUseDate || ""}
                onChange={(e) => updateField("lastUseDate", e.target.value)}
                data-testid="input-last-use-date"
              />
            </div>
          </div>
          <Textarea
            className="mt-2"
            placeholder="Brief substance use history..."
            value={formData.substanceUseHistory || ""}
            onChange={(e) => updateField("substanceUseHistory", e.target.value)}
            data-testid="input-substance-history"
          />
          <Textarea
            className="mt-2"
            placeholder="Previous treatment attempts..."
            value={formData.previousTreatment || ""}
            onChange={(e) => updateField("previousTreatment", e.target.value)}
            data-testid="input-previous-treatment"
          />
        </div>

        <Separator />

        {/* Motivation & Barriers */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Motivation Level</Label>
            <Select
              value={formData.motivationLevel || ""}
              onValueChange={(v) => updateField("motivationLevel", v)}
            >
              <SelectTrigger className="mt-1" data-testid="select-motivation">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="ambivalent">Ambivalent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Barriers to Treatment</Label>
            <Textarea
              className="mt-1"
              placeholder="Financial, transportation, childcare..."
              value={formData.barriers || ""}
              onChange={(e) => updateField("barriers", e.target.value)}
              data-testid="input-barriers"
            />
          </div>
        </div>

        <Separator />

        {/* Program Recommendation */}
        <div>
          <Label className="text-base font-semibold">Program Recommendation</Label>
          <div className="mt-2">
            <Select
              value={formData.programRecommendation || ""}
              onValueChange={(v) => updateField("programRecommendation", v)}
            >
              <SelectTrigger data-testid="select-program-rec">
                <SelectValue placeholder="Select recommended program..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="detox">Detox</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="php">PHP</SelectItem>
                <SelectItem value="iop">IOP</SelectItem>
                <SelectItem value="outpatient">Outpatient</SelectItem>
                <SelectItem value="mat">MAT</SelectItem>
                <SelectItem value="sober_living">Sober Living</SelectItem>
                <SelectItem value="not_appropriate">Not Appropriate for Program</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            className="mt-2"
            placeholder="Recommendation notes and rationale..."
            value={formData.recommendationNotes || ""}
            onChange={(e) => updateField("recommendationNotes", e.target.value)}
            data-testid="input-recommendation-notes"
          />
        </div>

        {/* Additional Notes */}
        <div>
          <Label>Screening Notes</Label>
          <Textarea
            className="mt-1"
            placeholder="Any additional screening notes..."
            value={formData.screeningNotes || ""}
            onChange={(e) => updateField("screeningNotes", e.target.value)}
            data-testid="input-screening-notes"
          />
        </div>
      </CardContent>
    </Card>
  );
}
