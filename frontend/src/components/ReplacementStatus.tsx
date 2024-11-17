"use client"

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Truck, 
  PhoneCall, 
  ArrowLeft, 
  ExternalLink,
  Package,
  Calendar,
  FileText,
  Activity
} from "lucide-react"

interface TicketInfo {
  ticketNumber: string
  status: "Pending" | "Processing" | "Completed"
  decision: "Refund Order" | "Replace Order" | "Escalate to Human Agent"
  createdDate: string
  description: string
  transactionDetails?: {
    productName: string
    orderDate: string
    estimatedDelivery?: string
    trackingNumber?: string
  }
}

export default function ReplacementStatus() {
  const { ticketNumber } = useParams<{ ticketNumber: string }>()
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTicketStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8080/SmartHomes/api/customer-service/check-status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ticketNumber })
        });

        if (!response.ok) {
          throw new Error(response.status === 404 ? "Ticket not found" : "Failed to fetch ticket status");
        }

        const data = await response.json();
        setTicketInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ticket status. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    if (ticketNumber) {
      fetchTicketStatus();
    }
  }, [ticketNumber]);

  const StatusStep = ({ label, completed, current }: { label: string; completed: boolean; current: boolean }) => (
    <div className="flex flex-col items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        completed ? 'bg-green-500 text-white' : 
        current ? 'bg-blue-500 text-white' : 
        'bg-gray-200 text-gray-500'
      }`}>
        {completed ? <CheckCircle className="h-5 w-5" /> : 
         current ? <Activity className="h-5 w-5" /> : 
         <Clock className="h-5 w-5" />}
      </div>
      <span className={`text-sm mt-2 ${current ? 'font-semibold text-blue-600' : 'text-gray-600'}`}>
        {label}
      </span>
    </div>
  );

  const StatusTimeline = ({ status }: { status: string }) => {
    const steps = ['Pending', 'Processing', 'Completed'];
    const currentIndex = steps.indexOf(status);

    return (
      <div className="w-full pt-6 pb-2">
        <div className="relative flex justify-between">
          {steps.map((step, index) => (
            <StatusStep
              key={step}
              label={step}
              completed={index < currentIndex}
              current={index === currentIndex}
            />
          ))}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" style={{ zIndex: -1 }}>
            <div 
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${getProgressValue(status)}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  const InfoRow = ({ icon, label, value, link }: { icon: React.ReactNode; label: string; value: string; link?: string }) => (
    <div className="flex items-center space-x-3 py-2">
      <div className="text-gray-500">{icon}</div>
      <div className="flex-1">
        <div className="text-sm text-gray-500">{label}</div>
        {link ? (
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center"
          >
            {value}
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        ) : (
          <div className="font-medium">{value}</div>
        )}
      </div>
    </div>
  );

  const getStatusColor = (status: string, decision: string) => {
    if (decision !== "Replace Order") {
      return "bg-red-100 text-red-800 border-red-300";
    }
    
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Processing":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  }

  const getProgressValue = (status: string) => {
    switch (status) {
      case "Pending":
        return 33;
      case "Processing":
        return 66;
      case "Completed":
        return 100;
      default:
        return 0;
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <Card className="border-2 shadow-lg">
          <div className="p-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
            <Skeleton className="h-20 w-full mt-6" />
          </div>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <Card className="border-2 border-red-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!ticketInfo || ticketInfo.decision !== "Replace Order") {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <Card className="border-2 border-yellow-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-yellow-600 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Replacement Not Found
            </CardTitle>
            <CardDescription className="text-yellow-600">
              {ticketInfo 
                ? "This ticket is not for a replacement order." 
                : `No ticket information found for ${ticketNumber}`}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              onClick={() => window.history.back()} 
              variant="outline" 
              className="border-yellow-300 text-yellow-600 hover:bg-yellow-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card className="border-2 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800">Replacement Status</h3>
              <p className="text-gray-600 mt-1">Ticket #{ticketInfo.ticketNumber}</p>
            </div>
            <Badge 
              className={`${getStatusColor(ticketInfo.status, ticketInfo.decision)} 
                px-4 py-1 text-sm font-semibold rounded-full shadow-sm`}
            >
              {ticketInfo.status}
            </Badge>
          </div>
          <StatusTimeline status={ticketInfo.status} />
        </div>

        <CardContent className="p-6 space-y-6 text-left">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Issue Details</h4>
            <div className="space-y-3">
              <InfoRow 
                icon={<FileText className="h-5 w-5" />}
                label="Description"
                value={ticketInfo.description}
              />
              <InfoRow 
                icon={<Calendar className="h-5 w-5" />}
                label="Date Requested"
                value={new Date(ticketInfo.createdDate).toLocaleDateString()}
              />
            </div>
          </div>

          {ticketInfo.transactionDetails && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Product Information</h4>
              <div className="space-y-3">
                <InfoRow 
                  icon={<Package className="h-5 w-5" />}
                  label="Product"
                  value={ticketInfo.transactionDetails.productName}
                />
                {ticketInfo.transactionDetails.estimatedDelivery && (
                  <InfoRow 
                    icon={<Truck className="h-5 w-5" />}
                    label="Estimated Delivery"
                    value={ticketInfo.transactionDetails.estimatedDelivery}
                  />
                )}
                {ticketInfo.transactionDetails.trackingNumber && (
                  <InfoRow 
                    icon={<Activity className="h-5 w-5" />}
                    label="Tracking Number"
                    value={ticketInfo.transactionDetails.trackingNumber}
                    link={`http://localhost:8080/SmartHomes/track/${ticketInfo.transactionDetails.trackingNumber}`}
                  />
                )}
              </div>
            </div>
          )}

          {ticketInfo.status === "Processing" && !ticketInfo.transactionDetails?.trackingNumber && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <Clock className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                Tracking information will be available once your replacement is shipped.
                We'll notify you via email when this happens.
              </p>
            </div>
          )}
        </CardContent>

        <Separator />

        <CardFooter className="flex justify-between p-6 bg-gray-50">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/"}
            className="border-gray-300 hover:bg-gray-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700" 
            onClick={() => window.location.href = "tel:1-800-123-4567"}
          >
            <PhoneCall className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}