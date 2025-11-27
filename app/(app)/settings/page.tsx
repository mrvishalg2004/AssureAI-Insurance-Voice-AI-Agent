import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold font-headline">Settings</h1>
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="voice">Voice & Language</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Update your personal information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" defaultValue="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue="john.doe@example.com" disabled />
                        </div>
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="password">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Password</CardTitle>
                        <CardDescription>Change your password here. After saving, you'll be logged out.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input id="current-password" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" />
                        </div>
                        <Button>Save Password</Button>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="voice">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Voice & Language</CardTitle>
                        <CardDescription>Customize the assistant's voice and language.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Select defaultValue="en-US">
                                <SelectTrigger id="language">
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en-US">English (US)</SelectItem>
                                    <SelectItem value="en-GB">English (UK)</SelectItem>
                                    <SelectItem value="es-ES">Spanish</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="voice">AI Voice</Label>
                            <Select defaultValue="alloy">
                                <SelectTrigger id="voice">
                                    <SelectValue placeholder="Select voice" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="alloy">Alloy (Male)</SelectItem>
                                    <SelectItem value="nova">Nova (Female)</SelectItem>
                                    <SelectItem value="echo">Echo (Male)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-sm text-muted-foreground">Note: Voice & Language options depend on AI provider capabilities.</p>
                        <Button>Save Preferences</Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  )
}
