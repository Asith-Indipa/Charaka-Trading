import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import StoreSettings from "./admin/StoreSettings"
import Permissions from "./admin/Permissions"
import { PERMISSIONS } from "@/utils/roles"
import { useSearchParams } from "react-router-dom"
import { useEffect, useState } from "react"

export default function Settings() {
    const { user, can } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "account");

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (value) => {
        setActiveTab(value);
        setSearchParams({ tab: value });
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    {can(PERMISSIONS.STORE_EDIT) && (
                        <TabsTrigger value="store">Store</TabsTrigger>
                    )}
                    {can(PERMISSIONS.USER_CREATE) && (
                        <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    )}
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account</CardTitle>
                            <CardDescription>
                                Make changes to your account here. Click save when you're done.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="space-y-1">
                                <Label htmlFor="name">Email</Label>
                                <Input id="name" defaultValue={user?.email} disabled />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" defaultValue={user?.email} disabled />
                            </div>
                            <div className="pt-4">
                                <Button>Save changes</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {can(PERMISSIONS.STORE_EDIT) && (
                    <TabsContent value="store">
                        <StoreSettings />
                    </TabsContent>
                )}

                {can(PERMISSIONS.USER_CREATE) && (
                    <TabsContent value="permissions">
                        <Permissions />
                    </TabsContent>
                )}

                <TabsContent value="appearance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>
                                Customize how the application looks for you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="space-y-1">
                                <span className="text-sm font-medium">Theme</span>
                                <p className="text-sm text-muted-foreground">
                                    Theme customization coming soon.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>
                                Manage your notification preferences.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Notification settings coming soon.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

