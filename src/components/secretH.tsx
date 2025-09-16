'use client';
import { PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
    /** Hvor vi kom fra – bruges til tilbage-knappen på /admin */
    from?: string;
    /** Bevar evt. din normale H-klik-adfærd (fx åbne en help-modal) */
    onClick?: (e: React.MouseEvent) => void;
    title?: string;
    className?: string;
};

export default function SecretH({
                                    children,
                                    from = 'vault',
                                    onClick,
                                    title = 'Help',
                                    className,
                                }: PropsWithChildren<Props>) {
    const router = useRouter();

    function handleClick(e: React.MouseEvent) {
        // Hemmelig adgang: Shift + Alt + klik
        if (e.shiftKey && e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/admin?from=${from}`);
            return;
        }
        // Ellers kør din normale H-funktion
        onClick?.(e);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        // Tilgængelighed: Enter/Space + (Shift+Alt) virker også
        if ((e.key === 'Enter' || e.key === ' ') && e.shiftKey && e.altKey) {
            e.preventDefault();
            router.push(`/admin?from=${from}`);
        }
    }

    return (
        <span
            role="button"
            tabIndex={0}
            aria-label={title}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={`inline-flex select-none ${className ?? ''}`}
        >
      {children}
    </span>
    );
}
