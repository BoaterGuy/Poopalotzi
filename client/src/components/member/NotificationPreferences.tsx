import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Bell, 
  CreditCard, 
  Calendar, 
  UserCheck, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

interface NotificationPreferences {
  id: number;
  userId: number;
  emailNotifications: boolean;
  welcomeEmails: boolean;
  subscriptionEmails: boolean;
  paymentEmails: boolean;
  renewalReminders: boolean;
  scheduleEmails: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailNotificationLog {
  id: number;
  userId: number;
  emailType: string;
  subject: string;
  recipientEmail: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
  sentAt: string;
  createdAt: string;
}

interface NotificationHistoryResponse {
  data: EmailNotificationLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const notificationTypeDescriptions = {
  emailNotifications: {
    title: "Email Notifications",
    description: "Master toggle for all email notifications",
    icon: <Mail className="h-4 w-4" />,
    category: "general"
  },
  welcomeEmails: {
    title: "Welcome Emails",
    description: "Account setup and welcome messages",
    icon: <UserCheck className="h-4 w-4" />,
    category: "account"
  },
  subscriptionEmails: {
    title: "Subscription Emails",
    description: "Service plan confirmations and updates",
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
  }
};

export default function NotificationPreferences() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("preferences");
  const [isUpdating, setIsUpdating] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [history, setHistory] = useState<NotificationHistoryResponse | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch notification preferences
  const fetchPreferences = async () => {
    try {
      const response = await apiRequest('/api/notifications/preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Fetch notification history
  const fetchHistory = async () => {
    if (activeTab !== "history") return;
    
    setHistoryLoading(true);
    try {
      const response = await apiRequest('/api/notifications/history');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  // Update preferences
  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      await apiRequest('/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved successfully.",
      });
      
      // Refresh preferences after update
      await fetchPreferences();
    } catch (error: any) {
      console.error('Preference update error:', error);
      toast({
        title: "Update Failed",
        description: "There was a problem updating your preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    setIsUpdating(true);
    try {
      const updates = { [key]: value };
      
      // If turning off master toggle, turn off all others
      if (key === 'emailNotifications' && !value) {
        updates.welcomeEmails = false;
        updates.subscriptionEmails = false;
        updates.paymentEmails = false;
        updates.renewalReminders = false;
        updates.scheduleEmails = false;
      }
      
      // Update preferences
      await updatePreferences(updates);
    } catch (error) {
      // Error is handled by mutation
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent': return <Badge variant="outline" className="text-green-600 border-green-600">Sent</Badge>;
      case 'failed': return <Badge variant="outline" className="text-red-600 border-red-600">Failed</Badge>;
      case 'pending': return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatEmailType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'welcome': 'Welcome',
      'subscription': 'Subscription',
      'payment': 'Payment',
      'renewal': 'Renewal Reminder',
      'schedule': 'Schedule Confirmation'
    };
    return typeMap[type] || type;
  };

  if (preferencesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading notification preferences...</span>
        </div>
      </div>
    );
  }

  if (preferencesError) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load notification preferences. {preferencesError.message}. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (!preferences) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load notification preferences. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0B1F3A]">Email Notifications</h2>
        <p className="text-gray-600">
          Manage how and when you receive email notifications from Poopalotzi.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preferences">
            <Bell className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            Email History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Email Notification Settings
              </CardTitle>
              <CardDescription>
                Control which types of emails you receive. You can always change these settings later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {notificationTypeDescriptions.emailNotifications.icon}
                  <div>
                    <Label htmlFor="emailNotifications" className="text-base font-medium">
                      {notificationTypeDescriptions.emailNotifications.title}
                    </Label>
                    <p className="text-sm text-gray-600">
                      {notificationTypeDescriptions.emailNotifications.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                  disabled={isUpdating}
                />
              </div>

              <Separator />

              {/* Account Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Account Notifications</h3>
                
                {(['welcomeEmails', 'subscriptionEmails'] as const).map((key) => (
                  <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      {notificationTypeDescriptions[key].icon}
                      <div>
                        <Label htmlFor={key} className="text-base">
                          {notificationTypeDescriptions[key].title}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {notificationTypeDescriptions[key].description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={key}
                      checked={preferences[key] && preferences.emailNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange(key, checked)}
                      disabled={isUpdating || !preferences.emailNotifications}
                    />
                  </div>
                ))}
              </div>

              <Separator />

              {/* Financial Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Financial Notifications</h3>
                
                {(['paymentEmails', 'renewalReminders'] as const).map((key) => (
                  <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      {notificationTypeDescriptions[key].icon}
                      <div>
                        <Label htmlFor={key} className="text-base">
                          {notificationTypeDescriptions[key].title}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {notificationTypeDescriptions[key].description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={key}
                      checked={preferences[key] && preferences.emailNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange(key, checked)}
                      disabled={isUpdating || !preferences.emailNotifications}
                    />
                  </div>
                ))}
              </div>

              <Separator />

              {/* Service Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Service Notifications</h3>
                
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    {notificationTypeDescriptions.scheduleEmails.icon}
                    <div>
                      <Label htmlFor="scheduleEmails" className="text-base">
                        {notificationTypeDescriptions.scheduleEmails.title}
                      </Label>
                      <p className="text-sm text-gray-600">
                        {notificationTypeDescriptions.scheduleEmails.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="scheduleEmails"
                    checked={preferences.scheduleEmails && preferences.emailNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('scheduleEmails', checked)}
                    disabled={isUpdating || !preferences.emailNotifications}
                  />
                </div>
              </div>

              {!preferences.emailNotifications && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Email notifications are currently disabled. Enable the master toggle above to receive any email notifications.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Email History
              </CardTitle>
              <CardDescription>
                View recent email notifications sent to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading email history...</span>
                </div>
              ) : !history?.data?.length ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No email notifications sent yet.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Email notifications will appear here once they are sent.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.data.map((email) => (
                    <div key={email.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getStatusIcon(email.status)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{email.subject}</span>
                              {getStatusBadge(email.status)}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatEmailType(email.emailType)} • {email.recipientEmail}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(email.sentAt), 'MMM d, yyyy h:mm a')}
                            </p>
                            {email.error && (
                              <p className="text-xs text-red-600 mt-1">
                                Error: {email.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {history.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!history.pagination.hasPrev}
                        onClick={() => {
                          // Implement pagination if needed
                        }}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {history.pagination.page} of {history.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!history.pagination.hasNext}
                        onClick={() => {
                          // Implement pagination if needed
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}