import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TeacherSidebar from '../components/TeacherSidebar'
import Header from '../components/Header'

const TeacherLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className='flex min-h-screen bg-gray-100 relative'>
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar container */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out`}>
        <TeacherSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className='flex-1 p-4 md:p-6 w-full max-w-full overflow-hidden'>
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className='font-Dm-sans'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default TeacherLayout