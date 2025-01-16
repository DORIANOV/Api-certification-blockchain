import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Transactions } from './pages/Transactions';
import { Works } from './pages/Works';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { theme } from './theme';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppLayout = ({ children }) => {
  return (
    <Box display="flex" h="100vh">
      <Sidebar />
      <Box flex="1" p="6" bg="gray.50" overflowY="auto">
        {children}
      </Box>
    </Box>
  );
};

export const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Users />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Transactions />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/works"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Works />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
};
