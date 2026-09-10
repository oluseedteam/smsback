import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import { SchoolSettingsProvider } from './context/SchoolSettingsContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';
import AiAssistantModal from './components/AiAssistantModal';
import GuidedTourModal from './components/GuidedTourModal';

const App = () => {
  return (
    <AuthProvider>
      <SchoolSettingsProvider>
        <DialogProvider>
          <AppRoutes />
          <AiAssistantModal />
          <GuidedTourModal />
          <Toaster position="top-right" reverseOrder={false} />
        </DialogProvider>
      </SchoolSettingsProvider>
    </AuthProvider>
  );
};

export default App;