import React, { useEffect, useState } from "react";
import "./BottomSheet.css";
import { Icon } from "@/components/ui/Icon";

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    showClose?: boolean;
    showHandle?: boolean;
}

export function BottomSheet({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    showClose = true,
    showHandle = true
}: BottomSheetProps) {
    if (!isOpen) return null;

    return (
        <div 
            className="bottom-sheet-overlay" 
            onClick={() => {
                console.log("BottomSheet: Overlay clicked");
                onClose();
            }}
        >
            <div 
                className="bottom-sheet-content" 
                onClick={e => e.stopPropagation()}
            >
                {showHandle && <div className="bottom-sheet-drag-handle" />}
                
                {(title || showClose) && (
                    <div className="bottom-sheet-header">
                        {title && <h3 className="bottom-sheet-title">{title}</h3>}
                        {showClose && (
                            <button 
                                className="bottom-sheet-close" 
                                onClick={() => {
                                    console.log("BottomSheet: X button clicked");
                                    onClose();
                                }} 
                                aria-label="Close"
                            >
                                <Icon name="close" size={20} color="#000" />
                            </button>
                        )}
                    </div>
                )}
                
                <div className="bottom-sheet-body">
                    {children}
                </div>
            </div>
        </div>
    );
}
