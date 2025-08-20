import { Button, Card, CardHeader, CardTitle, CardContent } from "@workforceone/ui";
import { Users, MapPin, CheckSquare, Building } from "lucide-react";

export default function RemoteDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">WorkforceOne Remote</h1>
            </div>
            <Button>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Remote Workforce Management
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Manage distributed teams, assign tasks, track projects, and optimize routes - all from one platform.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Organize teams, assign roles, and manage your distributed workforce effectively.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckSquare className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Task Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create, assign, and track tasks with real-time progress updates and notifications.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Route Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Optimize daily routes for field workers with GPS tracking and turn-by-turn navigation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Building className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Multi-Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage multiple office locations, outlets, and remote work sites seamlessly.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
