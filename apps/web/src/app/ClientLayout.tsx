'use client';

import React, { useState, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { AdbDevice } from '@smart-forensic/shared';

interface DeviceContextType {
  selectedDevice: AdbDevice | null;
  setSelectedDevice: (device: AdbDevice | null) => void;
  activeCaseId: string | null;
  setActiveCaseId: (caseId: string | null) => void;
}

export const DeviceContext = createContext<DeviceContextType>({
  selectedDevice: null,
  setSelectedDevice: () => {},
  activeCaseId: null,
  setActiveCaseId: () => {}
});

export const useDevice = () => useContext(DeviceContext);

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [selectedDevice, setSelectedDevice] = useState<AdbDevice | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  if (pathname === '/login' || pathname === '/logout') return <>{children}</>;

  return (
    <DeviceContext.Provider value={{ selectedDevice, setSelectedDevice, activeCaseId, setActiveCaseId }}>
      <Navbar selectedDevice={selectedDevice} onSelectDevice={setSelectedDevice} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </DeviceContext.Provider>
  );
};
