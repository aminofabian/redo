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
  CheckCircle
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
import { Session } from "next-auth";
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
  type: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  lastAccessed: string;
  thumbnailUrl: string;
  driveUrl: string;
  category: string;
}

export default function MaterialsClient({ session }: { session: Session }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/materials');
      if (!response.ok) throw new Error('Failed to fetch materials');
      
      const data = await response.json();
      setMaterials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      default:
        return PlayCircle;
    }
  };

  const filteredMaterials = materials
    .filter(material => {
      const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || material.type === filterType;
      const matchesStatus = filterStatus === 'all' || material.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'progress':
          return b.progress - a.progress;
        case 'recent':
        default:
          return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] bg-white">
                <CheckCircle className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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
                <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Materials Grid with Enhanced Cards */}
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMaterials.map((material) => {
            const StatusIcon = getStatusIcon(material.status);
            
            return (
              <Card key={material.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex h-full">
                  {/* Thumbnail with Overlay */}
                  <div className="w-1/3 relative group">
                    <Image
                      src={material.thumbnailUrl}
                      alt={material.title}
                      width={200}
                      height={200}
                      className="object-cover h-full brightness-90 group-hover:brightness-100 transition-all"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  {/* Enhanced Content Section */}
                  <div className="w-2/3 p-6 flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-lg line-clamp-1">{material.title}</h3>
                          <Badge variant="secondary" className="mt-1">
                            {material.category}
                          </Badge>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(material.status)} capitalize`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {material.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <ScrollArea className="h-[60px] mt-2">
                        <p className="text-sm text-muted-foreground">
                          {material.description}
                        </p>
                      </ScrollArea>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Progress</span>
                          <span>{material.progress}%</span>
                        </div>
                        <Progress 
                          value={material.progress} 
                          className="h-2"
                          // Add different colors based on progress
                          style={{
                            background: material.progress >= 100 
                              ? 'var(--green-100)' 
                              : 'var(--slate-100)',
                            '--progress-color': material.progress >= 100 
                              ? 'var(--green-600)' 
                              : 'var(--blue-600)'
                          } as any}
                        />
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Last accessed: {new Date(material.lastAccessed).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={material.driveUrl} target="_blank">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open
                          </Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/materials/${material.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No materials found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'You haven\'t purchased any materials yet'}
          </p>
          {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
            <Button asChild className="mt-6">
              <Link href="/store">Browse our catalog</Link>
            </Button>
          )}
        </Card>
      )}
    </div>
  );
} 