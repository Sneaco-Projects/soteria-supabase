"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  MapPin,
  AlertTriangle,
  Settings,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  HeartPulseIcon as MonitorHeart,
  Heart,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

// Mock data
const mockAlerts = [
  {
    id: "ALT001",
    userId: "USR001",
    userName: "John Doe",
    type: "Emergency",
    location: "40.7128, -74.0060",
    timestamp: "2024-01-15 14:30:25",
    status: "Active",
    deviceId: "DEV001",
  },
  {
    id: "ALT002",
    userId: "USR002",
    userName: "Jane Smith",
    type: "Normal",
    location: "34.0522, -118.2437",
    timestamp: "2024-01-15 13:45:12",
    status: "Resolved",
    deviceId: "DEV002",
  },
  {
    id: "ALT003",
    userId: "USR003",
    userName: "Bob Johnson",
    type: "Emergency",
    location: "41.8781, -87.6298",
    timestamp: "2024-01-15 12:15:33",
    status: "In Progress",
    deviceId: "DEV003",
  },
]

const mockDevices = [
  {
    id: "DEV001",
    userId: "USR001",
    userName: "John Doe",
    status: "Online",
    battery: "85%",
    lastSeen: "2024-01-15 14:30:25",
    location: "New York, NY",
  },
  {
    id: "DEV002",
    userId: "USR002",
    userName: "Jane Smith",
    status: "Online",
    battery: "92%",
    lastSeen: "2024-01-15 14:28:10",
    location: "Los Angeles, CA",
  },
  {
    id: "DEV003",
    userId: "USR003",
    userName: "Bob Johnson",
    status: "Offline",
    battery: "23%",
    lastSeen: "2024-01-15 12:15:33",
    location: "Chicago, IL",
  },
]

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-emerald-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">SOTERIA Admin</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-0"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-0"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Active Medical Devices</CardTitle>
              <MonitorHeart className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">1,234</div>
              <p className="text-xs text-gray-600">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Medical Emergencies</CardTitle>
              <AlertTriangle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">23</div>
              <p className="text-xs text-gray-600">-5% from yesterday</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Patients Monitored</CardTitle>
              <MapPin className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">1,156</div>
              <p className="text-xs text-gray-600">93.7% uptime</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Registered Patients</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">2,847</div>
              <p className="text-xs text-gray-600">+18% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-lg border border-emerald-200">
            <TabsTrigger
              value="alerts"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
            >
              Medical Emergency Logs
            </TabsTrigger>
            <TabsTrigger
              value="devices"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
            >
              Patient Device Registry
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
            >
              User Management
            </TabsTrigger>
            <TabsTrigger
              value="map"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
            >
              Live Map
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
            >
              System Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts">
            <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-800">Medical Emergency Logs</CardTitle>
                    <CardDescription className="text-gray-600">
                      Monitor all medical alerts and emergency responses
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search alerts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64 bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-0"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border border-emerald-100 rounded-lg bg-white/80"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            alert.type === "Emergency" ? "bg-red-500" : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="font-medium text-gray-800">{alert.userName}</div>
                          <div className="text-sm text-gray-600">
                            {alert.location} • {alert.timestamp}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={
                            alert.status === "Active"
                              ? "destructive"
                              : alert.status === "In Progress"
                                ? "default"
                                : "secondary"
                          }
                          className={
                            alert.status === "Active"
                              ? "bg-red-500 text-white"
                              : alert.status === "In Progress"
                                ? "bg-emerald-500 text-white"
                                : ""
                          }
                        >
                          {alert.status}
                        </Badge>
                        <Badge variant="outline" className="border-emerald-500 text-emerald-500 bg-emerald-50">
                          {alert.type}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Contact Guardian</DropdownMenuItem>
                            <DropdownMenuItem>Mark Resolved</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices">
            <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800">Patient Device Registry</CardTitle>
                <CardDescription className="text-gray-600">
                  Monitor all registered patient medical alert devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-4 border border-emerald-100 rounded-lg bg-white/80"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            device.status === "Online" ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <div>
                          <div className="font-medium text-gray-800">{device.userName}</div>
                          <div className="text-sm text-gray-600">
                            Device ID: {device.id} • {device.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={device.status === "Online" ? "default" : "secondary"}
                          className={
                            device.status === "Online" ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-700"
                          }
                        >
                          {device.status}
                        </Badge>
                        <span className="text-sm text-gray-600">Battery: {device.battery}</span>
                        <span className="text-sm text-gray-600">Last seen: {device.lastSeen}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800">User Management</CardTitle>
                <CardDescription className="text-gray-600">Manage guardians and monitoring personnel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">User Management</h3>
                  <p className="text-gray-600 mb-4">Add, remove, and manage user accounts and permissions</p>
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-0">
                    Add New User
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800">Live Map View</CardTitle>
                <CardDescription className="text-gray-600">Real-time location tracking of all devices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Interactive Map</h3>
                    <p className="text-gray-600">Real-time GPS tracking would be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800">System Settings</CardTitle>
                <CardDescription className="text-gray-600">
                  Configure system-wide settings and thresholds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800 mb-3">Alert Thresholds</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Button Press Debounce (ms)</label>
                        <Input
                          type="number"
                          defaultValue="500"
                          className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">GPS Update Interval (seconds)</label>
                        <Input
                          type="number"
                          defaultValue="30"
                          className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-800 mb-3">Notification Settings</h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-gray-600">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Enable SMS notifications</span>
                      </label>
                      <label className="flex items-center space-x-2 text-gray-600">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Enable push notifications</span>
                      </label>
                      <label className="flex items-center space-x-2 text-gray-600">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Enable email notifications</span>
                      </label>
                    </div>
                  </div>

                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-0">
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-lg border-t border-emerald-200 py-12 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-gray-800">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold">SOTERIA</span>
              </div>
              <p className="text-gray-600">Protecting lives with advanced medical alert technology.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link href="/features" className="hover:text-emerald-600 transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="hover:text-emerald-600 transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-emerald-600 transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-emerald-600 transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link href="/about" className="hover:text-emerald-600 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-emerald-600 transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-emerald-600 transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-emerald-600 transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link href="/help" className="hover:text-emerald-600 transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-emerald-600 transition-colors">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-emerald-600 transition-colors">
                    System Status
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-emerald-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2024 SOTERIA. Saving lives, one heartbeat at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
