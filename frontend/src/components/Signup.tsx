import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/Button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Signup({ setAuth }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: '',
    });
    const { toast } = useToast();

    useEffect(() => {
        if (sessionStorage.getItem('auth')) {
            window.location.href = '/';
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { email, firstName, lastName, password, role } = formData;

        try {
            const response = await fetch('http://localhost:8080/SmartHomes/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Username: email,
                    FullName: `${firstName} ${lastName}`,
                    Email: email,
                    PasswordHash: password,
                    UserType: role,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setAuth(true);
                sessionStorage.setItem('auth', 'true');
                sessionStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/';
            } else {
                toast({
                    title: "Signup Failed",
                    description: data.message,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Signup error:', error);
            toast({
                title: "Signup Error",
                description: "Unable to connect to the server. Please check your connection and try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <Card className="mx-auto max-w-sm text-left">
            <CardHeader>
                <CardTitle className="text-xl">Sign Up</CardTitle>
                <CardDescription>
                    Enter your information to create an account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="grid gap-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="first-name">First name</Label>
                            <Input
                                id="first-name"
                                name="firstName"
                                placeholder="First"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="last-name">Last name</Label>
                            <Input
                                id="last-name"
                                name="lastName"
                                placeholder="Last"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role">What's your role?</Label>
                        <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Choose One" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                                <SelectItem value="StoreManager">StoreManager</SelectItem>
                                <SelectItem value="Customer">Customer</SelectItem>
                                <SelectItem value="SalesPerson">Salesman</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full">
                        Create an account
                    </Button>
                </form>
                <div className="mt-4 text-center text-sm">
                    Already have an account?{" "}
                    <a href="/signin" className="underline">
                        Sign in
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}