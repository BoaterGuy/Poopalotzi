import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, CreditCard, RefreshCw, Calendar, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  serviceEmails: boolean;
  paymentEmails: boolean;
  renewalReminders: boolean;
  scheduleEmails: boolean;

interface NotificationHistoryItem {
  id: number;
  type: string;
  subject: string;
  createdAt: string;
  status: 'sent' | 'failed' | 'pending';

interface NotificationHistoryResponse {
  notifications: NotificationHistoryItem[];
  total: number;
  page: number;
  limit: number;

const notificationTypes = {
  emailNotifications: {
    title: "Email Notifications",
    description: "Receive notifications via email",
    icon: <Mail className="h-4 w-4" />,
    category: "general"
  },
  smsNotifications: {
    title: "SMS Notifications", 
    description: "Receive notifications via text message",
    icon: <MessageSquare className="h-4 w-4" />,
    category: "general"
  },
  serviceEmails: {
    title: "Service Emails",
    description: "Updates about your pump-out service status",
    icon: <Bell className="h-4 w-4" />,
    category: "account"
  },
  paymentEmails: {
    title: "Payment Emails",
    description: "Payment receipts and transaction confirmations", 
    icon: <CreditCard className="h-4 w-4" />,
    category: "financial"
  },
  renewalReminders: {
    title: "Renewal Reminders",
    description: "Upcoming subscription renewal notifications",
    icon: <RefreshCw className="h-4 w-4" />,
    category: "financial"
  },
  scheduleEmails: {
    title: "Schedule Emails",
    description: "Pump-out service scheduling confirmations and updates",
    icon: <Calendar className="h-4 w-4" />,
    category: "service"
};

export default function NotificationPreferences() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("preferences");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // State for preferences
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  
  // State for history
  const [history, setHistory] = useState<NotificationHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Fetch notification preferences
  useEffect(() => {
    fetch('/api/notifications/preferences', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setPreferences(data);
        setPreferencesError(null);
      })
      .catch(err => {
        setPreferencesError(err.message);
        setPreferences(null);
      })
      .finally(() => setPreferencesLoading(false));
  }, []);

  // Fetch notification history when tab changes
  useEffect(() => {
    if (activeTab === "history" && !history) {
      setHistoryLoading(true);
      fetch('/api/notifications/history', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setHistory(data);
          setHistoryError(null);
        })
        .catch(err => {
          setHistoryError(err.message);
          setHistory(null);
        })
        .finally(() => setHistoryLoading(false));
  }, [activeTab, history]);

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    setIsUpdating(true);

    try {
      const updates = { [key]: value };
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)

      if (!response.ok) {
        throw new Error('Failed to update preferences');

      setPreferences({ ...preferences, [key]: value });
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved successfully.",
    } catch (error: any) {
      console.error('Preference update error:', error);
      toast({
        title: "Update Failed", 
        description: "There was a problem updating your preferences. Please try again.",
        variant: "destructive",
    } finally {
      setIsUpdating(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
  };

  const categoryMap = {
    general: "General",
    account: "Account",
    financial: "Financial", 
    service: "Service"
  };

  const groupedNotifications = Object.entries(notificationTypes).reduce((acc, [key, config]) => {
    const category = config.category;
    if (!acc[category]) {
      acc[category] = [];
    acc[category].push({ key: key as keyof NotificationPreferences, ...config });
    return acc;
  }, {} as Record<string, any[]>);

  if (preferencesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Loading your notification settings...</CardDescription>
        </CardHeader>
      </Card>
    );

  if (preferencesError || !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Failed to load notification preferences.</CardDescription>
        </CardHeader>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how and when you receive notifications about your pump-out services.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preferences" className="space-y-6">
            {Object.entries(groupedNotifications).map(([category, notifications]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-medium">{categoryMap[category as keyof typeof categoryMap]}</h3>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.key} className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {notification.icon}
                        </div>
                        <div className="space-y-1">
                          <Label 
                            htmlFor={notification.key}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {notification.title}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {notification.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id={notification.key}
                        checked={preferences[notification.key] || false}
                        onCheckedChange={(checked) => handlePreferenceChange(notification.key, checked)}
                        disabled={isUpdating}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            {historyLoading ? (
              <div className="text-center py-4">Loading notification history...</div>
            ) : historyError ? (
              <div className="text-center py-4 text-destructive">Failed to load notification history.</div>
            ) : history && history.notifications.length > 0 ? (
              <div className="space-y-4">
                {history.notifications.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                    <div className="space-y-1">
                      <div className="font-medium">{notification.subject}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(notification.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{notification.type}</Badge>
                      {getStatusBadge(notification.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No notification history found.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
