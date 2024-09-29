'use client'

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    CircleUser,
    Menu,
    Package2,
    Search,
    ShoppingCart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import Navigation from "./Navigation";
import Product from "./Product";

export default function Dashboard({ products }) {
    const [_products, setProducts] = useState(products);
    const [cart, setCart] = useState(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        return user?.cart || {};
    });
    const [sortOption, setSortOption] = useState("default");
    const [starFilter, setStarFilter] = useState("all");

    const router = useLocation();
    const category = new URLSearchParams(router.search).get('category');

    const handleCartUpdate = (id: string | number, quantity: number) => {
        setCart(prevCart => {
            const total = (prevCart[id]?.quantity || 0) + quantity;
            const newCart = { ...prevCart };

            if (total < 1) {
                delete newCart[id];
            } else {
                newCart[id] = { quantity: total };
            }

            const user = JSON.parse(sessionStorage.getItem('user'));
            user.cart = newCart;
            sessionStorage.setItem('user', JSON.stringify(user));

            return newCart;
        });
    };

    const debounceSearch = (value) => {
        const search = value.toLowerCase();
        const filteredProducts = products.filter(product =>
            product.ProductModelName.toLowerCase().includes(search)
        );
        setProducts(filteredProducts);
    };

    const sortProducts = (option) => {
        const sortedProducts = [..._products];
        switch (option) {
            case "price-high-low":
                sortedProducts.sort((a, b) => b.ProductPrice - a.ProductPrice);
                break;
            case "price-low-high":
                sortedProducts.sort((a, b) => a.ProductPrice - b.ProductPrice);
                break;
            case "rating-high-low":
                sortedProducts.sort((a, b) => b.RatingAvg - a.RatingAvg);
                break;
            default:
                break;
        }
        setProducts(sortedProducts);
    };

    const filterByStars = (stars) => {
        if (stars === "all") {
            setProducts(products);
        } else {
            const filtered = products.filter(product => Math.floor(product.RatingAvg) === parseInt(stars));
            setProducts(filtered);
        }
    };

    useEffect(() => {
        sortProducts(sortOption);
    }, [sortOption]);

    useEffect(() => {
        filterByStars(starFilter);
    }, [starFilter]);

    if (products.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-screen w-full flex-col"
            >
                <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
                    <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                        <Link to="#" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                            <Package2 className="h-6 w-6 text-black" />
                            <span className="sr-only">SmartHomes</span>
                        </Link>
                        <Navigation />
                    </nav>
                    <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4"></div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-6 pr-6">
                            <h1 className="text-2xl font-bold">{category || "Featured Products"}</h1>
                            <div className="flex gap-4">
                                <Select value={starFilter} onValueChange={setStarFilter}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Filter by stars" />
                                    </SelectTrigger>
                                    <SelectContent className="w-[160px]">
                                        <SelectItem value="all">All Ratings</SelectItem>
                                        <SelectItem value="5" className="flex items-center gap-2"><span className="text-yellow-400">★★★★★</span><span className="text-muted-foreground text-xs"> (5)</span></SelectItem>
                                        <SelectItem value="4" className="flex items-center gap-2"><span className="text-yellow-400">★★★★</span><span className="text-gray-200">★</span><span className="text-muted-foreground text-xs"> (4+)</span></SelectItem>
                                        <SelectItem value="3" className="flex items-center gap-2"><span className="text-yellow-400">★★★</span><span className="text-gray-200">★★</span><span className="text-muted-foreground text-xs"> (3+)</span></SelectItem>
                                        <SelectItem value="2" className="flex items-center gap-2"><span className="text-yellow-400">★★</span><span className="text-gray-200">★★★</span><span className="text-muted-foreground text-xs"> (2+)</span></SelectItem>
                                        <SelectItem value="1" className="flex items-center gap-2"><span className="text-yellow-400">★</span><span className="text-gray-200">★★★★</span><span className="text-muted-foreground text-xs"> (1+)</span></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-lg text-center text-muted-foreground"
                        >
                            Fetching {category}...
                        </motion.p>
                    </div>
                </main>
                <footer className="flex items-center justify-center h-16 bg-background text-muted-foreground">
                    <p className="text-sm text-center">&copy; 2024 SmartHomes. All rights reserved.</p>
                </footer>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-screen w-full flex-col"
        >
            <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
                <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                    <Link to="#" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                        <Package2 className="h-6 w-6 text-black" />
                        <span className="sr-only">SmartHomes</span>
                    </Link>
                    <Navigation />
                </nav>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" />
                </Sheet>
                <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                    <form className="ml-auto flex-1 sm:flex-initial">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search products..."
                                className="pl-8 w-[500px] rounded-full"
                                onChange={(e) => debounceSearch(e.target.value)}
                            />
                        </div>
                    </form>
                    <div className="flex items-center gap-4 relative ml-auto">
                        <Link to="/cart" className="rounded-full relative p-2 bg-secondary">
                            <ShoppingCart className="h-5 w-5" />
                            <Badge className="absolute -top-2 -right-1 px-[6px]" variant="destructive">
                                {Object.values(cart).reduce((acc, item) => acc + item.quantity, 0)}
                            </Badge>
                            <span className="sr-only">View cart</span>
                        </Link>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-2 border-l pl-4">
                                <Button variant="secondary" size="icon" className="rounded-full">
                                    <CircleUser className="h-5 w-5" />
                                    <span className="sr-only">Toggle user menu</span>
                                </Button>
                                <div className="text-sm font-medium text-left">
                                    {sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')).FullName : 'Guest'}
                                    <div className="text-xs text-muted-foreground text-left capitalize">
                                        {sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')).UserType : ''}
                                    </div>
                                </div>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-[60]">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                                sessionStorage.removeItem('auth');
                                sessionStorage.removeItem('user');
                                window.location.href = '/signin';
                            }}>Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="p-4">
                    <div className="flex justify-between items-center mb-6 pr-6">
                        <h1 className="text-2xl font-bold">{category || "Featured Products"}</h1>
                        <div className="flex gap-4">
                            <Select value={starFilter} onValueChange={setStarFilter}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Filter by stars" />
                                </SelectTrigger>
                                <SelectContent className="w-[160px]">
                                    <SelectItem value="all">All Ratings</SelectItem>
                                    <SelectItem value="5" className="flex items-center gap-2"><span className="text-yellow-400">★★★★★</span><span className="text-muted-foreground text-xs"> (5)</span></SelectItem>
                                    <SelectItem value="4" className="flex items-center gap-2"><span className="text-yellow-400">★★★★</span><span className="text-gray-200">★</span><span className="text-muted-foreground text-xs"> (4+)</span></SelectItem>
                                    <SelectItem value="3" className="flex items-center gap-2"><span className="text-yellow-400">★★★</span><span className="text-gray-200">★★</span><span className="text-muted-foreground text-xs"> (3+)</span></SelectItem>
                                    <SelectItem value="2" className="flex items-center gap-2"><span className="text-yellow-400">★★</span><span className="text-gray-200">★★★</span><span className="text-muted-foreground text-xs"> (2+)</span></SelectItem>
                                    <SelectItem value="1" className="flex items-center gap-2"><span className="text-yellow-400">★</span><span className="text-gray-200">★★★★</span><span className="text-muted-foreground text-xs"> (1+)</span></SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sortOption} onValueChange={setSortOption}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Default</SelectItem>
                                    <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                                    <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                                    <SelectItem value="rating-high-low">Rating: High to Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {_products.length === 0 && (
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-lg text-center text-muted-foreground"
                        >
                            No products found
                        </motion.p>
                    )}
                    <AnimatePresence>
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: {
                                    transition: {
                                        staggerChildren: 0.1
                                    }
                                }
                            }}
                        >
                            {_products.filter(product => product.ProductCategory === category || !category).map(product => (
                                <motion.div
                                    key={product.ProductID}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                >
                                    <Product
                                        {...product}
                                        setCart={handleCartUpdate}
                                        quantity={cart[product.ProductID]?.quantity || 0}
                                        products={products}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
            <footer className="flex items-center justify-center h-16 bg-background text-muted-foreground">
                <p className="text-sm text-center">&copy; 2024 SmartHomes. All rights reserved.</p>
            </footer>
        </motion.div>
    );
}