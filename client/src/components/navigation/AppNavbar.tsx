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
// Use a relative path that should work better in production
import logoImage from "../../assets/logo.png";

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
            <Link to="/">
              <div className="flex items-center">
                <img src={logoImage} alt="Poopalotzi Logo" className="h-14 w-auto object-contain py-1" />
                <span className="font-montserrat font-bold text-xl ml-2">Poopalotzi</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {navLinks.map((link) => (
              <Link 
                to={link.href} 
                key={link.name}
                className={`text-white hover:text-white hover:opacity-80 transition duration-150 font-opensans ${
                  location === link.href ? "font-semibold" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 bg-[#D2B48C] text-black hover:bg-[#C4A87A]">
                      <AvatarFallback className="text-black font-semibold">{getInitials(user.firstName)}</AvatarFallback>
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
                      <Link to="/member/dashboard">
                        <DropdownMenuItem className="cursor-pointer">
                          Dashboard
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/member/boats">
                        <DropdownMenuItem className="cursor-pointer">
                          My Boats
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/member/request-service">
                        <DropdownMenuItem className="cursor-pointer">
                          Request Pump-Out
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/member/service-history">
                        <DropdownMenuItem className="cursor-pointer">
                          Service History
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/member/subscription">
                        <DropdownMenuItem className="cursor-pointer">
                          Service Plans
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/member/profile">
                        <DropdownMenuItem className="cursor-pointer">
                          Profile
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  
                  {/* Employee Links */}
                  {isEmployee && (
                    <>
                      <Link to="/employee/schedule">
                        <DropdownMenuItem className="cursor-pointer">
                          My Schedule
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/employee/manual-entry">
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
                      <Link to="/admin/dashboard">
                        <DropdownMenuItem className="cursor-pointer">
                          Admin Dashboard
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/admin/customers">
                        <DropdownMenuItem className="cursor-pointer">
                          Customers
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/admin/marinas">
                        <DropdownMenuItem className="cursor-pointer">
                          Marinas
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/admin/requests">
                        <DropdownMenuItem className="cursor-pointer">
                          Requests
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/admin/calendar">
                        <DropdownMenuItem className="cursor-pointer">
                          Calendar
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/admin/service-levels">
                        <DropdownMenuItem className="cursor-pointer">
                          Service Levels
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/admin/manual-service-form">
                        <DropdownMenuItem className="cursor-pointer">
                          Manual Service Entry
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
                <Link 
                  to={link.href} 
                  key={link.name}
                  className={`text-white hover:text-white hover:opacity-80 py-2 transition duration-150 font-opensans ${
                    location === link.href ? "font-semibold" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              
              {user ? (
                <>
                  <div className="py-2 border-t border-gray-700 mt-2"></div>
                  
                  {/* Member Links */}
                  {user.role === 'member' && (
                    <>
                      <Link 
                        to="/member/dashboard"
                        className="text-white hover:text-white hover:opacity-80 py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/member/boats"
                        className="text-white hover:text-white hover:opacity-80 py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Boats
                      </Link>
                      <Link 
                        to="/member/request-service"
                        className="text-white hover:text-white hover:opacity-80 py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Request Pump-Out
                      </Link>
                      <Link 
                        to="/member/service-history"
                        className="text-white hover:text-white hover:opacity-80 py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Service History
                      </Link>
                      <Link 
                        to="/member/subscription"
                        className="text-white hover:text-white hover:opacity-80 py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Service Plans
                      </Link>
                      <Link 
                        to="/member/profile"
                        className="text-white hover:text-white hover:opacity-80 py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                    </>
                  )}
                  
                  {/* Employee Links */}
                  {isEmployee && (
                    <>
                      <Link 
                        to="/employee/schedule"
                        className="text-white hover:text-white hover:opacity-80 py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Schedule
                      </Link>
                      <Link 
                        to="/employee/manual-entry"
                        className="text-white hover:text-white hover:opacity-80 py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Manual Entry
                      </Link>
                    </>
                  )}
                  
                  {/* Admin Links */}
                  {isAdmin && (
                    <>
                      <div className="py-2 border-t border-gray-700"></div>
                      <Link to="/admin/dashboard">
                        <a className="text-white hover:text-white hover:opacity-80 py-2" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</a>
                      </Link>
                      <Link to="/admin/customers">
                        <a className="text-white hover:text-white hover:opacity-80 py-2" onClick={() => setMobileMenuOpen(false)}>Customers</a>
                      </Link>
                      <Link to="/admin/marinas">
                        <a className="text-white hover:text-white hover:opacity-80 py-2" onClick={() => setMobileMenuOpen(false)}>Marinas</a>
                      </Link>
                      <Link to="/admin/requests">
                        <a className="text-white hover:text-white hover:opacity-80 py-2" onClick={() => setMobileMenuOpen(false)}>Requests</a>
                      </Link>
                      <Link to="/admin/calendar">
                        <a className="text-white hover:text-white hover:opacity-80 py-2" onClick={() => setMobileMenuOpen(false)}>Calendar</a>
                      </Link>
                      <Link to="/admin/service-levels">
                        <a className="text-white hover:text-white hover:opacity-80 py-2" onClick={() => setMobileMenuOpen(false)}>Service Levels</a>
                      </Link>
                      <Link to="/admin/manual-service-form">
                        <a className="text-white hover:text-white hover:opacity-80 py-2" onClick={() => setMobileMenuOpen(false)}>Manual Service Entry</a>
                      </Link>
                    </>
                  )}
                  
                  <div className="py-2 border-t border-gray-700"></div>
                  <button
                    onClick={handleLogout}
                    className="text-white hover:text-white hover:opacity-80 py-2 text-left"
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
