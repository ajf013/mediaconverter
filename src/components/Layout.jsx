import React from 'react';
import Header from './Header';
import Footer from './Footer/Footer';
import { ThemeProvider } from '../context/ThemeContext';

const Layout = ({ children }) => {
    return (
        <ThemeProvider>
            <Header />
            <main className="page-container">
                {children}
            </main>
            <Footer />
        </ThemeProvider>
    );
};

export default Layout;
