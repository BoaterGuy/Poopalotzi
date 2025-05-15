import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AuthModal } from "../auth/AuthModal";
import logoImage from "@/assets/poopalotzi-logo.jpg";

export default function AppNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, logout, isAdmin, isEmployee } = useAuth();
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="bg-[#0B1F3A] text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center">
                <img src={logoImage} alt="Poopalotzi Logo" className="h-14 w-auto object-contain py-1" />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {navLinks.map((link) => (
              <Link href={link.href} key={link.name}>
                <a
                  className={`text-white hover:text-[#38B2AC] transition duration-150 font-opensans ${
                    location === link.href ? "text-[#38B2AC]" : ""
                  }`}
                >
                  {link.name}
                </a>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 bg-[#38B2AC]">
                      <AvatarFallback>{getInitials(user.firstName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium">{`${user.firstName} ${user.lastName}`}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Member Links */}
                  {user.role === 'member' && (
                    <>
                      <Link href="/member/dashboard">
                        <DropdownMenuItem className="cursor-pointer">
                          Dashboard
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/member/boats">
                        <DropdownMenuItem className="cursor-pointer">
                          My Boats
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/member/request-service">
                        <DropdownMenuItem className="cursor-pointer">
                          Request Pump-Out
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/member/service-history">
                        <DropdownMenuItem className="cursor-pointer">
                          Service History
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/member/subscription">
                        <DropdownMenuItem className="cursor-pointer">
                          Service Plans
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/member/profile">
                        <DropdownMenuItem className="cursor-pointer">
                          Profile
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  
                  {/* Employee Links */}
                  {isEmployee && (
                    <>
                      <Link href="/employee/schedule">
                        <DropdownMenuItem className="cursor-pointer">
                          My Schedule
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/employee/manual-entry">
                        <DropdownMenuItem className="cursor-pointer">
                          Manual Entry
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  
                  {/* Admin Links */}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <Link href="/admin/dashboard">
                        <DropdownMenuItem className="cursor-pointer">
                          Admin Dashboard
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/admin/customers">
                        <DropdownMenuItem className="cursor-pointer">
                          Customers
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/admin/marinas">
                        <DropdownMenuItem className="cursor-pointer">
                          Marinas
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/admin/requests">
                        <DropdownMenuItem className="cursor-pointer">
                          Requests
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/admin/calendar">
                        <DropdownMenuItem className="cursor-pointer">
                          Calendar
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/admin/service-levels">
                        <DropdownMenuItem className="cursor-pointer">
                          Service Levels
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => setAuthModalOpen(true)} 
                className="bg-[#FF6B6B] hover:bg-opacity-90 text-white px-4 py-2 rounded-md font-semibold transition duration-150 hidden md:block"
              >
                Sign In
              </Button>
            )}
            <button
              className="md:hidden text-gray-200 hover:text-white"
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link href={link.href} key={link.name}>
                  <a
                    className={`text-white hover:text-[#38B2AC] py-2 transition duration-150 font-opensans ${
                      location === link.href ? "text-[#38B2AC]" : ""
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                </Link>
              ))}
              
              {user ? (
                <>
                  <div className="py-2 border-t border-gray-700 mt-2"></div>
                  
                  {/* Member Links */}
                  {user.role === 'member' && (
                    <>
                      <Link href="/member/dashboard">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
                      </Link>
                      <Link href="/member/boats">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>My Boats</a>
                      </Link>
                      <Link href="/member/request-service">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>Request Pump-Out</a>
                      </Link>
                      <Link href="/member/service-history">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>Service History</a>
                      </Link>
                      <Link href="/member/subscription">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>Service Plans</a>
                      </Link>
                      <Link href="/member/profile">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>Profile</a>
                      </Link>
                    </>
                  )}
                  
                  {/* Employee Links */}
                  {isEmployee && (
                    <>
                      <Link href="/employee/schedule">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>My Schedule</a>
                      </Link>
                      <Link href="/employee/manual-entry">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>Manual Entry</a>
                      </Link>
                    </>
                  )}
                  
                  {/* Admin Links */}
                  {isAdmin && (
                    <>
                      <div className="py-2 border-t border-gray-700"></div>
                      <Link href="/admin/dashboard">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</a>
                      </Link>
                      <Link href="/admin/customers">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>Customers</a>
                      </Link>
                      <Link href="/admin/marinas">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>Marinas</a>
                      </Link>
                      <Link href="/admin/requests">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>Requests</a>
                      </Link>
                      <Link href="/admin/calendar">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>Calendar</a>
                      </Link>
                      <Link href="/admin/service-levels">
                        <a className="text-white hover:text-[#38B2AC] py-2" onClick={() => setMobileMenuOpen(false)}>Service Levels</a>
                      </Link>
                    </>
                  )}
                  
                  <div className="py-2 border-t border-gray-700"></div>
                  <button
                    onClick={handleLogout}
                    className="text-white hover:text-[#38B2AC] py-2 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="bg-[#FF6B6B] hover:bg-opacity-90 text-white px-4 py-2 rounded-md font-semibold transition duration-150 w-full mt-2"
                >
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
      
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  );
}
