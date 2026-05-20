import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import Dashboard from '../pages/Dashboard';
import Inventory from '../pages/Inventory';
import POS from '../pages/POS';
import Add from '../pages/Add';
import Sales from '../pages/Sales';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import Stock from '../pages/Stock';

const AppRouter = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<SignIn />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route
                    path="/dashboard"
                    element={
                        <MainLayout>
                            <Dashboard />
                        </MainLayout>
                    }
                />

                <Route
                    path="/inventory"
                    element={
                        <MainLayout>
                            <Inventory />
                        </MainLayout>
                    }
                />

            
                <Route path="/inventory/add" element={
                <MainLayout>
                    <Add />
                </MainLayout>
                }/>

                <Route
                    path="/stock"
                    element={
                        <MainLayout>
                            <Stock />
                        </MainLayout>
                    }
                />
                
                <Route
                    path="/pos"
                    element={
                        <MainLayout>
                            <POS />
                        </MainLayout>
                    }
                />

                <Route
                    path="/sales"
                    element={
                        <MainLayout>
                            <Sales />
                        </MainLayout>
                    }
                />

            </Routes>
        </Router>
    );
};

export default AppRouter;