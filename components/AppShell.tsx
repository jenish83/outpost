"use client"

import { usePathname } from 'next/navigation';
import React from 'react'
import { SiteHeader } from './SiteHeader';

const AppShell = ({ children }: { children: React.ReactNode }) => {

    const pathname = usePathname();
    const isFullScreenRoute = pathname?.startsWith("/workspace") || pathname?.startsWith("/shared");


    if(isFullScreenRoute) {
        return (
            <div className="flex flex-col min-h-screen">
                {children}
            </div>
        )
    }
  return (
    <>
        <SiteHeader/>
        <div className='flex flex-1 flex-col pt-18'>{children}</div>
        
    </>
  )
}

export default AppShell