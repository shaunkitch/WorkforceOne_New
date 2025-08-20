import { Button, Card, CardHeader, CardTitle, CardContent } from "@workforceone/ui";
import { Clock, Calendar, BarChart3, UserCheck } from "lucide-react";

export default function TimeDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">WorkforceOne Time</h1>
            </div>
            <Button>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Time Tracking & Attendance
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Accurate time tracking, attendance management, and payroll reporting for your entire workforce.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <Clock className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>GPS Time Clock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Location-verified clock in/out with GPS tracking and geofencing capabilities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Attendance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor attendance patterns, late arrivals, and absences with detailed reporting.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <UserCheck className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Leave Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Handle leave requests, vacation scheduling, and PTO balances effortlessly.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Payroll Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Export detailed timesheets and payroll data for seamless payroll processing.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
