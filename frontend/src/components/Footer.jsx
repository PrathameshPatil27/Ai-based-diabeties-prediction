import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="text-lg font-bold">DiabetesCare</span>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-gray-400">
              @ All rights reserved.
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Empowering health through AI-driven diabetes prediction and care.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;