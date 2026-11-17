"use client";
import { PricingTable, useAuth } from '@clerk/nextjs';
import React, { createContext, useContext, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

type UpgradeReason = { title: string; description?: string };

const DEFAULT_REASONS: UpgradeReason = {
    title: "Upgrade Your Plan to Continue",
    description: "Your current plan does not support this feature. Please upgrade to continue.",
}

const UpgradeDialogContext = createContext<(reason?: UpgradeReason) => void>(() => {});

export function UpgradeDialogProvider({ children }: { children: React.ReactNode }) {

    const [reason, setReason] = useState<UpgradeReason | null>(null);
    const { orgId } = useAuth()
    const close = () => setReason(null);

  return (
    <UpgradeDialogContext.Provider value={(next) => setReason(next ?? DEFAULT_REASONS)} >
        {children}
        <Dialog
        modal = {false}
        open = {reason !== null}
        onOpenChange = {(open) => !open && close()}
        >
            <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-5xl'>
                <DialogHeader className='items-center text-center'>
                <DialogTitle className='text-2xl font-bold'>{reason?.title}</DialogTitle>
                {reason?.description && <DialogDescription className='text-sm text-muted-foreground'>{reason?.description}</DialogDescription>}
                </DialogHeader>
                <PricingTable for={orgId ? "organization" : "user"} />
            </DialogContent>
        </Dialog>
    </UpgradeDialogContext.Provider>
  )
}

export function useUpgradeDialog() {
    return useContext(UpgradeDialogContext);
}

export default UpgradeDialogProvider