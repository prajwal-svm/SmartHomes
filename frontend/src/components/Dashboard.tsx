'use client'

import { useState, useEffect, useRef, KeyboardEvent, MouseEvent } from "react";
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
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
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
import OpenTicketDrawer from "./OpenTicketDrawer";
import TicketStatusDrawer from "./TicketStatus";

interface Suggestion {
    productModelName: string;
    productCategory?: string;
}

const SuggestionDropdown = ({
    suggestions,
    onSelect,
    searchQuery,
    highlightedIndex
}: {
    suggestions: Suggestion[],
    onSelect: (suggestion: Suggestion) => void,
    searchQuery: string,
    highlightedIndex: number
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full top-[50px] bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden"
        >
            <ul className="max-h-60 overflow-auto text-sm">
                {suggestions.map((suggestion, index) => {
                    const matchIndex = suggestion.productModelName.toLowerCase().indexOf(searchQuery.toLowerCase());
                    const beforeMatch = suggestion.productModelName.slice(0, matchIndex);
                    const match = suggestion.productModelName.slice(matchIndex, matchIndex + searchQuery.length);
                    const afterMatch = suggestion.productModelName.slice(matchIndex + searchQuery.length);

                    return (
                        <motion.li
                            key={index}
                            className={`px-4 py-2 cursor-pointer flex items-center justify-between ${highlightedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                            onClick={() => onSelect(suggestion)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div>
                                <Search className="inline-block h-4 w-4 mr-2 text-gray-400" />
                                {beforeMatch}
                                <span className="font-semibold">{match}</span>
                                {afterMatch}
                            </div>
                            <span className="text-xs text-gray-400">{suggestion.productCategory}</span>
                        </motion.li>
                    );
                })}
            </ul>
            {suggestions.length > 0 && (
                <div className="px-4 py-2 text-xs text-gray-500 border-t">
                    Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">↓</kbd> to navigate, <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">Enter</kbd> to select
                </div>
            )}
        </motion.div>
    );
};

interface DashboardProps {
    products: any[];
}

export default function Dashboard({ products }: DashboardProps) {
    const [_products, setProducts] = useState<any[]>(products);
    const [filteredProducts, setFilteredProducts] = useState<any[]>(products);
    const [cart, setCart] = useState<{ [key: string]: { quantity: number } }>(() => {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        return user?.cart || {};
    });
    const [sortOption, setSortOption] = useState<string>("default");
    const [starFilter, setStarFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [openTicketDrawerOpen, setOpenTicketDrawerOpen] = useState(false)
    const [ticketStatusDrawerOpen, setTicketStatusDrawerOpen] = useState(false)

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

            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            user.cart = newCart;
            sessionStorage.setItem('user', JSON.stringify(user));

            return newCart;
        });
    };

    const handleSearch = async (value: string) => {
        const search = value.toLowerCase();
        setSearchQuery(search);
        if (search.length < 2) {
            setSuggestions([]);
            setFilteredProducts(_products);
            return;
        }
        const response = await fetch(`http://localhost:8080/SmartHomes/search-products?query=${encodeURIComponent(search)}`);
        if (response.ok) {
            const suggestions = await response.json();
            setSuggestions(suggestions);
        } else {
            console.error('Error fetching product suggestions');
            setSuggestions([]);
        }
    };

    const filterProducts = (query: string) => {
        const filtered = _products.filter(product =>
            product.ProductModelName.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredProducts(filtered);
    };

    const handleSuggestionSelect = (suggestion: Suggestion) => {
        setSearchQuery(suggestion.productModelName);
        setSuggestions([]);
        if (searchInputRef.current) {
            searchInputRef.current.value = suggestion.productModelName;
        }
        filterProducts(suggestion.productModelName);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestions[highlightedIndex]) {
                handleSuggestionSelect(suggestions[highlightedIndex]);
            } else {
                filterProducts(searchQuery);
            }
        }
    };

    const sortProducts = (option: string) => {
        const sortedProducts = [...filteredProducts];
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
        setFilteredProducts(sortedProducts);
    };

    const filterByStars = (stars: string) => {
        if (stars === "all") {
            setFilteredProducts(_products);
        } else {
            const filtered = _products.filter(product => Math.floor(product.RatingAvg) === parseInt(stars));
            setFilteredProducts(filtered);
        }
    };

    useEffect(() => {
        sortProducts(sortOption);
    }, [sortOption]);

    useEffect(() => {
        filterByStars(starFilter);
    }, [starFilter]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
                setSuggestions([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
                    <form className="ml-auto flex-1 sm:flex-initial relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search products..."
                            className="pl-8 w-[500px] rounded-full"
                            onChange={(e) => handleSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            ref={searchInputRef}
                        />
                        <AnimatePresence>
                            {suggestions.length > 0 && (
                                <SuggestionDropdown
                                    suggestions={suggestions}
                                    onSelect={handleSuggestionSelect}
                                    searchQuery={searchQuery}
                                    highlightedIndex={highlightedIndex}
                                />
                            )}
                        </AnimatePresence>
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
                                    {sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user') || '{}').FullName : 'Guest'}
                                    <div className="text-xs text-muted-foreground text-left capitalize">
                                        {sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user') || '{}').UserType : ''}
                                    </div>
                                </div>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px] z-[60] cursor-pointer">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="cursor-pointer">
                                    <span>Customer Service</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem asChild className="cursor-pointer" onSelect={() => setOpenTicketDrawerOpen(true)}>
                                        <span>Open a Ticket</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild className="cursor-pointer" onSelect={() => setTicketStatusDrawerOpen(true)}>
                                        <span>Status of a Ticket</span>
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem onClick={() => {
                                sessionStorage.removeItem('auth');
                                sessionStorage.removeItem('user');
                                window.location.href = '/signin';
                            }} className="cursor-pointer">Logout</DropdownMenuItem>
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
                                    <SelectItem value="1" className="flex items-center  gap-2"><span className="text-yellow-400">★</span><span className="text-gray-200">★★★★</span><span className="text-muted-foreground text-xs"> (1+)</span></SelectItem>
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
                    {filteredProducts.length === 0 && (
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
                            {filteredProducts.filter(product => product.ProductCategory === category || !category).map(product => (
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
            {openTicketDrawerOpen && <OpenTicketDrawer
                isOpen={openTicketDrawerOpen}
                onClose={() => setOpenTicketDrawerOpen(false)}
            />}
            {ticketStatusDrawerOpen && <TicketStatusDrawer
                isOpen={ticketStatusDrawerOpen}
                onClose={() => setTicketStatusDrawerOpen(false)}
            />}
        </motion.div>
    );
}