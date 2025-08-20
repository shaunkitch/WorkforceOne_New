import { Button, Card, CardHeader, CardTitle, CardContent } from "@workforceone/ui";
import { Shield, AlertTriangle, Monitor, MapPin } from "lucide-react";

export default function GuardDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">WorkforceOne Guard</h1>
            </div>
            <Button>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Security Guard Management
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Complete security patrol management with GPS tracking, incident reporting, and real-time monitoring.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Patrol Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Schedule and track security patrols with GPS verification and checkpoint scanning.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
              <CardTitle>Incident Reporting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create detailed incident reports with photos, location data, and automated escalation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Monitor className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>QR Checkpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Set up QR code checkpoints for guard verification and patrol route compliance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Live Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Real-time guard tracking, patrol status updates, and emergency response coordination.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
