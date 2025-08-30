import { Link } from "wouter";
import { 
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn,
  FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock 
} from "react-icons/fa";
// Use a relative path that works better in production
import logo from "../assets/logo.png";

export default function Footer() {
  return (
    <footer className="bg-[#0B1F3A] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <img src={logo} alt="Poopalotzi Logo" className="h-10 w-auto" />
              <span className="font-montserrat font-bold text-xl">Poopalotzi LLC</span>
            </div>
            <p className="text-gray-300 mb-4">
              The modern solution for boat pump-out management. Serving marinas and boat owners with professional marine services.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition duration-150">
                <FaFacebookF />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition duration-150">
                <FaTwitter />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition duration-150">
                <FaInstagram />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition duration-150">
                <FaLinkedinIn />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="flex flex-col items-center text-center">
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition duration-150">Home</Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-300 hover:text-white transition duration-150">Services</Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition duration-150">About Us</Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-300 hover:text-white transition duration-150">Pricing</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition duration-150">Contact</Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <FaMapMarkerAlt className="mt-1 mr-2 text-[#FF6B6B]" />
                <span className="text-gray-300">711 W. Lakeshore Dr #402, Port Clinton, OH 43452-9311</span>
              </li>
              <li className="flex items-start">
                <FaPhoneAlt className="mt-1 mr-2 text-[#FF6B6B]" />
                <span className="text-gray-300">(567) 262-6270</span>
              </li>
              <li className="flex items-start">
                <FaEnvelope className="mt-1 mr-2 text-[#FF6B6B]" />
                <span className="text-gray-300">poopalotzillc@gmail.com</span>
              </li>
              <li className="flex items-start">
                <FaClock className="mt-1 mr-2 text-[#FF6B6B]" />
                <span className="text-gray-300">Mon-Fri: 9am - 5pm</span>
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
            <a href="#" className="text-gray-400 hover:text-white text-sm transition duration-150">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition duration-150">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition duration-150">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
