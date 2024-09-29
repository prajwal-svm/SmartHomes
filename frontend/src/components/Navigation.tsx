"use client"

import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Badge } from "./ui/badge"
import { BellElectric, LampDesk, LockKeyhole, PackageSearch, Star, ThermometerSnowflake, TrendingUp } from "lucide-react"

const components = [
    {
        title: "Smart Doorbells",
        href: "/?category=Smart Doorbells",
        description: "A smart doorbell is a device that your visitors can press just like a traditional doorbell. However, that's where the similarities end.",
        icon: <BellElectric />,
    },
    {
        title: "Smart Doorlocks",
        href: "/?category=Smart Doorlocks",
        description: "A smart lock is an electromechanical lock that is designed to perform locking and unlocking operations on a door when it receives such instructions from an authorized device using a wireless protocol and a cryptographic key to execute the authorization process.",
        icon: <LockKeyhole />,
    },
    {
        title: "Smart Speakers",
        href: "/?category=Smart Speakers",
        description: "A smart speaker is a type of wireless speaker and voice command device with an integrated virtual assistant that offers interactive actions and hands-free activation with the help of one hotword.",
        icon: <LockKeyhole />,
    },
    {
        title: "Smart Lightings",
        href: "/?category=Smart Lightings",
        description: "Smart lighting is a lighting technology designed for energy efficiency. This may include high efficiency fixtures and automated controls that make adjustments based on conditions such as occupancy or daylight availability.",
        icon: <LampDesk />,
    },
    {
        title: "Smart Thermostats",
        href: "/?category=Smart Thermostats",
        description: "A smart thermostat is a thermostat that can be controlled with a phone, tablet, or other smart device. This lets you easily adjust the temperature from anywhere so your home is always the perfect temperature when you arrive.",
        icon: <ThermometerSnowflake />,
    },
    {
        title: "Accessories",
        href: "/?category=Accessories",
        description: "Smart home accessories to enhance your home experience.",
        icon: <PackageSearch />,
    }
]

export default function Navigation() {
    const userType = JSON.parse(sessionStorage.getItem('user'))?.UserType?.toLowerCase();

    return (
        <NavigationMenu className="bg-white">
            <NavigationMenuList className="bg-white">
                <NavigationMenuItem className="bg-white">
                    <NavigationMenuTrigger>Home</NavigationMenuTrigger>
                    <NavigationMenuContent className="bg-white">
                        <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                            <li className="row-span-3">
                                <NavigationMenuLink asChild>
                                    <Link
                                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                        to="/"
                                    >
                                        <Badge className="text-xs w-fit ml-auto">Hot Deal</Badge>
                                        <img src="https://images.ctfassets.net/a3peezndovsu/320kgEXiiSqrNR1UxpOYMX/0d728969cc48e750a5655ea182e61842/ring_partner_amazon_alexa_enabled_device_echo_146x146_2x.png" alt="logo" />
                                        <p className="text-sm font-medium leading-none">Smart Home Devices</p>
                                        <p className="text-xs text-muted-foreground text-normal py-2 text-left">Get the best deals on smart home devices</p>
                                    </Link>
                                </NavigationMenuLink>
                            </li>
                            <NavigationMenuLink asChild>
                                <Link
                                    className="flex h-full w-full select-none flex-row items-center justify-center gap-2 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                    to="/trending"
                                >
                                    <TrendingUp className="w-5 h-5 text-green-500 fill-green-500" />
                                    Trending
                                </Link>
                            </NavigationMenuLink>
                            <NavigationMenuLink asChild>
                                <Link
                                    className="flex h-full w-full select-none flex-row items-center justify-center gap-2 rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                                    to="/"
                                >
                                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    View Featured
                                </Link>
                            </NavigationMenuLink>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem className="bg-white">
                    <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                    <NavigationMenuContent className="bg-white">
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-white">
                            {components.map(({ title, href, description, icon }) => (
                                <ListItem key={title} title={title} href={href} icon={icon} className="text-left">
                                    {description}
                                </ListItem>
                            ))}
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                {userType === 'customer' && (
                    <NavigationMenuItem className="bg-white">
                        <NavigationMenuLink href="/orders" className={navigationMenuTriggerStyle()}>Orders</NavigationMenuLink>
                    </NavigationMenuItem>
                )}
                {userType === 'storemanager' && (
                    <NavigationMenuItem className="bg-white">
                        <NavigationMenuLink href="/catalog" className={navigationMenuTriggerStyle()}>Catalog</NavigationMenuLink>
                    </NavigationMenuItem>
                )}
                {userType === 'salesperson' && (
                    <NavigationMenuItem className="bg-white">
                        <NavigationMenuLink href="/customers" className={navigationMenuTriggerStyle()}>Customers</NavigationMenuLink>
                    </NavigationMenuItem>
                )}
            </NavigationMenuList>
        </NavigationMenu>
    )
}

const ListItem = React.forwardRef(({ className, title, href, children, icon, ...props }, ref) => (
    <li ref={ref} {...props}>
        <NavigationMenuLink asChild>
            <Link
                to={href}
                className={cn("block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground", className)}
            >
                <div className="text-sm font-medium leading-none flex items-center">
                    <span className="mr-2">{icon}</span>
                    {title}
                </div>
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
            </Link>
        </NavigationMenuLink>
    </li>
));

ListItem.displayName = "ListItem"
