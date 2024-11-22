import { Facebook, Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className=" text-slate-300 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-4 mb-4 md:mb-0">
            <a href="#" className="hover:text-white">
              <Facebook size={25} />
            </a>
            <a href="#" className="hover:text-white">
              <Twitter size={25} />
            </a>
            <a href="#" className="hover:text-white">
              <Linkedin size={25} />
            </a>
            <a href="#" className="hover:text-white">
              <Github size={25} />
            </a>
          </div>
          <div className="text-md mb-4 md:mb-0">
            © 2024 BridgeNLP All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
