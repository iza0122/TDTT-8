"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export default function MerchantSettingsPage() {
  const [receiveEmailNotifications, setReceiveEmailNotifications] = useState(true);
  const [receivePushNotifications, setReceivePushNotifications] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* General Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your general merchant account settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" placeholder="********" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" placeholder="********" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" placeholder="********" />
          </div>
          <Button>Update Password</Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Configure how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotifications">Email Notifications</Label>
            <Switch
              id="emailNotifications"
              checked={receiveEmailNotifications}
              onCheckedChange={setReceiveEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pushNotifications">Push Notifications</Label>
            <Switch
              id="pushNotifications"
              checked={receivePushNotifications}
              onCheckedChange={setReceivePushNotifications}
            />
          </div>
          <Button>Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  );
}
