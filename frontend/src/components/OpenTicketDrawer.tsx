"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Copy, Check } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

type Order = {
    id: string
    date: string
}

export default function OpenTicketDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [ticketText, setTicketText] = useState("")
    const [image, setImage] = useState<File | null>(null)
    const [ticketNumber, setTicketNumber] = useState<string | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<string>("")
    const [orders, setOrders] = useState<Order[]>([])
    const [errors, setErrors] = useState<{ [key: string]: string }>({})
    const [isCopied, setIsCopied] = useState(false)
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const user = JSON.parse(sessionStorage.getItem('user') || '{}')
                const response = await fetch('http://localhost:8080/SmartHomes/api/transactions')
                const data = await response.json()
                if (data) {
                    const userOrders = data
                        .filter((order: Order) => +order.CustomerID === +user.CustomerID)
                        .reduce((acc: { [key: string]: Order }, order: Order) => {
                            acc[order.OrderID] = {
                                id: order.OrderID,
                                date: format(new Date(order.PurchaseDate), 'MMMM d, yyyy')
                            }
                            return acc
                        }, {})
                    setOrders(Object.values(userOrders) as [])
                }
            } catch (err) {
                console.error(err)
            }
        }

        fetchOrders()
    }, [])

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {}
        if (!selectedOrder) newErrors.order = "Please select an order"
        if (!ticketText.trim()) newErrors.ticketText = "Please describe the issue"
        if (!image) newErrors.image = "Please upload an image"
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) {
            return
        }
        try {
            const formData = new FormData()
            formData.append("ticketText", ticketText)
            formData.append("image", image as File) // Add the file to the form data
            formData.append("orderId", selectedOrder)

            setLoading(true)
            const response = await fetch('http://localhost:8080/SmartHomes/api/customer-service/open-ticket', {
                method: 'POST',
                body: formData
            })
            const data = await response.json()
            setTicketNumber(data.ticketNumber)
            setLoading(false)
        } catch (err) {
            console.error(err)
            setLoading(false)
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0])
            setErrors({ ...errors, image: "" })
        }
    }

    const copyTicketNumber = async () => {
        if (ticketNumber) {
            try {
                await navigator.clipboard.writeText(ticketNumber)
                setIsCopied(true)
                toast({
                    title: "Copied!",
                    description: "Ticket number copied to clipboard.",
                    duration: 3000,
                })
                setTimeout(() => setIsCopied(false), 3000)
            } catch (err) {
                console.error('Failed to copy: ', err)
                toast({
                    title: "Error",
                    description: "Failed to copy ticket number.",
                    variant: "destructive",
                })
            }
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Open a Ticket</SheetTitle>
                    <SheetDescription>
                        Please provide details about your shipment or product issue.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <Label htmlFor="orderSelect">Order Number</Label>
                        <Select value={selectedOrder} onValueChange={(value) => {
                            setSelectedOrder(value)
                            setErrors({ ...errors, order: "" })
                        }}>
                            <SelectTrigger id="orderSelect" className="w-full">
                                <SelectValue placeholder="Select an order" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] overflow-y-auto text-left">
                                {orders.map((order) => (
                                    <SelectItem key={order.id} value={order.id} className="text-left">
                                        {`${order.id.split('-')[0]} - Placed on ${order.date}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.order && <p className="text-sm text-destructive mt-1">{errors.order}</p>}
                    </div>
                    <div>
                        <Label htmlFor="ticketText">Description</Label>
                        <Textarea
                            id="ticketText"
                            value={ticketText}
                            onChange={(e) => {
                                setTicketText(e.target.value)
                                setErrors({ ...errors, ticketText: "" })
                            }}
                            placeholder="Describe the issue with your shipment or product..."
                            className="mt-1"
                        />
                        {errors.ticketText && <p className="text-sm text-destructive mt-1">{errors.ticketText}</p>}
                    </div>
                    <div>
                        <Label htmlFor="imageUpload">Upload Image</Label>
                        <div className="mt-1 flex items-center space-x-2">
                            <Input
                                id="imageUpload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById("imageUpload")?.click()}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {image ? "Change Image" : "Select Image"}
                            </Button>
                            {image && <span className="text-sm text-muted-foreground">{image.name}</span>}
                        </div>
                        {errors.image && <p className="text-sm text-destructive mt-1">{errors.image}</p>}
                    </div>
                    {!ticketNumber && <Button type="submit" className="w-full" disabled={loading}>Submit Ticket</Button>}
                </form>
                {ticketNumber && (
                    <div className="mt-4 p-4 bg-muted rounded-md">
                        <p className="font-semibold">Your ticket has been submitted.</p>
                        <div className="flex items-center space-x-2 mt-2">
                            <p>Ticket Number: <span className="font-mono">{ticketNumber}</span></p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={copyTicketNumber}
                                aria-label="Copy ticket number"
                            >
                                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}