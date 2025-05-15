import { Ship } from "lucide-react";
import { Link } from "wouter";
import { 
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn,
  FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock 
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#0B1F3A] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Ship className="h-6 w-6 text-[#38B2AC]" />
              <span className="font-montserrat font-bold text-xl">Poopalotzi</span>
            </div>
            <p className="text-gray-300 mb-4">
              The modern solution for boat pump-out management. Serving marinas and boat owners since 2023.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-[#38B2AC] transition duration-150">
                <FaFacebookF />
              </a>
              <a href="#" className="text-gray-300 hover:text-[#38B2AC] transition duration-150">
                <FaTwitter />
              </a>
              <a href="#" className="text-gray-300 hover:text-[#38B2AC] transition duration-150">
                <FaInstagram />
              </a>
              <a href="#" className="text-gray-300 hover:text-[#38B2AC] transition duration-150">
                <FaLinkedinIn />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <a className="text-gray-300 hover:text-[#38B2AC] transition duration-150">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/services">
                  <a className="text-gray-300 hover:text-[#38B2AC] transition duration-150">Services</a>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <a className="text-gray-300 hover:text-[#38B2AC] transition duration-150">About Us</a>
                </Link>
              </li>
              <li>
                <Link href="/services">
                  <a className="text-gray-300 hover:text-[#38B2AC] transition duration-150">Pricing</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-gray-300 hover:text-[#38B2AC] transition duration-150">Contact</a>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Our Services</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/services">
                  <a className="text-gray-300 hover:text-[#38B2AC] transition duration-150">Pump-Out Services</a>
                </Link>
              </li>
              <li>
                <Link href="/services">
                  <a className="text-gray-300 hover:text-[#38B2AC] transition duration-150">Maintenance Plans</a>
                </Link>
              </li>
              <li>
                <Link href="/services">
                  <a className="text-gray-300 hover:text-[#38B2AC] transition duration-150">Marina Partnerships</a>
                </Link>
              </li>
              <li>
                <Link href="/services">
                  <a className="text-gray-300 hover:text-[#38B2AC] transition duration-150">Corporate Accounts</a>
                </Link>
              </li>
              <li>
                <Link href="/services">
                  <a className="text-gray-300 hover:text-[#38B2AC] transition duration-150">Seasonal Contracts</a>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <FaMapMarkerAlt className="mt-1 mr-2 text-[#38B2AC]" />
                <span className="text-gray-300">123 Marina Way, Seaside, CA 94955</span>
              </li>
              <li className="flex items-start">
                <FaPhoneAlt className="mt-1 mr-2 text-[#38B2AC]" />
                <span className="text-gray-300">(555) 123-4567</span>
              </li>
              <li className="flex items-start">
                <FaEnvelope className="mt-1 mr-2 text-[#38B2AC]" />
                <span className="text-gray-300">info@poopalotzi.com</span>
              </li>
              <li className="flex items-start">
                <FaClock className="mt-1 mr-2 text-[#38B2AC]" />
                <span className="text-gray-300">Mon-Fri: 8am - 5pm</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="rope-divider my-8"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Poopalotzi. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-[#38B2AC] text-sm transition duration-150">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-[#38B2AC] text-sm transition duration-150">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-[#38B2AC] text-sm transition duration-150">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
