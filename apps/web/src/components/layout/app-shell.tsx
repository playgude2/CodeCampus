import { Outlet } from 'react-router-dom';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';

export function AppShell() {
  return (
    <div className="flex h-svh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="custom-scrollbar flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
