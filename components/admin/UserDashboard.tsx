import { useState } from "react";
import { 
  Edit, 
  Trash2, 
  Mail,
  ShieldCheck,
  ShieldAlert,
  UserX,
  UserCheck,
  FileText,
  ShoppingCart,
  Star,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UserType {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  verified?: boolean;
  twoFactorEnabled?: boolean;
  purchaseCount?: number;
  reviewCount?: number;
}

export function UserDashboard({ user }: { user: UserType }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSendEmail = () => {
    toast.success("Email sent to user");
  };
  
  const handleResetPassword = () => {
    toast.success("Password reset link sent");
  };
  
  const handleChangeRole = (newRole: string) => {
    toast.success(`User role changed to ${newRole}`);
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image || ''} />
            <AvatarFallback className="text-xl">
              {user?.name ? user.name.split(' ').map(n => n?.[0] || '').join('').toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{user?.name || 'User'}</h1>
            <p className="text-gray-500">{user?.email || 'No email'}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant={user.role === "ADMIN" ? "destructive" : "default"}>
                {user.role}
              </Badge>
              {user.verified ? (
                <Badge variant="outline" className="bg-green-50 text-green-700">Verified</Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Unverified</Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleSendEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetPassword}>
            <Lock className="mr-2 h-4 w-4" />
            Reset Password
          </Button>
          <Button variant="default" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">March 12, 2023</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Login</p>
                    <p className="font-medium">Today, 10:42 AM</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Account Status</p>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Purchase Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Total Purchases</p>
                    <p className="font-medium">{user.purchaseCount}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Total Spent</p>
                    <p className="font-medium">$239.99</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Last Purchase</p>
                    <p className="font-medium">3 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Role Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant={user.role === "ADMIN" ? "default" : "outline"} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleChangeRole("ADMIN")}
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Admin
                  </Button>
                  <Button
                    variant={user.role === "VERIFIED_USER" ? "default" : "outline"} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleChangeRole("VERIFIED_USER")}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Verified User
                  </Button>
                  <Button
                    variant={user.role === "USER" ? "default" : "outline"} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => handleChangeRole("USER")}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Regular User
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="purchases">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="font-medium mb-4">Purchase History</h3>
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">No purchase history available</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="reviews">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="font-medium mb-4">Review History</h3>
            <div className="text-center py-8 text-gray-500">
              <Star className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">No reviews available</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="security">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="font-medium mb-4">Security Settings</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                  <Badge variant={user.twoFactorEnabled ? "default" : "outline"}>
                    {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  Add an extra layer of security to the account
                </p>
                <Button size="sm" variant={user.twoFactorEnabled ? "outline" : "default"}>
                  {user.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Password Management</h4>
                <p className="text-sm text-gray-500 mb-3">
                  Reset user's password or force password change on next login
                </p>
                <div className="space-x-2">
                  <Button size="sm" variant="outline" onClick={handleResetPassword}>
                    Send Reset Link
                  </Button>
                  <Button size="sm" variant="outline">
                    Force Password Change
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 