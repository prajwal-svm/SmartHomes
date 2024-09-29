import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Link } from 'react-router-dom';

export default function SignIn({ setAuth }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (sessionStorage.getItem('auth')) {
            window.location.href = '/';
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8080/SmartHomes/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                setAuth(true);
                sessionStorage.setItem('auth', 'true');
                sessionStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/';
            } else {
                toast({
                    title: "Login Failed",
                    description: data.message,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            toast({
                title: "Login Error",
                description: "Unable to connect to the server. Please check your connection and try again.",
                variant: "destructive",
            });
        }
    }

    return (
        <Card className="mx-auto max-w-sm mt-[calc(45vh/2)]">
            <CardHeader>
                <CardTitle className="text-2xl text-center">Login</CardTitle>
                <CardDescription className="text-left">
                    Enter your email below to login to your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="grid gap-4" onSubmit={handleSubmit}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="username" className="text-left">Username or Email</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter your username or email"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                    </div>
                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account? {" "}
                        <Link to="/signup" className="underline text-primary">
                            Sign up
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}