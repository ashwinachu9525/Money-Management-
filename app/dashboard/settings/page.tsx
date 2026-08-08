import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InstallPWAButton } from "@/components/dashboard/install-pwa-btn";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  let user = null;
  
  if (session?.user?.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={user?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue={user?.email || ""} disabled />
            </div>
            <p className="text-sm text-muted-foreground pt-2">
              Profile editing will be available in a future update.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value="INR (₹)" disabled />
              <p className="text-xs text-muted-foreground">Currently locked to Indian Rupee</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700 dark:text-blue-400">
              Mobile & Desktop App (PWA)
            </CardTitle>
            <CardDescription>
              Install Money Manager directly on your phone home screen or desktop for full-screen offline experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InstallPWAButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
