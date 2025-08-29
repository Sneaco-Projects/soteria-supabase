"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  MapPin,
  Bell,
  Phone,
  MessageSquare,
  Clock,
  Battery,
  Signal,
  User,
  HeartPulse,
  Activity,
  Heart,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

// Mock data for guardian dashboard
const mockAssignedDevices = [
  {
    id: "DEV001",
    userName: "Mom (Sarah Johnson)",
    status: "Online",
    battery: "85%",
    signal: "Strong",
    lastLocation: "Home - 123 Main St",
    lastSeen: "2 minutes ago",
    relationship: "Mother",
    healthStatus: "Stable",
    bloodPressure: "120/80",
    heartRate: "72 bpm",
  },
  {
    id: "DEV002",
    userName: "Dad (Robert Johnson)",
    status: "Online",
    battery: "92%",
    signal: "Good",
    lastLocation: "Office - Downtown",
    lastSeen: "5 minutes ago",
    relationship: "Father",
    healthStatus: "Normal",
    bloodPressure: "130/85",
    heartRate: "68 bpm",
  },
]

const mockRecentAlerts = [
  {
    id: "ALT001",
    userName: "Mom (Sarah Johnson)",
    type: "Normal Alert",
    location: "123 Main St, Springfield",
    timestamp: "2024-01-15 14:30:25",
    status: "Resolved",
    responded: true,
    responseTime: "2 minutes",
  },
  {
    id: "ALT002",
    userName: "Dad (Robert Johnson)",
    type: "Emergency Alert",
    location: "456 Oak Ave, Springfield",
    timestamp: "2024-01-14 09:15:33",
    status: "Resolved",
    responded: true,
    responseTime: "1 minute",
  },
]

export default function GuardianDashboard() {
  const [activeAlert, setActiveAlert] = useState(null)

  const handleRespond = (alertId: string) => {
    // TODO: Implement response functionality
    console.log("Responding to alert:", alertId)
  }

  const handleCall = (deviceId: string) => {
    // TODO: Implement call functionality
    console.log("Calling device:", deviceId)
  }

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
              <span className="text-xl font-bold text-gray-800">Family Care Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-0"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-0"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 relative z-10">
        {/* Active Alert Banner */}
        {activeAlert && (
          <Alert className="mb-6 border-red-200 bg-red-50/80 backdrop-blur-lg">
            <Bell className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>EMERGENCY ALERT:</strong> Sarah Johnson needs help at 123 Main St, Springfield
              <div className="flex space-x-2 mt-2">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  Respond Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                >
                  Call Emergency Services
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 border border-emerald-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Family Members Monitored</CardTitle>
              <Shield className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">{mockAssignedDevices.length}</div>
              <p className="text-xs text-gray-600">All devices online</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border border-emerald-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Health Alerts</CardTitle>
              <Bell className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">2</div>
              <p className="text-xs text-gray-600">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border border-emerald-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">1.5m</div>
              <p className="text-xs text-gray-600">Excellent response</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border border-emerald-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Health Monitoring Status</CardTitle>
              <Signal className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-gray-600">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-lg border border-emerald-200">
            <TabsTrigger
              value="devices"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
            >
              Family Health Monitoring
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
            >
              Health Alert History
            </TabsTrigger>
            <TabsTrigger
              value="map"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
            >
              Real-time Health Monitoring
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
            >
              Notification Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices">
            <div className="grid gap-6">
              {mockAssignedDevices.map((device) => (
                <Card key={device.id} className="bg-white/90 border border-emerald-200 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            device.status === "Online" ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        <div>
                          <CardTitle className="text-lg text-gray-800">{device.userName}</CardTitle>
                          <CardDescription className="text-gray-600">{device.relationship}</CardDescription>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                          onClick={() => handleCall(device.id)}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Battery className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{device.battery}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Signal className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{device.signal}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{device.lastLocation}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{device.lastSeen}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <HeartPulse className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Health: {device.healthStatus}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">BP: {device.bloodPressure}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="text-sm">HR: {device.heartRate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <Card className="bg-white/90 border border-emerald-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800">Health Alert History</CardTitle>
                <CardDescription className="text-gray-600">Recent alerts from your assigned devices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border border-emerald-100 rounded-lg bg-white/80"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            alert.type === "Emergency Alert" ? "bg-red-500" : "bg-yellow-500"
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
                          variant={alert.status === "Resolved" ? "secondary" : "destructive"}
                          className={
                            alert.status === "Resolved" ? "bg-gray-200 text-gray-700" : "bg-red-500 text-white"
                          }
                        >
                          {alert.status}
                        </Badge>
                        <Badge variant="outline" className="border-emerald-500 text-emerald-500 bg-emerald-50">
                          {alert.type}
                        </Badge>
                        {alert.responded && (
                          <span className="text-sm text-green-600">Responded in {alert.responseTime}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card className="bg-white/90 border border-emerald-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800">Real-time Health Monitoring</CardTitle>
                <CardDescription className="text-gray-600">Real-time location of your assigned devices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Live Map View</h3>
                    <p className="text-gray-600">Real-time GPS tracking of assigned devices would be displayed here</p>
                    <Button className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-0">
                      Enable Location Tracking
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-white/90 border border-emerald-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800">Notification Settings</CardTitle>
                <CardDescription className="text-gray-600">Configure how you receive alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800 mb-3">Alert Preferences</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2 text-gray-600">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">SMS notifications</span>
                      </label>
                      <label className="flex items-center space-x-2 text-gray-600">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Push notifications</span>
                      </label>
                      <label className="flex items-center space-x-2 text-gray-600">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Email notifications</span>
                      </label>
                      <label className="flex items-center space-x-2 text-gray-600">
                        <input type="checkbox" />
                        <span className="text-sm">Phone call for emergency alerts</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-800 mb-3">Emergency Contacts</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border border-emerald-100 rounded bg-white/80">
                        <span className="text-sm text-gray-800">Primary: +1 (555) 123-4567</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-emerald-100 rounded bg-white/80">
                        <span className="text-sm text-gray-800">Secondary: +1 (555) 987-6543</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                    >
                      Add Contact
                    </Button>
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
