import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Shield,
  Bell,
  Palette,
  Globe,
  Save,
  Loader2,
  Camera,
  Calendar,
  Clock,
  Activity,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  Store,
  CreditCard,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage, availableLanguages } from "@/components/i18n/LanguageContext";

function useSafeLanguage() {
  try {
    return useLanguage();
  } catch (e) {
    return { t: (key: string) => key, language: 'en', setLanguage: () => { }, availableLanguages: [] };
  }
}

export default function Profile() {
  const queryClient = useQueryClient();
  const { language, setLanguage, t } = useSafeLanguage();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    department: '',
    job_title: '',
    bio: '',
    timezone: 'UTC',
    avatar_url: ''
  });

  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    email_notifications: true,
    push_notifications: true,
    low_stock_alerts: true,
    order_updates: true,
    weekly_reports: true,
    dark_mode: false,
    compact_view: false
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
    initialData: [],
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ['stockMovements'],
    queryFn: () => base44.entities.StockMovement.list({ sort: '-created_at', limit: 20 }),
    initialData: [],
  });

  // Find vendor profile if user is a vendor
  const myVendor = vendors.find(v => v.user_id === user?.id);
  const isVendor = user?.user_type === 'vendor';

  // Calculate user stats
  const userSales = sales.filter(s => s.vendor_id === myVendor?.id);
  const totalSalesAmount = userSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const userActivities = activityLogs.filter(a => a.performed_by === user?.email);

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        department: user.department || '',
        job_title: user.job_title || '',
        bio: user.bio || '',
        timezone: user.preferences?.timezone || user.timezone || 'UTC',
        avatar_url: user.avatar || user.avatar_url || ''
      });

      const prefs = user.preferences;
      const notifs = prefs?.notifications;

      setPreferences({
        email_notifications: notifs?.email ?? true,
        push_notifications: notifs?.push ?? true,
        low_stock_alerts: notifs?.low_stock_alerts ?? true,
        order_updates: notifs?.order_updates ?? true,
        weekly_reports: notifs?.weekly_reports ?? true,
        dark_mode: prefs?.dark_mode ?? false,
        compact_view: prefs?.compact_view ?? false
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(t('profileUpdated'));
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(t('failedUpdateProfile'));
      console.error(error);
    }
  });

  const handleSaveProfile = async () => {
    const nestedPreferences = {
      language: language,
      timezone: profileData.timezone,
      notifications: {
        email: preferences.email_notifications,
        sms: false,
        push: preferences.push_notifications,
        low_stock_alerts: preferences.low_stock_alerts,
        order_updates: preferences.order_updates,
        weekly_reports: preferences.weekly_reports
      },
      dark_mode: preferences.dark_mode,
      compact_view: preferences.compact_view
    };

    await updateProfileMutation.mutateAsync({
      full_name: profileData.full_name,
      phone: profileData.phone,
      department: profileData.department,
      job_title: profileData.job_title,
      bio: profileData.bio,
      avatar: profileData.avatar_url,
      preferences: nestedPreferences
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setProfileData(prev => ({ ...prev, avatar_url: file_url }));
        await updateProfileMutation.mutateAsync({ avatar: file_url });
      } catch (error) {
        toast.error(t('failedUploadImage'));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Profile Card */}
        <Card className="flex-1">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="h-28 w-28 rounded-2xl bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                  {profileData.avatar_url ? (
                    <img src={profileData.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    user?.full_name?.charAt(0) || 'U'
                  )}
                </div>
                <label className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-slate-900">{user?.full_name || 'User'}</h1>
                <p className="text-slate-500">{user?.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <Badge className={cn(
                    "capitalize",
                    user?.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-teal-100 text-teal-700'
                  )}>
                    {user?.role || 'user'}
                  </Badge>
                  {isVendor && myVendor && (
                    <Badge variant="outline" className="capitalize">
                      <Store className="h-3 w-3 mr-1" />
                      {myVendor.store_name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {t('joined')} {user?.created_at ? format(new Date(user.created_at), 'MMM yyyy') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:w-64">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">${totalSalesAmount.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{t('totalSalesLabel')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{userActivities.length}</p>
                  <p className="text-xs text-slate-500">{t('activities')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> {t('profileTab')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> {t('preferencesTab')}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> {t('securityTab')}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" /> {t('activityTab')}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('personalInformation')}</CardTitle>
                <CardDescription>{t('updatePersonalDetails')}</CardDescription>
              </div>
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                disabled={updateProfileMutation.isPending}
                className={isEditing ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isEditing ? (
                  <Save className="h-4 w-4 mr-2" />
                ) : null}
                {isEditing ? t('saveChanges') : t('editProfile')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t('fullName')}</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder={t('yourFullName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-slate-500">{t('emailCannotChange')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_title">{t('jobTitle')}</Label>
                  <Input
                    id="job_title"
                    value={profileData.job_title}
                    onChange={(e) => setProfileData(prev => ({ ...prev, job_title: e.target.value }))}
                    disabled={!isEditing}
                    placeholder={t('egInventoryManager')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">{t('department')}</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                    disabled={!isEditing}
                    placeholder={t('egOperations')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('timezone')}</Label>
                  <Select
                    value={profileData.timezone}
                    onValueChange={(v) => setProfileData(prev => ({ ...prev, timezone: v }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">{t('bio')}</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  placeholder={t('tellUsAboutYourself')}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Vendor Details (if applicable) */}
          {isVendor && myVendor && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-slate-400" />
                  {t('storeInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-slate-500">{t('storeName')}</Label>
                    <p className="font-medium">{myVendor.store_name}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">{t('businessName')}</Label>
                    <p className="font-medium">{myVendor.name}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">{t('location')}</Label>
                    <p className="font-medium">{myVendor.city}, {myVendor.country}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">{t('subscription')}</Label>
                    <Badge variant="outline" className="capitalize">{myVendor.subscription_plan}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-slate-400" />
                {t('notificationSettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'email_notifications', label: t('emailNotifications'), desc: t('receiveUpdatesEmail') },
                { key: 'push_notifications', label: t('pushNotifications'), desc: t('browserPushNotifications') },
                { key: 'low_stock_alerts', label: t('lowStockAlerts'), desc: t('getNotifiedLowItems') },
                { key: 'order_updates', label: t('orderUpdates'), desc: t('updatesOnPurchaseOrders') },
                { key: 'weekly_reports', label: t('weeklyReports'), desc: t('receiveWeeklySummary') },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{label}</p>
                    <p className="text-sm text-slate-500">{desc}</p>
                  </div>
                  <Switch
                    checked={preferences[key]}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, [key]: checked }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-slate-400" />
                {t('appearance')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{t('language')}</p>
                  <p className="text-sm text-slate-500">{t('selectPreferredLanguage')}</p>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{t('compactView')}</p>
                  <p className="text-sm text-slate-500">{t('showMoreItemsLessSpacing')}</p>
                </div>
                <Switch
                  checked={preferences.compact_view}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, compact_view: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('savePreferences')}
            </Button>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-slate-400" />
                {t('accountSecurity')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{t('accountVerified')}</p>
                    <p className="text-sm text-slate-500">{t('accountVerified')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{t('email')}</p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">{t('accountVerified')}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{t('role')}</p>
                    <p className="text-sm text-slate-500">{t('yourAccountPermissions')}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{user?.role || 'user'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{t('lastLogin')}</p>
                    <p className="text-sm text-slate-500">{t('mostRecentLogin')}</p>
                  </div>
                  <span className="text-sm text-slate-600">{t('justNow')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">{t('securityTip')}</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    {t('securityTipText')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-slate-400" />
                {t('recentActivityLog')}
              </CardTitle>
              <CardDescription>{t('recentActions')}</CardDescription>
            </CardHeader>
            <CardContent>
              {userActivities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">{t('noRecentActivity')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userActivities.map((activity, index) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        activity.type === 'in' ? 'bg-emerald-100 text-emerald-600' :
                          activity.type === 'out' ? 'bg-blue-100 text-blue-600' :
                            'bg-amber-100 text-amber-600'
                      )}>
                        <Activity className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">
                          {activity.type?.charAt(0).toUpperCase() + activity.type?.slice(1)}: {activity.product_name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {Math.abs(activity.quantity)} {t('units')} • {activity.reference_id || t('manualEntry')}
                        </p>
                      </div>
                      <span className="text-sm text-slate-400 flexshrink-0">
                        {format(new Date(activity.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}