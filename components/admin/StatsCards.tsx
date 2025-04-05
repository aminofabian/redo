"use client";

import { 
  DollarSign, 
  Users, 
  Package, 
  ShoppingCart, 
  Clock, 
  ArrowUpRight 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Revenue"
        value="$45,231.89"
        icon={DollarSign}
        trend="+20.1% from last month"
        trendUp={true}
      />
      <StatCard
        title="Total Users"
        value="2,847"
        icon={Users}
        trend="+18.2% new users"
        trendUp={true}
      />
      <StatCard
        title="Total Products"
        value="24"
        icon={Package}
        trend="3 pending review"
        showClock
      />
      <StatCard
        title="Active Orders"
        value="12"
        icon={ShoppingCart}
        trend="4 need attention"
        warning
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendUp?: boolean;
  showClock?: boolean;
  warning?: boolean;
}

function StatCard({ title, value, icon: Icon, trend, trendUp, showClock, warning }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          {title}
        </CardTitle>
        <Icon className="w-4 h-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center text-sm ${
          warning ? 'text-orange-600' : 
          trendUp ? 'text-green-600' : 
          'text-gray-600'
        } mt-1`}>
          {trendUp ? <ArrowUpRight className="w-4 h-4 mr-1" /> : 
           showClock && <Clock className="w-4 h-4 mr-1" />}
          {trend}
        </div>
      </CardContent>
    </Card>
  );
} 