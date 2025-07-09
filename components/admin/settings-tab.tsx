"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function SettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage system-wide settings and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Preferences</CardTitle>
          <CardDescription>Configure global system settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Enable dark mode for the admin interface.</p>
            </div>
            <Switch id="dark-mode" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email notifications for important events.</p>
            </div>
            <Switch id="notifications" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-logout">Auto Logout</Label>
              <p className="text-sm text-muted-foreground">Automatically log out after 30 minutes of inactivity.</p>
            </div>
            <Switch id="auto-logout" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
          <CardDescription>Manage database operations and maintenance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Backup & Restore</h4>
            <p className="text-sm text-muted-foreground">
              Create backups of your database or restore from a previous backup.
            </p>
            <div className="flex space-x-2">
              <Button variant="outline">Create Backup</Button>
              <Button variant="outline">Restore</Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Database Optimization</h4>
            <p className="text-sm text-muted-foreground">Optimize database performance and clean up unused data.</p>
            <Button variant="outline">Optimize Database</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
