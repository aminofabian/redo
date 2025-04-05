"use client";

import { Package, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const topProducts = [
  {
    name: "NCLEX-RN Complete Guide",
    sales: 234,
    revenue: 23_400,
    growth: 12.5,
  },
  {
    name: "Med-Surg Practice Tests",
    sales: 187,
    revenue: 9_350,
    growth: 8.2,
  },
  {
    name: "Pharmacology Study Pack",
    sales: 156,
    revenue: 7_800,
    growth: -2.4,
  },
];

export function TopProducts() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Top Selling Products</CardTitle>
          <Button variant="ghost" className="gap-2">
            View All <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {topProducts.map((product) => (
            <div key={product.name} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    {product.sales} sales
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  ${product.revenue.toLocaleString()}
                </div>
                <div className={cn(
                  "text-sm flex items-center gap-1",
                  product.growth > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {product.growth > 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {Math.abs(product.growth)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 