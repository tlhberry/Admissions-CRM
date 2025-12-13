import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Building2,
  Plus,
  Phone,
  Mail,
  Globe,
  MapPin,
  User,
  Users,
  Calendar,
  Trash2,
  Edit,
  ClipboardList,
} from "lucide-react";
import {
  accountTypeDisplayNames,
  activityTypeDisplayNames,
  type ReferralAccount,
  type ReferralContact,
  type ActivityLog,
  type User as UserType,
  type AccountType,
  type ActivityType,
} from "@shared/schema";
import { format } from "date-fns";

export default function ReferralAccounts() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ReferralAccount | null>(null);

  const { data: accounts, isLoading } = useQuery<ReferralAccount[]>({
    queryKey: ["/api/referral-accounts"],
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: Partial<ReferralAccount>) => {
      const response = await apiRequest("POST", "/api/referral-accounts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-accounts"] });
      setShowAddAccount(false);
      toast({ title: "Account Created", description: "New referral account added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create account", variant: "destructive" });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ReferralAccount> }) => {
      const response = await apiRequest("PATCH", `/api/referral-accounts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-accounts"] });
      setEditingAccount(null);
      toast({ title: "Account Updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update account", variant: "destructive" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/referral-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-accounts"] });
      toast({ title: "Account Deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete account", variant: "destructive" });
    },
  });

  const getUserName = (userId: string | null): string => {
    if (!userId || !users) return "Unassigned";
    const user = users.find((u) => u.id === userId);
    if (!user) return "Unassigned";
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return name || user.email || "Unassigned";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between gap-2 p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold">Referral Accounts</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-account">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Referral Account</DialogTitle>
                </DialogHeader>
                <AccountForm
                  users={users || []}
                  onSubmit={(data) => createAccountMutation.mutate(data)}
                  isPending={createAccountMutation.isPending}
                />
              </DialogContent>
            </Dialog>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : accounts?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No referral accounts yet</p>
              <p className="text-sm">Add your first account to start tracking referral sources</p>
            </CardContent>
          </Card>
        ) : (
          accounts?.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              users={users || []}
              getUserName={getUserName}
              onEdit={() => setEditingAccount(account)}
              onDelete={() => {
                if (confirm("Delete this account and all its contacts and activities?")) {
                  deleteAccountMutation.mutate(account.id);
                }
              }}
            />
          ))
        )}
      </main>

      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          {editingAccount && (
            <AccountForm
              account={editingAccount}
              users={users || []}
              onSubmit={(data) => updateAccountMutation.mutate({ id: editingAccount.id, data })}
              isPending={updateAccountMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountForm({
  account,
  users,
  onSubmit,
  isPending,
}: {
  account?: ReferralAccount;
  users: UserType[];
  onSubmit: (data: Partial<ReferralAccount>) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    name: account?.name || "",
    type: account?.type || "",
    address: account?.address || "",
    phone: account?.phone || "",
    website: account?.website || "",
    notes: account?.notes || "",
    assignedBdRepId: account?.assignedBdRepId || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      assignedBdRepId: formData.assignedBdRepId || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Account Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          data-testid="input-account-name"
        />
      </div>
      <div>
        <Label>Type</Label>
        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
          <SelectTrigger data-testid="select-account-type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(accountTypeDisplayNames).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Assigned BD Rep</Label>
        <Select value={formData.assignedBdRepId} onValueChange={(v) => setFormData({ ...formData, assignedBdRepId: v })}>
          <SelectTrigger data-testid="select-bd-rep">
            <SelectValue placeholder="Select rep" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Phone</Label>
        <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} data-testid="input-account-phone" />
      </div>
      <div>
        <Label>Address</Label>
        <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} data-testid="input-account-address" />
      </div>
      <div>
        <Label>Website</Label>
        <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} data-testid="input-account-website" />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} data-testid="input-account-notes" />
      </div>
      <Button type="submit" disabled={isPending || !formData.name} className="w-full" data-testid="button-submit-account">
        {isPending ? "Saving..." : account ? "Update Account" : "Create Account"}
      </Button>
    </form>
  );
}

function AccountCard({
  account,
  users,
  getUserName,
  onEdit,
  onDelete,
}: {
  account: ReferralAccount;
  users: UserType[];
  getUserName: (id: string | null) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { toast } = useToast();
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);

  const { data: contacts } = useQuery<ReferralContact[]>({
    queryKey: ["/api/referral-accounts", account.id, "contacts"],
    queryFn: async () => {
      const res = await fetch(`/api/referral-accounts/${account.id}/contacts`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: activities } = useQuery<ActivityLog[]>({
    queryKey: ["/api/referral-accounts", account.id, "activities"],
    queryFn: async () => {
      const res = await fetch(`/api/referral-accounts/${account.id}/activities`, { credentials: "include" });
      return res.json();
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: Partial<ReferralContact>) => {
      const response = await apiRequest("POST", `/api/referral-accounts/${account.id}/contacts`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-accounts", account.id, "contacts"] });
      setShowAddContact(false);
      toast({ title: "Contact Added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add contact", variant: "destructive" });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/referral-contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-accounts", account.id, "contacts"] });
      toast({ title: "Contact Deleted" });
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: Partial<ActivityLog>) => {
      const response = await apiRequest("POST", `/api/referral-accounts/${account.id}/activities`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral-accounts", account.id, "activities"] });
      setShowAddActivity(false);
      toast({ title: "Activity Logged" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to log activity", variant: "destructive" });
    },
  });

  return (
    <Card data-testid={`card-account-${account.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg">{account.name}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {account.type && (
              <Badge variant="secondary" className="text-xs">
                {accountTypeDisplayNames[account.type as AccountType] || account.type}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              <User className="w-3 h-3 inline mr-1" />
              {getUserName(account.assignedBdRepId)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} data-testid={`button-edit-${account.id}`}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} data-testid={`button-delete-${account.id}`}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {account.phone && (
            <span><Phone className="w-3 h-3 inline mr-1" />{account.phone}</span>
          )}
          {account.address && (
            <span><MapPin className="w-3 h-3 inline mr-1" />{account.address}</span>
          )}
          {account.website && (
            <a href={account.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              <Globe className="w-3 h-3 inline mr-1" />{account.website}
            </a>
          )}
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="contacts">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Contacts ({contacts?.length || 0})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {contacts?.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div>
                      <p className="font-medium text-sm">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.position}</p>
                      {contact.phone && <p className="text-xs"><Phone className="w-3 h-3 inline mr-1" />{contact.phone}</p>}
                      {contact.email && <p className="text-xs"><Mail className="w-3 h-3 inline mr-1" />{contact.email}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteContactMutation.mutate(contact.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full" data-testid={`button-add-contact-${account.id}`}>
                      <Plus className="w-3 h-3 mr-1" />Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
                    <ContactForm onSubmit={(data) => createContactMutation.mutate(data)} isPending={createContactMutation.isPending} />
                  </DialogContent>
                </Dialog>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="activities">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Activities ({activities?.length || 0})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {activities?.map((activity) => (
                  <div key={activity.id} className="p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {activityTypeDisplayNames[activity.activityType as ActivityType] || activity.activityType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {format(new Date(activity.activityDate), "MMM d, yyyy")}
                      </span>
                    </div>
                    {activity.notes && <p className="text-sm mt-1">{activity.notes}</p>}
                  </div>
                ))}
                <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full" data-testid={`button-add-activity-${account.id}`}>
                      <Plus className="w-3 h-3 mr-1" />Log Activity
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
                    <ActivityForm onSubmit={(data) => createActivityMutation.mutate(data)} isPending={createActivityMutation.isPending} />
                  </DialogContent>
                </Dialog>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function ContactForm({ onSubmit, isPending }: { onSubmit: (data: Partial<ReferralContact>) => void; isPending: boolean }) {
  const [formData, setFormData] = useState({ name: "", position: "", phone: "", email: "", notes: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Name *</Label>
        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="input-contact-name" />
      </div>
      <div>
        <Label>Position</Label>
        <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} data-testid="input-contact-position" />
      </div>
      <div>
        <Label>Phone</Label>
        <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} data-testid="input-contact-phone" />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} type="email" data-testid="input-contact-email" />
      </div>
      <Button type="submit" disabled={isPending || !formData.name} className="w-full" data-testid="button-submit-contact">
        {isPending ? "Adding..." : "Add Contact"}
      </Button>
    </form>
  );
}

function ActivityForm({ onSubmit, isPending }: { onSubmit: (data: Partial<ActivityLog>) => void; isPending: boolean }) {
  const [formData, setFormData] = useState({
    activityType: "face_to_face" as ActivityType,
    activityDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      activityType: formData.activityType,
      activityDate: new Date(formData.activityDate),
      notes: formData.notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Activity Type *</Label>
        <Select value={formData.activityType} onValueChange={(v) => setFormData({ ...formData, activityType: v as ActivityType })}>
          <SelectTrigger data-testid="select-activity-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(activityTypeDisplayNames).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Date *</Label>
        <Input type="date" value={formData.activityDate} onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })} required data-testid="input-activity-date" />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="What was discussed?" data-testid="input-activity-notes" />
      </div>
      <Button type="submit" disabled={isPending} className="w-full" data-testid="button-submit-activity">
        {isPending ? "Logging..." : "Log Activity"}
      </Button>
    </form>
  );
}
