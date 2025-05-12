"use client";

import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertCircle,
  ExternalLink,
  PlayCircle,
  FileText,
  Clock,
  CheckCircle,
  Calendar,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Session } from "next-auth";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Material {
  id: number;
  title: string;
  description: string;
  type: string; // Document, PDF, Presentation, etc.
  thumbnailUrl: string;
  downloadUrl: string | null;
  driveUrl: string; // Alternative viewing option
  category: string; // Pediatrics, Maternal Health, etc.
  
  // Purchase details
  date: string; // Purchase date
  formattedDate: string; // Formatted purchase date
  
  // Download details
  isDownloadAvailable: boolean;
  daysUntilExpiry: number;
  expiryDate: string;
  lastAccessed: string;
  
  // File details
  fileSize: string;
  fileFormat: string;
  
  // Metadata
  author: string;
  rating: number;
  
  // Progress tracking
  status: string; // 'completed', 'in-progress', 'not-started'
}

export default function MaterialsClient({ session }: { session: Session }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');


  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/dashboard/materials');
      if (!response.ok) throw new Error('Failed to fetch materials');
      
      const data = await response.json();
      console.log('Materials fetched:', data); // Log for debugging
      
      // Map API response for nursing materials downloads
      const mappedMaterials = data.map((item: any) => ({
        id: item.id,
        title: item.title || '',
        description: item.description || '',
        type: item.type || '',
        thumbnailUrl: item.image || '',
        downloadUrl: item.downloadUrl,
        driveUrl: item.driveUrl || item.downloadUrl || '',
        category: item.category || '',
        
        // Purchase details
        date: item.date || '',
        formattedDate: item.formattedDate || '',
        
        // Download details
        isDownloadAvailable: item.isDownloadAvailable,
        daysUntilExpiry: item.daysUntilExpiry || 0,
        expiryDate: item.expiryDate || '',
        lastAccessed: item.lastAccessed || '',
        
        // File details
        fileSize: item.fileSize || '',
        fileFormat: item.fileFormat || '',
        
        // Metadata
        author: item.author || '',
        rating: item.rating || 0,
        
        // Progress tracking
        status: item.status || 'not-started'
      }));
      
      setMaterials(mappedMaterials);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getFormatColor = (format: string | undefined) => {
    switch (format?.toUpperCase()) {
      case 'PDF':
        return 'text-red-600 bg-red-50';
      case 'DOC':
      case 'DOCX':
        return 'text-blue-600 bg-blue-50';
      case 'PPT':
      case 'PPTX':
        return 'text-orange-600 bg-orange-50';
      case 'XLS':
      case 'XLSX':
        return 'text-green-600 bg-green-50';
      case 'ZIP':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getFormatIcon = (format: string | undefined) => {
    switch (format?.toUpperCase()) {
      case 'PDF':
        return FileText;
      case 'DOC':
      case 'DOCX':
        return FileText;
      case 'PPT':
      case 'PPTX':
        return PlayCircle;
      case 'XLS':
      case 'XLSX':
        return FileText;
      case 'ZIP':
        return FileText;
      default:
        return FileText;
    }
  };

  const filteredMaterials = materials
    .filter(material => {
      const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || material.type === filterType;
      const matchesCategory = filterCategory === 'all' || material.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'format':
          return (a.fileFormat || '').localeCompare(b.fileFormat || '');
        case 'recent':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start">
          <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Error loading materials</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4" 
              size="sm"
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Section with Stats */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Learning Materials</h1>
            <p className="text-muted-foreground mt-1">Access and track your learning progress</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="text-sm">
              <span className="text-muted-foreground">Total Materials: </span>
              <span className="font-medium">{materials.length}</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="text-sm">
              <span className="text-muted-foreground">Completed: </span>
              <span className="font-medium">
                {materials.filter(m => m.status === 'completed').length}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-blue-50/50">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {materials.filter(m => m.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </Card>
          {/* Add similar cards for other stats */}
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px] bg-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PDF Document">PDF Documents</SelectItem>
                <SelectItem value="Video">Video Lessons</SelectItem>
                <SelectItem value="Word Document">Word Documents</SelectItem>
                <SelectItem value="PowerPoint">Presentations</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px] bg-white">
                <BookOpen className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                <SelectItem value="Maternal Health">Maternal Health</SelectItem>
                <SelectItem value="Mental Health">Mental Health</SelectItem>
                <SelectItem value="NCLEX">NCLEX Resources</SelectItem>
                <SelectItem value="Clinical Skills">Clinical Skills</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-white">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="format">File Format</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Materials Simple Row Layout */}
      {filteredMaterials.length > 0 ? (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium">Product</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Format</th>
                <th className="p-3 font-medium">Expiry</th>
                <th className="p-3 font-medium">Size</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((material) => {
                const FormatIcon = getFormatIcon(material.fileFormat);
                return (
                  <tr key={material.id} className="border-t hover:bg-muted/50">
                    <td className="p-3">
                      <div className="font-medium">{material.title}</div>
                      <div className="text-xs text-muted-foreground">Purchased: {material.formattedDate}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{material.category}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant="outline" 
                        className={`${getFormatColor(material.fileFormat)} capitalize`}
                      >
                        <FormatIcon className="h-3 w-3 mr-1" />
                        {material.fileFormat || 'Document'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {material.isDownloadAvailable ? (
                        <div className="text-sm text-blue-600 font-medium">
                          {material.daysUntilExpiry} days left
                        </div>
                      ) : (
                        <div className="text-sm text-red-600 font-medium">
                          Expired
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {material.fileSize}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {material.downloadUrl && material.isDownloadAvailable && (
                        <Button size="sm" variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800" asChild>
                          <Link href={material.downloadUrl} target="_blank">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Link>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={material.driveUrl} target="_blank">
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No materials found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || filterType !== 'all' || filterCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'You haven\'t purchased any nursing materials yet'}
          </p>
          {!searchQuery && filterType === 'all' && filterCategory === 'all' && (
            <Button asChild className="mt-6">
              <Link href="/store">Browse our catalog</Link>
            </Button>
          )}
        </Card>
      )}
    </div>
  );
} 