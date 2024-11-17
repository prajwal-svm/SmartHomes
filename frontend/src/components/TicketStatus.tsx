"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AlertCircle, PhoneCall, Mail, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"

type TicketResponse = {
  ticketNumber: string
  status: "Pending" | "Processing" | "Completed"
  decision: "Refund Order" | "Replace Order" | "Escalate to Human Agent"
  createdDate: string
  description: string
}

type TicketStatus = {
  code: string
  decision: string
  description: string
  action?: string
}

const TICKET_STATUSES: { [key: string]: TicketStatus } = {
  "Refund Order": {
    code: "REF",
    decision: "Refund Order",
    description: "We've processed a refund for your order. It may take 5-7 business days to appear in your account.",
    action: "Track Refund"
  },
  "Replace Order": {
    code: "REP",
    decision: "Replace Order",
    description: "We're sending a replacement for your order. You should receive it within 3-5 business days.",
    action: "Track Replacement"
  },
  "Escalate to Human Agent": {
    code: "ESC",
    decision: "Escalate to Human Agent",
    description: "Your ticket has been escalated to our customer care team. They will contact you within 24 hours.",
    action: "Contact Now"
  }
}

export default function TicketStatusDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [ticketNumber, setTicketNumber] = useState("")
  const [status, setStatus] = useState<TicketStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:8080/SmartHomes/api/customer-service/check-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticketNumber: ticketNumber.trim() })
      });

      if (!response.ok) {
        throw new Error(response.status === 404 ? "Ticket not found" : "Error checking ticket status");
      }

      const data: TicketResponse = await response.json();
      
      if (data.decision in TICKET_STATUSES) {
        setStatus({
          ...TICKET_STATUSES[data.decision],
          ticketNumber: data.ticketNumber,
          createdDate: data.createdDate,
          description: TICKET_STATUSES[data.decision].description,
          decision: TICKET_STATUSES[data.decision].decision
        });
      } else {
        setError("Invalid ticket status received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  const handleAction = async (action: string) => {
    switch (action) {
      case "track-refund":
        window.open(`/refund-status/${ticketNumber}`, "_blank");
        break;
      case "track-replacement":
        window.open(`/replacement-status/${ticketNumber}`, "_blank");
        break;
      case "phone":
        window.location.href = "tel:1-800-123-4567";
        break;
      case "email":
        window.location.href = "mailto:support@smarthomes.com";
        break;
      default:
        console.log(`Unhandled action: ${action}`);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Check Ticket Status</SheetTitle>
          <SheetDescription>
            Enter your ticket number to see its current status.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="ticketNumber">Ticket Number</Label>
            <Input
              id="ticketNumber"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="Enter your ticket number (e.g., TKT-000001)"
              className="mt-1"
              pattern="TKT-\d{6}"
              title="Please enter a valid ticket number (e.g., TKT-000001)"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Checking Status..." : "Check Status"}
          </Button>
        </form>
        
        {error && (
          <div className="mt-4 p-4 bg-destructive/15 text-destructive rounded-md flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {status && (
          <div className="mt-4 p-4 bg-blue-100 rounded-md">
            <div className="mt-4 p-4 bg-white rounded-md shadow-md">
                <p className="text-lg font-bold text-gray-800">Ticket Number: <span className="text-blue-600">{status.ticketNumber}</span></p>
                <p className="text-sm text-gray-600">Created on <span className="font-medium">{new Date(status.createdDate).toLocaleDateString()}</span></p>
                <span className="inline-block mt-2 px-3 py-1 text-sm font-semibold text-white bg-blue-500 rounded-full">{status.decision}</span>
                <p className="text-sm mt-2 text-gray-700 whitespace-pre-line">{status.description}</p>
            </div>
            {status.action && (
              <div className="mt-4">
                {status.code === "ESC" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-black text-white hover:bg-black/80">
                        <PhoneCall className="mr-2 h-4 w-4" />
                        Contact Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Contact Customer Care</DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground">
                          We're here to help. Choose your preferred method of contact.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-6 space-y-4">
                        <Card
                          className={`transition-all duration-300 ease-in-out transform hover:scale-105 ${
                            hoveredOption === "phone" ? "border-primary shadow-lg" : ""
                          }`}
                          onMouseEnter={() => setHoveredOption("phone")}
                          onMouseLeave={() => setHoveredOption(null)}
                        >
                          <CardContent className="p-4">
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-left"
                              onClick={() => handleAction("phone")}
                            >
                              <PhoneCall className="mr-4 h-5 w-5 text-primary" />
                              <div>
                                <div className="font-semibold">Call Us</div>
                                <div className="text-sm text-muted-foreground">1-800-123-4567</div>
                              </div>
                              <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
                            </Button>
                          </CardContent>
                        </Card>

                        <Card
                          className={`transition-all duration-300 ease-in-out transform hover:scale-105 ${
                            hoveredOption === "email" ? "border-primary shadow-lg" : ""
                          }`}
                          onMouseEnter={() => setHoveredOption("email")}
                          onMouseLeave={() => setHoveredOption(null)}
                        >
                          <CardContent className="p-4">
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-left"
                              onClick={() => handleAction("email")}
                            >
                              <Mail className="mr-4 h-5 w-5 text-primary" />
                              <div>
                                <div className="font-semibold">Email Us</div>
                                <div className="text-sm text-muted-foreground">support@smarthomes.com</div>
                              </div>
                              <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="mt-6 text-center text-xs text-muted-foreground">
                        Our support team is available 24/7 to assist you.
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}