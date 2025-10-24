
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 text-gray-600 text-center p-6 mt-8 border-t border-gray-200">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} La Rete del Borgo. Tutti i diritti riservati.</p>
      </div>
    </footer>
  );
};

export default Footer;